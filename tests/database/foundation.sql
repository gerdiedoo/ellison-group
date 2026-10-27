\set ON_ERROR_STOP on
begin;
create function pg_temp.assert_true(value boolean,label text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',label; end if;raise notice 'PASS: %',label;end$$;
select pg_temp.assert_true((select role='visitor' and active and full_name='Existing Account' from public.profiles where id='00000000-0000-4000-8000-000000000004'),'Existing Auth accounts receive visitor profiles without metadata privileges');
-- RLS does not apply to TRUNCATE. Test the actual grants, not just row visibility.
do $$declare t text; r text;begin
 foreach t in array array['profiles','properties','leads','inquiries','lead_properties','notes','tasks','conversations','messages','favorites','settings','activity_logs','rate_limits'] loop
  foreach r in array array['anon','authenticated'] loop
   if has_table_privilege(r,'public.'||t,'TRUNCATE') or has_table_privilege(r,'public.'||t,'TRIGGER') or has_table_privilege(r,'public.'||t,'REFERENCES') then raise exception 'Excess privilege for % on %',r,t;end if;
  end loop;
 end loop;
 raise notice 'PASS: API roles have no TRUNCATE, TRIGGER or REFERENCES grants on application tables';
end$$;
select pg_temp.assert_true(not has_sequence_privilege('authenticated','public.activity_logs_id_seq','USAGE'),'Audit sequence is not client-writable');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.messages','INSERT'),'Direct client replies cannot bypass serialized agent_reply');
select pg_temp.assert_true(not has_table_privilege('anon','public.leads','SELECT'),'Anonymous roles have no direct lead table grant');
set local role service_role;
select pg_temp.assert_true((select count(*)=3 from settings),'Server role has explicit access to application settings');
reset role;
insert into auth.users(id,raw_user_meta_data) values('00000000-0000-4000-8000-000000000101','{"full_name":"Foundation Agent"}');
update profiles set role='agent' where id='00000000-0000-4000-8000-000000000101';
insert into properties(slug,address,location,neighborhood,price,published) values('foundation-check','123 Foundation','Little Rock','Chenal',500000,false);
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000101';
set local role authenticated;
select pg_temp.assert_true((select count(*)=1 from properties),'Active staff can read draft properties');
do $$begin begin truncate table public.properties cascade;raise exception 'Must reject staff TRUNCATE';exception when insufficient_privilege then raise notice 'PASS: Staff cannot bypass row policies with TRUNCATE';end;end$$;
reset role;
set local request.jwt.claim.sub='';
update profiles set active=false where id='00000000-0000-4000-8000-000000000101';
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000101';
set local role authenticated;
select pg_temp.assert_true(not is_staff(),'Inactive agents fail the database staff guard');
select pg_temp.assert_true((select count(*)=0 from properties),'Inactive agents cannot read draft properties');
select pg_temp.assert_true((select count(*)=0 from settings),'Inactive agents cannot read private configuration');
reset role;
rollback;
