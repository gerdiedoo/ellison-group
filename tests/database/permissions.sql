\set ON_ERROR_STOP on
begin;
create function pg_temp.assert_true(value boolean,label text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end$$;
insert into auth.users(id,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000001','{"full_name":"Admin"}'),
 ('00000000-0000-4000-8000-000000000002','{"full_name":"Agent","role":"admin"}'),
 ('00000000-0000-4000-8000-000000000003','{"full_name":"Visitor","role":"admin"}');
select pg_temp.assert_true((select role='visitor' from profiles where id='00000000-0000-4000-8000-000000000003'),'Auth metadata cannot grant administrator privileges');
update profiles set role='admin' where id='00000000-0000-4000-8000-000000000001';
update profiles set role='agent' where id='00000000-0000-4000-8000-000000000002';
insert into properties(id,slug,address,location,neighborhood,price,published) values
 ('00000000-0000-4000-8000-000000000010','published-home','Published Home','Little Rock','Chenal',500000,true),
 ('00000000-0000-4000-8000-000000000011','private-draft','Private Draft','Little Rock','Chenal',900000,false);
set local role anon;
select pg_temp.assert_true((select count(*)=1 from properties),'Anonymous users see only published properties');
do $$begin
 begin perform pg_temp.assert_true((select count(*)=0 from leads),'Anonymous lead data blocked by RLS'); exception when insufficient_privilege then raise notice 'PASS: anonymous lead data blocked by privileges'; end;
 if has_function_privilege('anon','public.capture_inquiry(jsonb,text)','EXECUTE') then raise exception 'Anonymous RPC access'; end if;
 if has_function_privilege('authenticated','public.begin_chat(uuid,text,text,boolean)','EXECUTE') then raise exception 'Client chat RPC access'; end if;
end$$;
reset role;
set local role service_role;
select capture_inquiry('{"request_id":"00000000-0000-4000-8000-000000000020","full_name":"Original Name","email":" TEST@Example.COM ","phone":"5015551234","kind":"Property question","property_id":"00000000-0000-4000-8000-000000000010","consent_text":"Agreed","message":"First"}');
select capture_inquiry('{"request_id":"00000000-0000-4000-8000-000000000021","full_name":"Do Not Overwrite","email":"test@example.com","phone":"","kind":"General","consent_text":"Agreed","message":"Second"}');
select capture_inquiry('{"request_id":"00000000-0000-4000-8000-000000000021","full_name":"Retry","email":"test@example.com","kind":"General","consent_text":"Agreed"}');
reset role;
select pg_temp.assert_true((select count(*)=1 from leads),'Normalized email deduplicates returning leads');
select pg_temp.assert_true((select count(*)=2 from inquiries),'Returning inquiries persist, retries are idempotent');
select pg_temp.assert_true((select full_name='Original Name' from leads),'Anonymous repeat cannot overwrite original lead details');
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from leads),'Visitors cannot read private leads');
select pg_temp.assert_true((select count(*)=0 from messages),'Visitors cannot read conversation messages');
select pg_temp.assert_true((select count(*)=0 from settings),'Visitors cannot read administrative settings');
insert into favorites(user_id,property_id) values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000010');
select pg_temp.assert_true((select count(*)=1 from favorites),'Visitors can manage their own favorites');
do $$begin begin insert into favorites(user_id,property_id) values('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010');raise exception 'Must reject another user favorite'; exception when insufficient_privilege then raise notice 'PASS: cross-user favorites blocked';end;end$$;
reset role;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.assert_true((select count(*)=1 from leads),'Staff can read leads');
update settings set value='{}' where key='company';
select pg_temp.assert_true((select value->>'name'='The Ellison Group' from settings where key='company'),'Agents cannot change admin settings');
update profiles set role='admin' where id='00000000-0000-4000-8000-000000000002';
select pg_temp.assert_true((select role='agent' from profiles where id='00000000-0000-4000-8000-000000000002'),'Agents cannot promote themselves');
do $$begin begin delete from activity_logs;raise exception 'Must reject audit deletion';exception when insufficient_privilege then raise notice 'PASS: audit deletion blocked';end;end$$;
reset role;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$begin begin update profiles set role='agent' where id=auth.uid();raise exception 'Must reject own access change';exception when raise_exception then if sqlerrm not like '%cannot change your own%' then raise;end if;raise notice 'PASS: admins cannot change own access';end;end$$;
reset role;
set local request.jwt.claim.sub='';
insert into conversations(id,visitor_hash) values('00000000-0000-4000-8000-000000000030','visitor-a');
set local role service_role;
do $$declare lease jsonb;begin
 lease=begin_chat('00000000-0000-4000-8000-000000000030','visitor-a','Find a home',false);
 perform begin_chat('00000000-0000-4000-8000-000000000030','visitor-a','Human please',true);
 perform pg_temp.assert_true(not finish_chat('00000000-0000-4000-8000-000000000030','visitor-a',(lease->>'revision')::integer,'LATE BOT'),'Handoff rejects an in-flight bot reply');
 begin perform begin_chat('00000000-0000-4000-8000-000000000030','visitor-b','Steal chat',false);raise exception 'Must reject other visitor';exception when raise_exception then if sqlerrm not like '%Conversation unavailable%' then raise;end if;raise notice 'PASS: visitor hash isolates conversations';end;
 perform pg_temp.assert_true(consume_rate('test-limit',1,600),'Rate limiter permits first call');
 perform pg_temp.assert_true(not consume_rate('test-limit',1,600),'Rate limiter blocks excess calls');
