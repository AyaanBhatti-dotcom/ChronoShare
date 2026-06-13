-- Complete admin user purge: storage avatars, exchanges, posts, auth identity, profile.

create or replace function public.admin_delete_user(
  p_key text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  v_auth_deleted int;
  v_profile_deleted int;
  v_user_exists boolean;
begin
  if not public.admin_verify_key(p_key) then
    raise exception 'Invalid admin key';
  end if;

  v_user_exists := exists (select 1 from auth.users where id = p_user_id)
    or exists (select 1 from public.profiles where id = p_user_id);

  if not v_user_exists then
    raise exception 'User not found';
  end if;

  -- Avatar files (Supabase blocks direct storage deletes unless this flag is set)
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects
  where bucket_id = 'avatars'
    and (storage.foldername(name))[1] = p_user_id::text;

  -- Exchanges must go before posts (post_id is ON DELETE RESTRICT)
  delete from public.exchanges
  where poster_id = p_user_id
     or acceptor_id = p_user_id
     or post_id in (select id from public.posts where user_id = p_user_id);

  delete from public.posts where user_id = p_user_id;

  -- Removes auth.users and cascades to identities, sessions, tokens, MFA, profile, etc.
  delete from auth.users where id = p_user_id;
  get diagnostics v_auth_deleted = row_count;

  if v_auth_deleted = 0 then
    delete from public.profiles where id = p_user_id;
    get diagnostics v_profile_deleted = row_count;

    if v_profile_deleted = 0 then
      raise exception 'User could not be deleted';
    end if;
  end if;
end;
$$;

grant execute on function public.admin_delete_user(text, uuid) to anon, authenticated;
