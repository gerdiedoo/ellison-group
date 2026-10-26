create function public.crm_analytics() returns jsonb language plpgsql stable security invoker set search_path=public as $$ begin
 if not is_staff() then raise exception 'Staff access required'; end if;
 return jsonb_build_object(
 'sources',(select coalesce(jsonb_agg(x),'[]') from (select source label,count(*) value from leads group by source order by count(*) desc)x),
 'stages',(select coalesce(jsonb_agg(x),'[]') from (select status label,count(*) value from leads group by status order by count(*) desc)x),
 'properties',(select coalesce(jsonb_agg(x),'[]') from (select coalesce(p.address,'General inquiry') label,count(*) value from inquiries i left join properties p on p.id=i.property_id group by p.address order by count(*) desc limit 20)x),
 'conversations',(select coalesce(jsonb_agg(x),'[]') from (select status label,count(*) value from conversations group by status)x),
 'messages',(select coalesce(jsonb_agg(x),'[]') from (select sender label,count(*) value from messages group by sender)x)); end $$;
revoke all on function public.crm_analytics() from public,anon;
grant execute on function public.crm_analytics() to authenticated;
