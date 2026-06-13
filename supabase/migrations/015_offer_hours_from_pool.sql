-- Hour economy:
--   needs  = requester (poster) pays helper (acceptor) from their balance
--   offers = helper (poster) earns from the community pool; acceptor pays nothing

create or replace function public.accept_post(p_post_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post record;
  v_acceptor_id uuid := auth.uid();
  v_exchange_id uuid;
  v_poster_hours numeric;
begin
  if v_acceptor_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_post
  from public.posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_post.status != 'active' then
    raise exception 'This listing is no longer available';
  end if;

  if v_post.user_id = v_acceptor_id then
    raise exception 'You cannot accept your own listing';
  end if;

  if exists (
    select 1 from public.exchanges
    where post_id = p_post_id and status in ('in_progress', 'completed')
  ) then
    raise exception 'This listing has already been accepted';
  end if;

  if v_post.post_type = 'needs' then
    select hours_available into v_poster_hours
    from public.profiles
    where id = v_post.user_id
    for update;

    if v_poster_hours is null then
      raise exception 'User profile not found';
    end if;

    if v_poster_hours < v_post.hours_cost then
      raise exception 'The listing owner does not have enough hours to pay for this exchange';
    end if;

    update public.profiles
    set hours_available = hours_available - v_post.hours_cost
    where id = v_post.user_id;

    update public.profiles
    set hours_available = hours_available + v_post.hours_cost
    where id = v_acceptor_id;
  else
    -- Skill offers: mint hours for the helper from the community pool
    update public.profiles
    set hours_available = hours_available + v_post.hours_cost
    where id = v_post.user_id;
  end if;

  update public.posts
  set status = 'closed'
  where id = p_post_id;

  insert into public.exchanges (
    post_id, poster_id, acceptor_id, title, category, post_type, hours, status
  ) values (
    p_post_id, v_post.user_id, v_acceptor_id,
    v_post.title, v_post.category, v_post.post_type, v_post.hours_cost, 'in_progress'
  )
  returning id into v_exchange_id;

  return v_exchange_id;
end;
$$;

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

  if v_exchange.status != 'in_progress' then
    raise exception 'Exchange is not in progress';
  end if;

  if v_exchange.post_type = 'needs' then
    update public.profiles
    set hours_available = hours_available + v_exchange.hours
    where id = v_exchange.poster_id;

    update public.profiles
    set hours_available = hours_available - v_exchange.hours
    where id = v_exchange.acceptor_id;
  else
    update public.profiles
    set hours_available = greatest(0, hours_available - v_exchange.hours)
    where id = v_exchange.poster_id;
  end if;

  update public.posts
  set status = 'active'
  where id = v_exchange.post_id;

  update public.exchanges
  set status = 'cancelled'
  where id = p_exchange_id;
end;
$$;
