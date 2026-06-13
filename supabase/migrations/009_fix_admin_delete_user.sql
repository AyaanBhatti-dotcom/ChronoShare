-- Fix admin user deletion: clear exchanges/posts first (exchanges.post_id is ON DELETE RESTRICT)

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
  v_deleted int;
begin
  if not public.admin_verify_key(p_key) then
    raise exception 'Invalid admin key';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User not found';
  end if;

  -- Exchanges block post deletes (post_id ON DELETE RESTRICT)
  delete from public.exchanges
  where poster_id = p_user_id
     or acceptor_id = p_user_id
     or post_id in (select id from public.posts where user_id = p_user_id);

  delete from public.posts where user_id = p_user_id;

  delete from storage.objects
  where bucket_id = 'avatars'
    and (storage.foldername(name))[1] = p_user_id::text;

  delete from auth.users where id = p_user_id;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    -- Orphan profile (no auth row): remove profile directly
    delete from public.profiles where id = p_user_id;
    if not found then
      raise exception 'User could not be deleted';
    end if;
  end if;
end;
$$;

grant execute on function public.admin_delete_user(text, uuid) to anon, authenticated;