end$$;
reset role;

select pg_temp.assert_true((select bool_and(relrowsecurity) from pg_class where relnamespace='public'::regnamespace and relname in ('profiles','properties','leads','inquiries','lead_properties','notes','tasks','conversations','messages','favorites','settings','activity_logs','rate_limits')),'RLS enabled on every application table');
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
set local role authenticated;
select agent_reply('00000000-0000-4000-8000-000000000030','Hello from the team');
select pg_temp.assert_true((select count(*)=1 from messages where sender='agent'),'Authorized human reply persists in the shared transcript');
select pg_temp.assert_true((select count(*)=1 from search_conversations('Hello from the team')),'Inbox searches the persistent transcript');
update conversations set status='bot',processing_until=null where id='00000000-0000-4000-8000-000000000030';
do $$begin
 begin perform agent_reply('00000000-0000-4000-8000-000000000030','Must fail');raise exception 'Must reject bot-state staff reply';exception when raise_exception then if sqlerrm not like '%Enable human handling%' then raise;end if;raise notice 'PASS: staff replies require human handling';end;
 begin update leads set assigned_to='00000000-0000-4000-8000-000000000003';raise exception 'Must reject visitor assignment';exception when raise_exception then if sqlerrm not like '%active staff profile%' then raise;end if;raise notice 'PASS: assignments require active staff';end;
end$$;
insert into storage.objects(bucket_id,name) values('property-images','properties/00000000-0000-4000-8000-000000000010/photo.jpg');
select pg_temp.assert_true((select count(*)=1 from storage.objects),'Staff can insert photos under a valid property path');
do $$begin begin insert into storage.objects(bucket_id,name) values('property-images','private-documents/secret.jpg');raise exception 'Must reject invalid storage path';exception when insufficient_privilege then raise notice 'PASS: arbitrary upload paths blocked';end;end$$;
reset role;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from favorites),'Other visitors cannot see favorites owned by a different account');
reset role;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
set local role authenticated;
do $$begin begin insert into storage.objects(bucket_id,name) values('property-images','properties/00000000-0000-4000-8000-000000000010/visitor.jpg');raise exception 'Must reject visitor upload';exception when insufficient_privilege then raise notice 'PASS: visitor image uploads blocked';end;end$$;
reset role;
set local request.jwt.claim.sub='';
set local role service_role;
do $$declare lease jsonb;begin
 lease=begin_chat('00000000-0000-4000-8000-000000000030','visitor-a','Resume test',false);
 perform pg_temp.assert_true(finish_chat('00000000-0000-4000-8000-000000000030','visitor-a',(lease->>'revision')::integer,'Verified bot response'),'Explicit staff resume permits bot replies again');
end$$;
reset role;
select pg_temp.assert_true((select count(*)>0 from activity_logs),'Changes produce server audit records');
rollback;
