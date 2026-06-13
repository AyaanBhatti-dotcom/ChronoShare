-- Remote profiles table was missing email/hours_available/updated_at
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists hours_available numeric(10, 2) not null default 1.0;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or p.email = '');

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

create or replace function public.admin_list_profiles(p_key text)
returns table (
  id uuid,
  full_name text,
  email text,
  hours_available numeric,
  created_at timestamptz,
  updated_at timestamptz
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
    p.id,
    p.full_name,
    coalesce(nullif(p.email, ''), u.email),
    p.hours_available,
    p.created_at,
    coalesce(p.updated_at, p.created_at)
  from public.profiles p
  left join auth.users u on u.id = p.id
  order by p.created_at desc;
end;
$$;

create or replace function public.admin_list_posts(p_key text)
returns table (
  id uuid,
  user_id uuid,
  author_name text,
  author_email text,
  title text,
  description text,
  category text,
  post_type text,
  hours_cost numeric,
  status text,
  created_at timestamptz,
  updated_at timestamptz
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
    po.id,
    po.user_id,
    coalesce(pr.full_name, 'Unknown'),
    coalesce(nullif(pr.email, ''), u.email),
    po.title,
    po.description,
    po.category,
    po.post_type,
    po.hours_cost,
    po.status,
    po.created_at,
    po.updated_at
  from public.posts po
  left join public.profiles pr on pr.id = po.user_id
  left join auth.users u on u.id = po.user_id
  order by po.created_at desc;
end;
$$;
