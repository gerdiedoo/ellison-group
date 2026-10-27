-- The Ellison Group: private CRM and explicitly public listing catalog.
create extension if not exists pgcrypto;
create type public.team_role as enum ('visitor','agent','admin');
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 full_name text not null default '', role public.team_role not null default 'visitor',
 active boolean not null default true, created_at timestamptz not null default now()
);
create function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where id=auth.uid() and active and role in ('agent','admin'));
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where id=auth.uid() and active and role='admin');
$$;
create function public.new_profile() returns trigger language plpgsql security definer set search_path=public as $$ begin
 insert into profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')); return new; end $$;
create trigger auth_profile after insert on auth.users for each row execute function public.new_profile();
create table public.properties (
 id uuid primary key default gen_random_uuid(), slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 address text not null check(length(address) between 3 and 240), location text not null, neighborhood text not null,
 property_type text not null default 'Single-family', price numeric(14,2) not null check(price>=0), beds integer not null default 0 check(beds>=0),
 baths numeric(4,1) not null default 0 check(baths>=0), sqft integer not null default 0 check(sqft>=0),
 description text not null default '', features text[] not null default '{}', images text[] not null default '{}',
 illustration text not null default 'stone' check(illustration in ('stone','stucco','brick','columns','porch','ranch','tower','lot')),
 listing_status text not null default 'For Sale' check(listing_status in ('For Sale','Pending','Sold')),
 published boolean not null default false, assigned_to uuid references profiles on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index properties_catalog on public.properties(published,neighborhood,price);
create table public.leads (
 id uuid primary key default gen_random_uuid(), full_name text not null, email text not null unique check(email=lower(trim(email))),
 phone text not null default '', source text not null default 'form', status text not null default 'New' check(status in ('New','Contacted','Qualified','Appointment Scheduled','Nurturing','Converted','Lost')),
 assigned_to uuid references profiles on delete set null, consent_at timestamptz not null, consent_text text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index leads_status on public.leads(status,assigned_to);
create table public.inquiries (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references leads on delete cascade,
 property_id uuid references properties on delete set null, kind text not null check(kind in ('General','Property question','Showing request','Valuation request','Newsletter','Chatbot handoff')),
 message text not null default '', context jsonb not null default '{}', preferred_date date,
 status text not null default 'New' check(status in ('New','In progress','Responded','Scheduled','Closed')),
 assigned_to uuid references profiles on delete set null, created_at timestamptz not null default now(),
 request_id uuid not null unique
);
create index inquiries_lead on public.inquiries(lead_id,created_at);
create index inquiries_property on public.inquiries(property_id);
create table public.lead_properties (
 lead_id uuid references leads on delete cascade, property_id uuid references properties on delete cascade,
 primary key(lead_id,property_id)
);
create table public.notes (
 id uuid primary key default gen_random_uuid(), lead_id uuid references leads on delete cascade,
 conversation_id uuid, body text not null check(length(body) between 1 and 10000),
 author_id uuid not null default auth.uid() references profiles, created_at timestamptz not null default now(),
 check(lead_id is not null or conversation_id is not null)
);
create table public.tasks (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references leads on delete cascade,
 title text not null check(length(title) between 1 and 500), due_at timestamptz not null, done boolean not null default false,
 assigned_to uuid references profiles on delete set null, created_at timestamptz not null default now()
);
create table public.conversations (
 id uuid primary key default gen_random_uuid(), visitor_hash text not null, lead_id uuid references leads on delete set null,
 property_id uuid references properties on delete set null, assigned_to uuid references profiles on delete set null,
 status text not null default 'bot' check(status in ('bot','human','resolved')),
 revision integer not null default 0, processing_until timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index conversations_visitor on public.conversations(visitor_hash);
alter table public.notes add foreign key(conversation_id) references conversations on delete cascade;
create table public.messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references conversations on delete cascade,
 sender text not null check(sender in ('visitor','assistant','agent','system')), body text not null check(length(body) between 1 and 16000),
 author_id uuid references profiles, created_at timestamptz not null default now()
);
create index messages_conversation on public.messages(conversation_id,created_at);
create table public.favorites (
 user_id uuid references auth.users on delete cascade, property_id uuid references properties on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,property_id)
);
create table public.settings (
 key text primary key check(key in ('company','assistant','capture')), value jsonb not null,
 updated_at timestamptz not null default now()
);
insert into public.settings(key,value) values
 ('company','{"name":"The Ellison Group","phone":"(501) 725-1227","address":"12814 Cantrell Rd, Little Rock, AR 72223","email":"","instagram":"https://www.instagram.com/theellisongroup"}'),
 ('assistant','{"enabled":true,"welcome":"Welcome to The Ellison Group. How can we help you find your place?","tone":"Warm, personal and unhurried","instructions":"Help visitors explore published homes and connect with our team.","handoffEnabled":true}'),
 ('capture','{"headline":"Find your place with us.","description":"Tell us a little about yourself so our team can help.","phoneRequired":true,"phoneLabel":"Phone number","messageLabel":"Message","googleEnabled":false}');
create table public.activity_logs (
 id bigint generated always as identity primary key, actor_id uuid references profiles on delete set null,
 action text not null, entity_type text not null, entity_id text not null,
 details jsonb not null default '{}', created_at timestamptz not null default now()
);
create index activity_created on public.activity_logs(created_at desc);
create table public.rate_limits (key text primary key, window_start timestamptz not null default now(), hits integer not null default 1);
-- Atomic database limiter shared across application instances. Keys are salted hashes.
create function public.consume_rate(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path=public as $$
 declare n integer; begin
 insert into rate_limits(key) values(p_key) on conflict(key) do update set
 hits=case when rate_limits.window_start < now()-make_interval(secs=>p_seconds) then 1 else rate_limits.hits+1 end,
 window_start=case when rate_limits.window_start < now()-make_interval(secs=>p_seconds) then now() else rate_limits.window_start end returning hits into n;
 return n<=p_limit; end $$;
create function public.touch_row() returns trigger language plpgsql set search_path=public as $$ begin
 new.updated_at=now(); if tg_table_name='conversations' then new.revision=old.revision+1; end if; return new; end $$;
create function public.audit_row() returns trigger language plpgsql security definer set search_path=public as $$
 declare r jsonb; begin
 r=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 insert into activity_logs(actor_id,action,entity_type,entity_id,details) values(auth.uid(),tg_op,tg_table_name,coalesce(r->>'id',r->>'key',r->>'lead_id',''),jsonb_build_object('changed_fields',case when tg_op='UPDATE' then (select jsonb_agg(key) from jsonb_each(to_jsonb(new)) where value is distinct from to_jsonb(old)->key) else null end));
 return case when tg_op='DELETE' then old else new end; end $$;
create function public.guard_profile() returns trigger language plpgsql set search_path=public as $$ begin
 if auth.uid()=old.id and (new.role<>old.role or new.active<>old.active) then raise exception 'You cannot change your own access'; end if;
 return new; end $$;
create trigger guard_profile before update on profiles for each row execute function public.guard_profile();
do $$ declare t text; begin
 foreach t in array array['properties','leads','conversations','settings'] loop
 execute format('create trigger touch before update on public.%I for each row execute function public.touch_row()',t); end loop;
 foreach t in array array['profiles','properties','leads','inquiries','lead_properties','notes','tasks','conversations','messages','settings'] loop
 execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.audit_row()',t); end loop;
 foreach t in array array['profiles','properties','leads','inquiries','lead_properties','notes','tasks','conversations','messages','favorites','settings','activity_logs','rate_limits'] loop
 execute format('alter table public.%I enable row level security',t); end loop;
end $$;
create policy profiles_read on profiles for select to authenticated using(id=auth.uid() or is_staff());
create policy profiles_admin on profiles for update to authenticated using(is_admin()) with check(is_admin());
create policy catalog_read on properties for select to anon,authenticated using(published or is_staff());
create policy catalog_write on properties for all to authenticated using(is_staff()) with check(is_staff());
do $$ declare t text; begin
 foreach t in array array['leads','inquiries','lead_properties','notes','tasks','conversations'] loop
 execute format('create policy staff_access on public.%I for all to authenticated using(public.is_staff()) with check(public.is_staff())',t); end loop;
end $$;
create policy notes_author on notes as restrictive for insert to authenticated with check(author_id=auth.uid());
create policy messages_read on messages for select to authenticated using(is_staff());
create policy agent_reply on messages for insert to authenticated with check(is_staff() and sender='agent' and author_id=auth.uid() and exists(select 1 from conversations where id=conversation_id and status='human'));
create policy settings_read on settings for select to authenticated using(is_staff());
create policy settings_write on settings for update to authenticated using(is_admin()) with check(is_admin());
create policy activity_read on activity_logs for select to authenticated using(is_staff());
create policy own_favorites on favorites for select to authenticated using(user_id=auth.uid());
create policy own_favorites_insert on favorites for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from properties where id=property_id and published));
create policy own_favorites_delete on favorites for delete to authenticated using(user_id=auth.uid());
-- All public writes are server-only RPCs; callers cannot choose lead IDs or roles.
create function public.capture_inquiry(p_data jsonb,p_visitor_hash text default null) returns uuid language plpgsql security definer set search_path=public as $$
 declare lid uuid; iid uuid; pid uuid; cid uuid; begin
 select id into iid from inquiries where request_id=(p_data->>'request_id')::uuid;
 if iid is not null then return iid; end if;
 pid=nullif(p_data->>'property_id','')::uuid; cid=nullif(p_data->>'conversation_id','')::uuid;
 if pid is not null and not exists(select 1 from properties where id=pid and published) then raise exception 'Property unavailable'; end if;
 if cid is not null and not exists(select 1 from conversations where id=cid and visitor_hash=p_visitor_hash) then raise exception 'Conversation unavailable'; end if;
 insert into leads(full_name,email,phone,source,consent_at,consent_text)
 values(p_data->>'full_name',lower(trim(p_data->>'email')),coalesce(p_data->>'phone',''),case when cid is null then 'form' else 'chatbot' end,now(),p_data->>'consent_text')
 on conflict(email) do update set updated_at=now() returning id into lid;
 -- Preserve existing name, phone, notes and history: an anonymous repeat submission must not overwrite a lead.
 insert into inquiries(lead_id,property_id,kind,message,context,preferred_date,request_id)
 values(lid,pid,p_data->>'kind',coalesce(p_data->>'message',''),coalesce(p_data->'context','{}'),nullif(p_data->>'preferred_date','')::date,(p_data->>'request_id')::uuid) returning id into iid;
 if pid is not null then insert into lead_properties values(lid,pid) on conflict do nothing; end if;
 if cid is not null then update conversations set lead_id=lid,status='human' where id=cid; end if;
 return iid;
 exception when unique_violation then select id into iid from inquiries where request_id=(p_data->>'request_id')::uuid; if iid is null then raise; end if; return iid;
 end $$;
