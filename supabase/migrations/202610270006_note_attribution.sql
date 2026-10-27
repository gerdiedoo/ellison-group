-- Notes may be edited by staff, but their authorship, identity, timestamp and
-- originating record are evidence. RLS alone does not restrict UPDATE columns.
create function public.guard_note_attribution() returns trigger
language plpgsql set search_path=public as $$
begin
 if new.id is distinct from old.id
    or new.author_id is distinct from old.author_id
    or new.created_at is distinct from old.created_at
    or new.lead_id is distinct from old.lead_id
    or new.conversation_id is distinct from old.conversation_id then
   raise exception 'Note attribution and context cannot be changed';
 end if;
 return new;
end $$;
revoke all on function public.guard_note_attribution() from public, anon, authenticated;
create trigger guard_note_attribution before update on public.notes
for each row execute function public.guard_note_attribution();
