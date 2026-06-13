-- Remove direct storage.objects deletes (Supabase requires Storage API instead)

create or replace function public.admin_delete_user(
  p_key text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
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

  delete from public.exchanges
  where poster_id = p_user_id
     or acceptor_id = p_user_id
     or post_id in (select id from public.posts where user_id = p_user_id);

  delete from public.posts where user_id = p_user_id;

  delete from auth.users where id = p_user_id;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    delete from public.profiles where id = p_user_id;
    if not found then
      raise exception 'User could not be deleted';
    end if;
  end if;
end;
$$;

grant execute on function public.admin_delete_user(text, uuid) to anon, authenticated;
