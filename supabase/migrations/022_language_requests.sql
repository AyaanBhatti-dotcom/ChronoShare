-- User-submitted language requests for admin review.

create table if not exists public.language_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  language_name text not null check (char_length(trim(language_name)) >= 2),
  reason text,
  requester_name text,
  requester_email text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'added', 'dismissed')),
  admin_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists language_requests_created_at_idx
  on public.language_requests(created_at desc);

create index if not exists language_requests_unread_idx
  on public.language_requests(admin_read, status)
  where admin_read = false and status = 'pending';

alter table public.language_requests enable row level security;

-- Users submit via RPC only; admins read via admin RPCs.
create policy "No direct table access for users"
  on public.language_requests for all
  to authenticated, anon
  using (false)
  with check (false);

create or replace function public.submit_language_request(
  p_language_name text,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_name text;
  v_email text;
begin
  if nullif(trim(p_language_name), '') is null then
    raise exception 'Language name is required';
  end if;

  if char_length(trim(p_language_name)) < 2 then
    raise exception 'Language name must be at least 2 characters';
  end if;

  if v_user_id is not null then
    select full_name, email into v_name, v_email
    from public.profiles
    where id = v_user_id;
  end if;

  insert into public.language_requests (
    user_id,
    language_name,
    reason,
    requester_name,
    requester_email
  )
  values (
    v_user_id,
    trim(p_language_name),
    nullif(trim(p_reason), ''),
    v_name,
    v_email
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.submit_language_request(text, text) to anon, authenticated;

create or replace function public.admin_list_language_requests(p_key text)
returns table (
  id uuid,
  user_id uuid,
  language_name text,
  reason text,
  requester_name text,
  requester_email text,
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
    lr.id,
    lr.user_id,
    lr.language_name,
    lr.reason,
    lr.requester_name,
    lr.requester_email,
    lr.status,
    lr.admin_read,
    lr.created_at
  from public.language_requests lr
  order by lr.admin_read asc, lr.created_at desc;
end;
$$;

grant execute on function public.admin_list_language_requests(text) to anon, authenticated;

create or replace function public.admin_update_language_request(
  p_key text,
  p_request_id uuid,
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

  if not exists (select 1 from public.language_requests where id = p_request_id) then
    raise exception 'Language request not found';
  end if;

  if p_status is not null and p_status not in ('pending', 'reviewed', 'added', 'dismissed') then
    raise exception 'Invalid status';
  end if;

  update public.language_requests
  set
    status = coalesce(p_status, status),
    admin_read = coalesce(p_admin_read, admin_read)
  where id = p_request_id;
end;
$$;

grant execute on function public.admin_update_language_request(text, uuid, text, boolean) to anon, authenticated;
