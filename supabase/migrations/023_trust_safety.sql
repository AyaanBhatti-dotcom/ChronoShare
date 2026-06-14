-- Trust & safety: reports, reviews, blocks, meeting preferences, profile privacy.

alter table public.posts
  add column if not exists meeting_preference text not null default 'flexible'
  check (meeting_preference in ('public_venue', 'remote_only', 'flexible'));

alter table public.profiles
  add column if not exists show_public_profile boolean not null default true,
  add column if not exists show_rating boolean not null default true,
  add column if not exists show_history boolean not null default false;

create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocked_users_blocker_idx on public.blocked_users(blocker_id);

alter table public.blocked_users enable row level security;

create policy "No direct blocked_users access"
  on public.blocked_users for all
  to authenticated, anon
  using (false)
  with check (false);

create table if not exists public.exchange_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  exchange_id uuid references public.exchanges(id) on delete set null,
  category text not null
    check (category in ('no_show', 'incomplete_work', 'harassment', 'unsafe', 'scam', 'other')),
  details text,
  also_block boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists exchange_reports_created_at_idx
  on public.exchange_reports(created_at desc);

create index if not exists exchange_reports_unread_idx
  on public.exchange_reports(admin_read, status)
  where admin_read = false and status = 'pending';

alter table public.exchange_reports enable row level security;

create policy "No direct exchange_reports access"
  on public.exchange_reports for all
  to authenticated, anon
  using (false)
  with check (false);

