-- Explicit grants supplement RLS. TRUNCATE, REFERENCES and TRIGGER are not subject
-- to normal row policies; never inherit broad platform defaults for API roles.
revoke all privileges on table
 public.profiles, public.properties, public.leads, public.inquiries,
 public.lead_properties, public.notes, public.tasks, public.conversations,
 public.messages, public.favorites, public.settings, public.activity_logs,
 public.rate_limits
from public, anon, authenticated;

grant select on public.properties to anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on
 public.properties, public.leads, public.inquiries, public.lead_properties,
 public.notes, public.tasks, public.conversations
to authenticated;
grant select on public.messages, public.activity_logs to authenticated;
grant select, update on public.settings to authenticated;
grant select, insert, delete on public.favorites to authenticated;

-- Do not assume that service-role table defaults were installed by a host.
-- This credential is server-only; browser users can never select this DB role.
grant select, insert, update, delete on
 public.profiles, public.properties, public.leads, public.inquiries,
 public.lead_properties, public.notes, public.tasks, public.conversations,
 public.messages, public.favorites, public.settings, public.activity_logs,
 public.rate_limits
to service_role;
revoke all privileges on sequence public.activity_logs_id_seq from public, anon, authenticated;
grant usage, select on sequence public.activity_logs_id_seq to service_role;

-- Auth users can predate installation of this application's signup trigger.
-- Backfill visitor profiles only, ignoring role claims in user-editable metadata.
insert into public.profiles(id, full_name)
 select id, coalesce(raw_user_meta_data->>'full_name', '') from auth.users
 on conflict(id) do nothing;