-- A short processing lease serializes visitor messages. Revision checks prevent a late
-- Gemini response from being inserted after handoff, agent reply, or resolution.
create function public.begin_chat(p_id uuid,p_hash text,p_body text,p_handoff boolean) returns jsonb language plpgsql security definer set search_path=public as $$
 declare c conversations; begin
 select * into c from conversations where id=p_id and visitor_hash=p_hash for update;
 if not found then raise exception 'Conversation unavailable'; end if;
 if c.status='resolved' then raise exception 'Conversation resolved'; end if;
 if c.processing_until>now() and c.status='bot' and not p_handoff then raise exception 'Please wait for the previous response'; end if;
 insert into messages(conversation_id,sender,body) values(c.id,'visitor',p_body);
 update conversations set status=case when p_handoff then 'human' else status end,processing_until=case when not p_handoff and status='bot' then now()+interval '60 seconds' else null end where id=c.id returning * into c;
 return jsonb_build_object('status',c.status,'revision',c.revision);
 end $$;
create function public.finish_chat(p_id uuid,p_hash text,p_revision integer,p_body text) returns boolean language plpgsql security definer set search_path=public as $$
 declare c conversations; begin
 select * into c from conversations where id=p_id and visitor_hash=p_hash for update;
 if not found or c.status<>'bot' or c.revision<>p_revision then return false; end if;
 insert into messages(conversation_id,sender,body) values(c.id,'assistant',p_body);
 update conversations set processing_until=null where id=c.id; return true; end $$;
