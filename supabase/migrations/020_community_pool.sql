-- Explicit community solidarity pool: voluntary donations and gated claims.

create table if not exists public.community_pool_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  amount numeric not null check (amount > 0),
  transaction_type text not null check (transaction_type in ('donation', 'claim')),
  created_at timestamptz not null default now()
);

create index if not exists community_pool_transactions_created_at_idx
  on public.community_pool_transactions(created_at desc);

create index if not exists community_pool_transactions_user_id_idx
  on public.community_pool_transactions(user_id);

alter table public.community_pool_transactions enable row level security;

create policy "Authenticated users can read pool activity"
  on public.community_pool_transactions for select
  to authenticated
  using (true);

grant select on public.community_pool_transactions to authenticated;

-- Pool balance = donations minus claims
create or replace function public.community_pool_balance()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(
    case transaction_type
      when 'donation' then amount
      when 'claim' then -amount
      else 0
    end
  ), 0)::numeric
  from public.community_pool_transactions;
$$;

grant execute on function public.community_pool_balance() to authenticated;

-- Count completed helps (helper role) in rolling window
create or replace function public.count_recent_pool_helps(p_user_id uuid, p_days int default 30)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.exchanges e
  where e.status = 'completed'
    and e.hours_settled = true
    and e.completed_at >= now() - make_interval(days => p_days)
    and (
      (e.post_type = 'needs' and e.acceptor_id = p_user_id)
      or (e.post_type = 'offers' and e.poster_id = p_user_id)
    );
$$;

create or replace function public.user_donation_credits(p_user_id uuid, p_days int default 90)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(floor(sum(amount))::int, 0)
  from public.community_pool_transactions
  where user_id = p_user_id
    and transaction_type = 'donation'
    and created_at >= now() - make_interval(days => p_days);
$$;

create or replace function public.user_claimed_pool_this_week(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_pool_transactions
    where user_id = p_user_id
      and transaction_type = 'claim'
      and created_at >= date_trunc('week', now() at time zone 'utc') at time zone 'utc'
  );
$$;

create or replace function public.is_pool_claim_window_open()
returns boolean
language sql
stable
as $$
  -- Fri (5), Sat (6), Sun (0) in UTC; adjust if you add per-user timezones later
  select extract(dow from now() at time zone 'utc')::int in (0, 5, 6);
$$;

create or replace function public.donate_to_community_pool(p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance numeric;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 24 then
    raise exception 'Donation must be between 0.1 and 24 hours';
  end if;

  select hours_available into v_balance
  from public.profiles
  where id = v_user_id
  for update;

  if v_balance is null then
    raise exception 'Profile not found';
  end if;

  if v_balance < p_amount then
    raise exception 'Not enough hours to donate';
  end if;

  update public.profiles
  set hours_available = hours_available - p_amount
  where id = v_user_id;

  insert into public.community_pool_transactions (user_id, amount, transaction_type)
  values (v_user_id, p_amount, 'donation');
end;
$$;

create or replace function public.claim_from_community_pool(p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_helps int;
  v_donation_credits int;
  v_required int;
  v_pool numeric;
  v_balance numeric;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 1 then
    raise exception 'You can claim up to 1 hour per week';
  end if;

  if not public.is_pool_claim_window_open() then
    raise exception 'Pool claims are only open Friday through Sunday';
  end if;

  if public.user_claimed_pool_this_week(v_user_id) then
    raise exception 'You have already claimed from the pool this week';
  end if;

  v_helps := public.count_recent_pool_helps(v_user_id, 30);
  v_donation_credits := public.user_donation_credits(v_user_id, 90);
  v_required := greatest(1, 2 - v_donation_credits);

  if v_helps < v_required then
    raise exception 'Complete % more verified help exchange(s) in the last 30 days to unlock pool access', (v_required - v_helps);
  end if;

  v_pool := public.community_pool_balance();

  if v_pool < p_amount then
    raise exception 'Community pool does not have enough hours right now';
  end if;

  if v_pool < 0.5 then
    raise exception 'Pool is below minimum balance — check back after more donations';
  end if;

  select hours_available into v_balance
  from public.profiles
  where id = v_user_id
  for update;

  update public.profiles
  set hours_available = hours_available + p_amount
  where id = v_user_id;

  insert into public.community_pool_transactions (user_id, amount, transaction_type)
  values (v_user_id, p_amount, 'claim');
end;
$$;

grant execute on function public.donate_to_community_pool(numeric) to authenticated;
grant execute on function public.claim_from_community_pool(numeric) to authenticated;

notify pgrst, 'reload schema';
