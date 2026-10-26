-- Validate assignments in the database as well as Server Actions.
create function public.guard_assignment() returns trigger language plpgsql security definer set search_path=public as $$ begin
 if new.assigned_to is not null and not exists(select 1 from profiles where id=new.assigned_to and active and role in ('agent','admin')) then raise exception 'Assignment requires an active staff profile'; end if;
 return new; end $$;
do $$declare t text;begin foreach t in array array['properties','leads','inquiries','tasks','conversations'] loop
 execute format('create trigger guard_assignment before insert or update of assigned_to on public.%I for each row execute function public.guard_assignment()',t);end loop;end$$;
-- Serialize agent replies against bot resume and resolution; update inbox timestamps.
create function public.agent_reply(p_id uuid,p_body text) returns uuid language plpgsql security definer set search_path=public as $$
 declare c conversations; mid uuid; begin
 if not is_staff() then raise exception 'Staff access required'; end if;
 if length(trim(p_body)) not between 1 and 10000 then raise exception 'Reply must contain 1 to 10000 characters'; end if;
 select * into c from conversations where id=p_id for update;
 if not found or c.status<>'human' then raise exception 'Enable human handling to reply'; end if;
 insert into messages(conversation_id,sender,body,author_id) values(c.id,'agent',trim(p_body),auth.uid()) returning id into mid;
 update conversations set processing_until=null where id=c.id;
 return mid; end $$;
revoke all on function public.agent_reply(uuid,text) from public,anon;
grant execute on function public.agent_reply(uuid,text) to authenticated;
revoke insert on public.messages from authenticated;
drop policy agent_reply on public.messages;
-- Additional foreign-key lookup indexes for staff workflows.
create index notes_lead on public.notes(lead_id,created_at);
create index notes_conversation on public.notes(conversation_id,created_at);
create index tasks_lead on public.tasks(lead_id,due_at);
create index tasks_due on public.tasks(done,due_at);
create index leads_assigned on public.leads(assigned_to);
create index inquiries_assigned on public.inquiries(assigned_to,status);
create index conversations_assigned on public.conversations(assigned_to,status);
-- New incoming contact details remain part of each inquiry even when the existing
-- lead identity is deliberately not overwritten by an anonymous repeat submission.
create function public.preserve_submission_contact() returns trigger language plpgsql set search_path=public as $$begin
 if jsonb_typeof(new.context)<>'object' then raise exception 'Inquiry context must be an object';end if;return new;end$$;
create trigger validate_inquiry_context before insert or update on public.inquiries for each row execute function public.preserve_submission_contact();
