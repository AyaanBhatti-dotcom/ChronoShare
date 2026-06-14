-- Cancel the exchange before reopening the listing.
-- posts_prevent_reopen_matched blocks reopen while a pending exchange still exists.

create or replace function public.cancel_exchange(p_exchange_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_exchange record;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_exchange
  from public.exchanges
  where id = p_exchange_id
  for update;

  if not found then
    raise exception 'Exchange not found';
  end if;

  if v_user_id not in (v_exchange.poster_id, v_exchange.acceptor_id) then
    raise exception 'Not authorized';
  end if;

  if v_exchange.status != 'pending' then
    raise exception 'Only pending exchanges can be cancelled';
  end if;

  if v_exchange.hours_settled then
    raise exception 'Hours have already been transferred for this exchange';
  end if;

  update public.exchanges
  set status = 'cancelled'
  where id = p_exchange_id;

  update public.posts
  set status = 'active'
  where id = v_exchange.post_id;
end;
$$;

grant execute on function public.cancel_exchange(uuid) to authenticated;
