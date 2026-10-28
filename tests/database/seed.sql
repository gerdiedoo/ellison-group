do $$
begin
  if (select count(*) from public.properties where slug = 'qa-fictional-home-001') <> 1 then
    raise exception 'QA seed must be idempotent';
  end if;
  if exists (select 1 from public.properties where slug = 'qa-fictional-home-001' and published) then
    raise exception 'QA seed must remain unpublished';
  end if;
end;
$$;
