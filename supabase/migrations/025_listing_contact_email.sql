-- Expose member email only in listing or exchange context (not globally).

create or replace function public.get_member_contact_email(
  p_member_id uuid,
  p_post_id uuid default null,
  p_exchange_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_email text;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if p_member_id is null or p_member_id = v_caller then
    return null;
  end if;

  if public.users_are_blocked(v_caller, p_member_id) then
    return null;
  end if;

  if p_post_id is not null then
    if not exists (
      select 1
      from public.posts
      where id = p_post_id
        and user_id = p_member_id
        and status = 'active'
    ) then
      raise exception 'Listing not found or not available';
    end if;
  elsif p_exchange_id is not null then
    if not exists (
      select 1
      from public.exchanges e
      where e.id = p_exchange_id
        and e.status in ('pending', 'completed')
        and (
          (e.poster_id = v_caller and e.acceptor_id = p_member_id)
          or (e.acceptor_id = v_caller and e.poster_id = p_member_id)
        )
    ) then
      raise exception 'Exchange not found or access denied';
    end if;
  else
    raise exception 'Listing or exchange context required';
  end if;

  select coalesce(nullif(p.email, ''), u.email)
  into v_email
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = p_member_id;

  return nullif(trim(v_email), '');
end;
$$;

grant execute on function public.get_member_contact_email(uuid, uuid, uuid) to authenticated;