create table if not exists public.exchange_reviews (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references public.exchanges(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  showed_up boolean,
  work_completed boolean,
  would_exchange_again boolean,
  felt_safe boolean,
  details text,
  created_at timestamptz not null default now(),
  unique (exchange_id, reviewer_id)
);

create index if not exists exchange_reviews_reviewee_idx
  on public.exchange_reviews(reviewee_id);

alter table public.exchange_reviews enable row level security;

create policy "No direct exchange_reviews access"
  on public.exchange_reviews for all
  to authenticated, anon
  using (false)
  with check (false);

create or replace function public.users_are_blocked(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocked_users
    where (blocker_id = p_user_a and blocked_id = p_user_b)
       or (blocker_id = p_user_b and blocked_id = p_user_a)
  );
$$;

create or replace function public.block_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_blocked_id is null or p_blocked_id = v_user_id then
    raise exception 'Invalid user';
  end if;

  if not exists (select 1 from public.profiles where id = p_blocked_id) then
    raise exception 'User not found';
  end if;

  insert into public.blocked_users (blocker_id, blocked_id)
  values (v_user_id, p_blocked_id)
  on conflict (blocker_id, blocked_id) do nothing;
end;
$$;

create or replace function public.unblock_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.blocked_users
  where blocker_id = v_user_id and blocked_id = p_blocked_id;
end;
$$;

create or replace function public.list_blocked_user_ids()
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  return coalesce(
    array(
      select blocked_id
      from public.blocked_users
      where blocker_id = v_user_id
    ),
    '{}'::uuid[]
  );
end;
$$;

create or replace function public.submit_exchange_report(
  p_reported_user_id uuid,
  p_category text,
  p_exchange_id uuid default null,
  p_details text default null,
  p_also_block boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_reported_user_id is null or p_reported_user_id = v_user_id then
    raise exception 'Invalid user';
  end if;

  if p_category not in ('no_show', 'incomplete_work', 'harassment', 'unsafe', 'scam', 'other') then
    raise exception 'Invalid report category';
  end if;

  if p_exchange_id is not null then
    if not exists (
      select 1
      from public.exchanges
      where id = p_exchange_id
        and v_user_id in (poster_id, acceptor_id)
        and p_reported_user_id in (poster_id, acceptor_id)
    ) then
      raise exception 'Exchange not found or user is not a participant';
    end if;
  end if;

  insert into public.exchange_reports (
    reporter_id,
    reported_user_id,
    exchange_id,
    category,
    details,
    also_block
  )
  values (
    v_user_id,
    p_reported_user_id,
    p_exchange_id,
    p_category,
    nullif(trim(p_details), ''),
    coalesce(p_also_block, false)
  )
  returning id into v_id;

  if coalesce(p_also_block, false) then
    perform public.block_user(p_reported_user_id);
  end if;

  return v_id;
end;
$$;

create or replace function public.submit_exchange_review(
  p_exchange_id uuid,
  p_showed_up boolean default null,
  p_work_completed boolean default null,
  p_would_exchange_again boolean default null,
  p_felt_safe boolean default null,
  p_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_exchange record;
  v_reviewee_id uuid;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_exchange
  from public.exchanges
  where id = p_exchange_id;

  if not found then
    raise exception 'Exchange not found';
  end if;

  if v_exchange.status <> 'completed' then
    raise exception 'You can only review completed exchanges';
  end if;

  if v_user_id not in (v_exchange.poster_id, v_exchange.acceptor_id) then
    raise exception 'Not authorized';
  end if;

  v_reviewee_id := case
    when v_user_id = v_exchange.poster_id then v_exchange.acceptor_id
    else v_exchange.poster_id
  end;

  if p_showed_up is null
     and p_work_completed is null
     and p_would_exchange_again is null
     and p_felt_safe is null
     and nullif(trim(p_details), '') is null then
    raise exception 'Please answer at least one question';
  end if;

  insert into public.exchange_reviews (
    exchange_id,
    reviewer_id,
    reviewee_id,
    showed_up,
    work_completed,
    would_exchange_again,
    felt_safe,
    details
  )
  values (
    p_exchange_id,
    v_user_id,
    v_reviewee_id,
    p_showed_up,
    p_work_completed,
    p_would_exchange_again,
    p_felt_safe,
    nullif(trim(p_details), '')
  )
  on conflict (exchange_id, reviewer_id) do update
  set
    showed_up = coalesce(excluded.showed_up, exchange_reviews.showed_up),
    work_completed = coalesce(excluded.work_completed, exchange_reviews.work_completed),
    would_exchange_again = coalesce(excluded.would_exchange_again, exchange_reviews.would_exchange_again),
    felt_safe = coalesce(excluded.felt_safe, exchange_reviews.felt_safe),
    details = coalesce(excluded.details, exchange_reviews.details)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.get_member_trust_stats(p_user_id uuid)
returns table (
  completed_exchanges integer,
  review_count integer,
  positive_rating_pct numeric,
  show_rating boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_show_rating boolean;
begin
  select p.show_rating into v_show_rating
  from public.profiles p
  where p.id = p_user_id;

  if not found then
    return;
  end if;

  return query
  select
    (
      select count(*)::integer
      from public.exchanges e
      where e.status = 'completed'
        and p_user_id in (e.poster_id, e.acceptor_id)
    ) as completed_exchanges,
    (
      select count(*)::integer
      from public.exchange_reviews r
      where r.reviewee_id = p_user_id
    ) as review_count,
    case
      when v_show_rating then (
        select round(
          100.0 * avg(case when r.would_exchange_again then 1.0 else 0.0 end),
          0
        )
        from public.exchange_reviews r
        where r.reviewee_id = p_user_id
          and r.would_exchange_again is not null
      )
      else null
    end as positive_rating_pct,
    v_show_rating;
end;
$$;

create or replace function public.has_exchange_review(p_exchange_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return false;
  end if;

  return exists (
    select 1
    from public.exchange_reviews
    where exchange_id = p_exchange_id and reviewer_id = v_user_id
  );
end;
$$;

create or replace function public.admin_list_exchange_reports(p_key text)
returns table (
  id uuid,
  reporter_id uuid,
  reported_user_id uuid,
  exchange_id uuid,
  category text,
  details text,
  also_block boolean,
  status text,
  admin_read boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_verify_key(p_key) then
    raise exception 'Invalid admin key';
  end if;

  return query
  select
    er.id,
    er.reporter_id,
    er.reported_user_id,
    er.exchange_id,
    er.category,
    er.details,
    er.also_block,
    er.status,
    er.admin_read,
    er.created_at
  from public.exchange_reports er
  order by er.admin_read asc, er.created_at desc;
end;
$$;

create or replace function public.admin_update_exchange_report(
  p_key text,
  p_report_id uuid,
  p_status text default null,
  p_admin_read boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_verify_key(p_key) then
    raise exception 'Invalid admin key';
  end if;

  if not exists (select 1 from public.exchange_reports where id = p_report_id) then
    raise exception 'Report not found';
  end if;

  if p_status is not null and p_status not in ('pending', 'reviewed', 'action_taken', 'dismissed') then
    raise exception 'Invalid status';
  end if;

  update public.exchange_reports
  set
    status = coalesce(p_status, status),
    admin_read = coalesce(p_admin_read, admin_read)
  where id = p_report_id;
end;
$$;

-- Block check when accepting a listing.
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

  if public.users_are_blocked(v_acceptor_id, v_post.user_id) then
    raise exception 'You cannot join this exchange';
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

grant execute on function public.users_are_blocked(uuid, uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;
grant execute on function public.list_blocked_user_ids() to authenticated;
grant execute on function public.submit_exchange_report(uuid, text, uuid, text, boolean) to authenticated;
grant execute on function public.submit_exchange_review(uuid, boolean, boolean, boolean, boolean, text) to authenticated;
grant execute on function public.get_member_trust_stats(uuid) to authenticated;
grant execute on function public.has_exchange_review(uuid) to authenticated;
grant execute on function public.admin_list_exchange_reports(text) to anon, authenticated;
grant execute on function public.admin_update_exchange_report(text, uuid, text, boolean) to anon, authenticated;
