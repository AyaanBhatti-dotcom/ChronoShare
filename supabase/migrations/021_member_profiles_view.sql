-- Public profile fields for community members (excludes email and other private data).
-- The view runs as owner so authenticated clients can read partner profiles without
-- opening full profile row access on the base table.

create or replace view public.member_profiles as
select
  id,
  full_name,
  username,
  avatar_url,
  city,
  state,
  country,
  hours_available,
  mfa_enabled,
  created_at
from public.profiles;

grant select on public.member_profiles to authenticated;
