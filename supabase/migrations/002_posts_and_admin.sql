-- Ensure updated_at trigger function exists (may be missing if profiles migration was applied separately)
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Community posts (job board listings)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  post_type text not null check (post_type in ('needs', 'offers')),
  hours_cost numeric(10, 2) not null default 1.0,
  status text not null default 'active' check (status in ('active', 'closed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists posts_status_idx on public.posts(status);
create index if not exists posts_post_type_idx on public.posts(post_type);

alter table public.posts enable row level security;

create policy "Active posts are viewable by authenticated users"
  on public.posts for select
  to authenticated
  using (status = 'active');

create policy "Users can view their own posts"
  on public.posts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists posts_updated_at on public.posts;

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

-- Dev admin access key (change in Supabase SQL editor for production)
create table if not exists public.admin_access (
  id int primary key default 1 check (id = 1),
  dev_key text not null
);

insert into public.admin_access (dev_key)
values ('chrono-dev-admin')
on conflict (id) do nothing;

alter table public.admin_access enable row level security;

revoke all on public.admin_access from anon, authenticated;

create or replace function public.admin_verify_key(p_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.admin_access
    where dev_key = p_key
  );
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

create or replace function public.admin_update_post_status(
  p_key text,
  p_post_id uuid,
  p_status text
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

  if p_status not in ('active', 'closed', 'archived') then
    raise exception 'Invalid status';
  end if;

  update public.posts
  set status = p_status
  where id = p_post_id;
end;
$$;

grant execute on function public.admin_verify_key(text) to anon, authenticated;
grant execute on function public.admin_list_profiles(text) to anon, authenticated;
grant execute on function public.admin_list_posts(text) to anon, authenticated;
grant execute on function public.admin_update_post_status(text, uuid, text) to anon, authenticated;

grant select, insert, update, delete on public.posts to authenticated;
