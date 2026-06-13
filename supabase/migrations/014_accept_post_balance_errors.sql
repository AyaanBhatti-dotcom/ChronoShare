-- Clearer balance errors: distinguish payer (poster vs acceptor) by listing type.
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
  v_payer_id uuid;
  v_payee_id uuid;
  v_payer_hours numeric;
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
    v_payer_id := v_post.user_id;
    v_payee_id := v_acceptor_id;
  else
    v_payer_id := v_acceptor_id;
    v_payee_id := v_post.user_id;
  end if;

  select hours_available into v_payer_hours
  from public.profiles
  where id = v_payer_id
  for update;

  if v_payer_hours is null then
    raise exception 'User profile not found';
  end if;

  if v_payer_hours < v_post.hours_cost then
    if v_payer_id = v_acceptor_id then
      raise exception 'Insufficient hours balance — you need at least % hours to join this exchange', v_post.hours_cost;
    else
      raise exception 'The listing owner does not have enough hours to pay for this exchange';
    end if;
  end if;

  update public.profiles
  set hours_available = hours_available - v_post.hours_cost
  where id = v_payer_id;

  update public.profiles
  set hours_available = hours_available + v_post.hours_cost
  where id = v_payee_id;

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
