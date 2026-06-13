-- Admin god-mode: full CRUD on users and posts

create or replace function public.admin_update_profile(
  p_key text,
  p_user_id uuid,
  p_full_name text default null,
  p_email text default null,
  p_hours_available numeric default null
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

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User not found';
  end if;

  update public.profiles
  set
    full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
    email = coalesce(nullif(trim(p_email), ''), email),
    hours_available = coalesce(p_hours_available, hours_available),
    updated_at = now()
  where id = p_user_id;
end;
$$;

create or replace function public.admin_delete_user(
  p_key text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.admin_verify_key(p_key) then
    raise exception 'Invalid admin key';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User not found';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

create or replace function public.admin_update_post(
  p_key text,
  p_post_id uuid,
  p_title text default null,
  p_description text default null,
  p_category text default null,
  p_post_type text default null,
  p_hours_cost numeric default null,
  p_status text default null
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

  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception 'Post not found';
  end if;

  if p_post_type is not null and p_post_type not in ('needs', 'offers') then
    raise exception 'Invalid post type';
  end if;

  if p_status is not null and p_status not in ('active', 'closed', 'archived') then
    raise exception 'Invalid status';
  end if;

  update public.posts
  set
    title = coalesce(nullif(trim(p_title), ''), title),
    description = case when p_description is not null then nullif(trim(p_description), '') else description end,
    category = coalesce(nullif(trim(p_category), ''), category),
    post_type = coalesce(p_post_type, post_type),
    hours_cost = coalesce(p_hours_cost, hours_cost),
    status = coalesce(p_status, status),
    updated_at = now()
  where id = p_post_id;
end;
$$;

create or replace function public.admin_delete_post(
  p_key text,
  p_post_id uuid
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

  delete from public.posts where id = p_post_id;

  if not found then
    raise exception 'Post not found';
  end if;
end;
$$;

grant execute on function public.admin_update_profile(text, uuid, text, text, numeric) to anon, authenticated;
grant execute on function public.admin_delete_user(text, uuid) to anon, authenticated;
grant execute on function public.admin_update_post(text, uuid, text, text, text, text, numeric, text) to anon, authenticated;
grant execute on function public.admin_delete_post(text, uuid) to anon, authenticated;
