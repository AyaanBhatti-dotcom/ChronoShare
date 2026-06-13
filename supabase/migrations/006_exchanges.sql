-- Job exchanges: when someone accepts a listing, hours transfer and the post closes.

create table if not exists public.exchanges (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete restrict,
  poster_id uuid not null references public.profiles(id) on delete cascade,
  acceptor_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  post_type text not null check (post_type in ('needs', 'offers')),
  hours numeric(10, 2) not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists exchanges_poster_id_idx on public.exchanges(poster_id);
create index if not exists exchanges_acceptor_id_idx on public.exchanges(acceptor_id);
create index if not exists exchanges_status_idx on public.exchanges(status);
create unique index if not exists exchanges_post_id_active_idx
  on public.exchanges(post_id)
  where status in ('in_progress', 'completed');

alter table public.exchanges enable row level security;

create policy "Users can view their own exchanges"
  on public.exchanges for select
  to authenticated
  using (
    (select auth.uid()) = poster_id
    or (select auth.uid()) = acceptor_id
  );

drop trigger if exists exchanges_updated_at on public.exchanges;

create trigger exchanges_updated_at
  before update on public.exchanges
  for each row execute function public.handle_updated_at();

-- Accept a listing: validates balance, transfers hours, closes post, creates exchange.
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
    raise exception 'Insufficient hours balance';
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

-- Mark an exchange as completed (hours already transferred on accept).
create or replace function public.complete_exchange(p_exchange_id uuid)
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

  update public.exchanges
  set status = 'completed', completed_at = now()
  where id = p_exchange_id;
end;
$$;

-- Cancel an in-progress exchange: reverse hours and reopen the listing.
create or replace function public.cancel_exchange(p_exchange_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_exchange record;
  v_payer_id uuid;
  v_payee_id uuid;
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
    v_payer_id := v_exchange.poster_id;
    v_payee_id := v_exchange.acceptor_id;
  else
    v_payer_id := v_exchange.acceptor_id;
    v_payee_id := v_exchange.poster_id;
  end if;

  update public.profiles
  set hours_available = hours_available + v_exchange.hours
  where id = v_payer_id;

  update public.profiles
  set hours_available = hours_available - v_exchange.hours
  where id = v_payee_id;

  update public.posts
  set status = 'active'
  where id = v_exchange.post_id;

  update public.exchanges
  set status = 'cancelled'
  where id = p_exchange_id;
end;
$$;

grant select on public.exchanges to authenticated;
grant execute on function public.accept_post(uuid) to authenticated;
grant execute on function public.complete_exchange(uuid) to authenticated;
grant execute on function public.cancel_exchange(uuid) to authenticated;
