-- Staff-only search over the persistent inbox, including full stored transcripts.
create function public.search_conversations(p_query text default '') returns setof public.conversations language sql stable security invoker set search_path=public as $$
 select c.* from conversations c where is_staff() and
 (trim(p_query)='' or exists(select 1 from leads l where l.id=c.lead_id and (l.full_name ilike '%'||replace(replace(replace(p_query,'\','\\'),'%','\%'),'_','\_')||'%' or l.email ilike '%'||replace(replace(replace(p_query,'\','\\'),'%','\%'),'_','\_')||'%'))
 or exists(select 1 from messages m where m.conversation_id=c.id and m.body ilike '%'||replace(replace(replace(p_query,'\','\\'),'%','\%'),'_','\_')||'%'));
$$;
revoke all on function public.search_conversations(text) from public,anon;
grant execute on function public.search_conversations(text) to authenticated;
