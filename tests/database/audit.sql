\set ON_ERROR_STOP on
begin;
create function pg_temp.assert_true(value boolean,label text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',label; end if;raise notice 'PASS: %',label;end$$;
insert into auth.users(id,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000201','{"full_name":"Audit Agent"}'),
 ('00000000-0000-4000-8000-000000000202','{"full_name":"Other Agent"}');
update profiles set role='agent' where id in ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202');
insert into leads(id,full_name,email,consent_at,consent_text) values('00000000-0000-4000-8000-000000000203','Audit Lead','audit@example.com',now(),'Test permission');
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000201';
set local role authenticated;
insert into notes(id,lead_id,body) values('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000203','Original note');
update notes set body='Corrected note' where id='00000000-0000-4000-8000-000000000204';
select pg_temp.assert_true((select body='Corrected note' and author_id=auth.uid() from notes where id='00000000-0000-4000-8000-000000000204'),'Staff can edit note text without changing attribution');
do $$begin
 begin update notes set author_id='00000000-0000-4000-8000-000000000202' where id='00000000-0000-4000-8000-000000000204';raise exception 'Expected attribution rejection';
 exception when raise_exception then if sqlerrm='Expected attribution rejection' then raise;end if;raise notice 'PASS: Staff cannot forge another author on an existing note';end;
 begin update notes set created_at=now()-interval '1 year' where id='00000000-0000-4000-8000-000000000204';raise exception 'Expected timestamp rejection';
 exception when raise_exception then if sqlerrm='Expected timestamp rejection' then raise;end if;raise notice 'PASS: Staff cannot backdate an existing note';end;
 begin update notes set conversation_id=gen_random_uuid() where id='00000000-0000-4000-8000-000000000204';raise exception 'Expected context rejection';
 exception when raise_exception then if sqlerrm='Expected context rejection' then raise;end if;raise notice 'PASS: Staff cannot relocate note context';end;
end$$;
select pg_temp.assert_true((select count(*)>0 from activity_logs where entity_type='notes' and action='UPDATE' and entity_id='00000000-0000-4000-8000-000000000204'),'Note edits create immutable audit records');
reset role;
rollback;