-- Remove default PUBLIC function execution, including helper RPCs.
revoke all on function public.consume_rate(text,integer,integer),public.capture_inquiry(jsonb,text),public.begin_chat(uuid,text,text,boolean),public.finish_chat(uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.consume_rate(text,integer,integer),public.capture_inquiry(jsonb,text),public.begin_chat(uuid,text,text,boolean),public.finish_chat(uuid,text,integer,text) to service_role;
revoke all on public.rate_limits from anon,authenticated;
revoke insert,update,delete on public.activity_logs from anon,authenticated;
grant select on public.properties to anon;
grant select,insert,update,delete on public.profiles,public.properties,public.leads,public.inquiries,public.lead_properties,public.notes,public.tasks,public.conversations,public.messages,public.favorites,public.settings to authenticated;
grant select on public.activity_logs to authenticated;
-- Public bucket contains only listing photography. Staff uploads are constrained by
-- bucket, path, MIME and size. Lead attachments must never be stored here.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('property-images','property-images',true,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy property_photo_read on storage.objects for select to anon,authenticated using(bucket_id='property-images');
create policy property_photo_insert on storage.objects for insert to authenticated with check(bucket_id='property-images' and public.is_staff() and (storage.foldername(name))[1]='properties' and exists(select 1 from public.properties where id::text=(storage.foldername(name))[2]));
create policy property_photo_delete on storage.objects for delete to authenticated using(bucket_id='property-images' and public.is_staff());
