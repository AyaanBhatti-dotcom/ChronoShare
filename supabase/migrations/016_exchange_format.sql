-- How exchanges happen: in person, remote, or flexible (joiner picks in_person/remote).

alter table public.posts
  add column if not exists exchange_format text not null default 'flexible'
  check (exchange_format in ('in_person', 'remote', 'flexible'));

alter table public.exchanges
  add column if not exists exchange_format text
  check (exchange_format is null or exchange_format in ('in_person', 'remote'));

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
    where post_id = p_post_id and status in ('in_progress', 'completed')
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
    update public.profiles
    set hours_available = hours_available + v_post.hours_cost
    where id = v_post.user_id;
  end if;

  update public.posts
  set status = 'closed'
  where id = p_post_id;

  insert into public.exchanges (
    post_id, poster_id, acceptor_id, title, category, post_type, hours, status, exchange_format
  ) values (
    p_post_id, v_post.user_id, v_acceptor_id,
    v_post.title, v_post.category, v_post.post_type, v_post.hours_cost, 'in_progress',
    v_resolved_format
  )
  returning id into v_exchange_id;

  return v_exchange_id;
end;
$$;
