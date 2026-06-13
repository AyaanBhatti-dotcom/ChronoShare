-- Track whether a user has completed the onboarding flow
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

-- Existing users are treated as already onboarded
update public.profiles
set onboarding_completed_at = now()
where onboarding_completed_at is null;

-- Ensure users can update their own onboarding status (WITH CHECK for RLS)
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
