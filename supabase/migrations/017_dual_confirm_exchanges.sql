-- Dual confirmation: hours move only after poster AND acceptor confirm.

alter table public.exchanges
  add column if not exists poster_confirmed_at timestamptz,
  add column if not exists acceptor_confirmed_at timestamptz,
  add column if not exists hours_settled boolean not null default false;

-- Legacy rows already had hours moved at accept time.
update public.exchanges
set
  hours_settled = true,
  poster_confirmed_at = coalesce(poster_confirmed_at, created_at),
  acceptor_confirmed_at = coalesce(acceptor_confirmed_at, created_at),
  status = 'completed',
  completed_at = coalesce(completed_at, updated_at, created_at)
where status = 'in_progress';

alter table public.exchanges drop constraint if exists exchanges_status_check;
alter table public.exchanges
  add constraint exchanges_status_check
  check (status in ('pending', 'completed', 'cancelled'));

drop index if exists public.exchanges_post_id_active_idx;
create unique index exchanges_post_id_active_idx
  on public.exchanges(post_id)
  where status in ('pending', 'completed');

create or replace function public.settle_exchange_hours(p_exchange_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exchange record;
  v_poster_hours numeric;
begin
  select * into v_exchange
  from public.exchanges
  where id = p_exchange_id
  for update;

  if not found then
    raise exception 'Exchange not found';
  end if;

  if v_exchange.hours_settled then
    return;
  end if;

  if v_exchange.poster_confirmed_at is null or v_exchange.acceptor_confirmed_at is null then
    raise exception 'Both parties must confirm before hours are transferred';
  end if;

  if v_exchange.post_type = 'needs' then
    select hours_available into v_poster_hours
    from public.profiles
    where id = v_exchange.poster_id
    for update;

    if v_poster_hours is null then
      raise exception 'User profile not found';
    end if;

    if v_poster_hours < v_exchange.hours then
      raise exception 'The listing owner does not have enough hours to pay for this exchange';
    end if;

    update public.profiles
    set hours_available = hours_available - v_exchange.hours
    where id = v_exchange.poster_id;

    update public.profiles
    set hours_available = hours_available + v_exchange.hours
    where id = v_exchange.acceptor_id;
  else
    update public.profiles
    set hours_available = hours_available + v_exchange.hours
    where id = v_exchange.poster_id;
  end if;

  update public.exchanges
  set
    hours_settled = true,
    status = 'completed',
    completed_at = now()
  where id = p_exchange_id;
end;
$$;

create or replace function public.confirm_exchange(p_exchange_id uuid)
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

  if v_exchange.status != 'pending' then
    raise exception 'Exchange is not awaiting confirmation';
  end if;

  if v_user_id not in (v_exchange.poster_id, v_exchange.acceptor_id) then
    raise exception 'Not authorized';
  end if;

  if v_user_id = v_exchange.poster_id then
    if v_exchange.poster_confirmed_at is not null then
      raise exception 'You have already confirmed this exchange';
    end if;
    update public.exchanges
    set poster_confirmed_at = now()
    where id = p_exchange_id;
  else
    if v_exchange.acceptor_confirmed_at is not null then
      raise exception 'You have already confirmed this exchange';
    end if;
    update public.exchanges
    set acceptor_confirmed_at = now()
    where id = p_exchange_id;
  end if;

  select * into v_exchange
  from public.exchanges
  where id = p_exchange_id;

  if v_exchange.poster_confirmed_at is not null
     and v_exchange.acceptor_confirmed_at is not null then
    perform public.settle_exchange_hours(p_exchange_id);
  end if;
end;
$$;

create or replace function public.accept_post(
  p_post_id uuid,
  p_exchange_format text default null
)
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
  v_resolved_format text;
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
    where post_id = p_post_id and status in ('pending', 'completed')
  ) then
    raise exception 'This listing has already been accepted';
  end if;

  if v_post.exchange_format = 'flexible' then
    if p_exchange_format is null or p_exchange_format not in ('in_person', 'remote') then
      raise exception 'Choose how this exchange will happen: in person or remote';
    end if;
    v_resolved_format := p_exchange_format;
  else
    v_resolved_format := v_post.exchange_format;
  end if;

  -- Validate balance up front for needs posts; hours move only after dual confirm.
  if v_post.post_type = 'needs' then
    select hours_available into v_poster_hours
    from public.profiles
    where id = v_post.user_id;

    if v_poster_hours is null then
      raise exception 'User profile not found';
    end if;

    if v_poster_hours < v_post.hours_cost then
      raise exception 'The listing owner does not have enough hours to pay for this exchange';
    end if;
  end if;

  update public.posts
  set status = 'closed'
  where id = p_post_id;

  insert into public.exchanges (
    post_id, poster_id, acceptor_id, title, category, post_type, hours, status, exchange_format
  ) values (
    p_post_id, v_post.user_id, v_acceptor_id,
    v_post.title, v_post.category, v_post.post_type, v_post.hours_cost, 'pending',
    v_resolved_format
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

  if v_exchange.status != 'pending' then
    raise exception 'Only pending exchanges can be cancelled';
  end if;

  if v_exchange.hours_settled then
    raise exception 'Hours have already been transferred for this exchange';
  end if;

  update public.posts
  set status = 'active'
  where id = v_exchange.post_id;

  update public.exchanges
  set status = 'cancelled'
  where id = p_exchange_id;
end;
$$;

-- Backwards compatibility: complete_exchange now records confirmation.
create or replace function public.complete_exchange(p_exchange_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.confirm_exchange(p_exchange_id);
end;
$$;

grant execute on function public.settle_exchange_hours(uuid) to authenticated;
grant execute on function public.confirm_exchange(uuid) to authenticated;
