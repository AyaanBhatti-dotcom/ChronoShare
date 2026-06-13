-- Profile fields for signup onboarding

alter table public.profiles
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists profile_setup_completed_at timestamptz,
  add column if not exists mfa_enabled boolean not null default false;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

-- Avatar storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Existing users skip signup onboarding
update public.profiles
set profile_setup_completed_at = coalesce(profile_setup_completed_at, created_at)
where profile_setup_completed_at is null;
