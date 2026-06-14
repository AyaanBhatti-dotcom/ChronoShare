-- Admin-only bundle for accurate in-app user dashboard preview.

create or replace function public.admin_get_user_preview(p_key text, p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result json;
begin
  if not public.admin_verify_key(p_key) then
    raise exception 'Invalid admin key';
  end if;

  select json_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'username', p.username,
    'email', coalesce(nullif(p.email, ''), u.email),
    'avatar_url', p.avatar_url,
    'hours_available', p.hours_available,
    'city', p.city,
    'region', p.region,
    'state', p.state,
    'country', p.country,
    'latitude', p.latitude,
    'longitude', p.longitude,
    'profile_setup_completed', p.profile_setup_completed_at is not null,
    'onboarding_completed', p.onboarding_completed_at is not null,
    'pending_count', (
      select count(*)::int
      from public.exchanges e
      where (e.poster_id = p_user_id or e.acceptor_id = p_user_id)
        and e.status = 'pending'
    ),
    'needs_confirm_count', (
      select count(*)::int
      from public.exchanges e
      where e.status = 'pending'
        and (
          (e.poster_id = p_user_id and e.poster_confirmed_at is null)
          or (e.acceptor_id = p_user_id and e.acceptor_confirmed_at is null)
        )
    ),
    'recent_exchanges', coalesce((
      select json_agg(row_to_json(ex) order by ex.completed_at desc nulls last)
      from (
        select
          e.id,
          e.post_id,
          e.poster_id,
          e.acceptor_id,
          e.title,
          e.category,
          e.post_type,
          e.hours,
          e.status,
          e.exchange_format,
          e.created_at,
          e.completed_at,
          e.poster_confirmed_at,
          e.acceptor_confirmed_at,
          e.hours_settled,
          json_build_object(
            'full_name', pr.full_name,
            'username', pr.username
          ) as poster,
          json_build_object(
            'full_name', ac.full_name,
            'username', ac.username
          ) as acceptor
        from public.exchanges e
        left join public.profiles pr on pr.id = e.poster_id
        left join public.profiles ac on ac.id = e.acceptor_id
        where (e.poster_id = p_user_id or e.acceptor_id = p_user_id)
          and e.status = 'completed'
        order by e.completed_at desc nulls last
        limit 5
      ) ex
    ), '[]'::json),
    'active_posts', coalesce((
      select json_agg(row_to_json(po) order by po.created_at desc)
      from (
        select
          po.id,
          po.user_id,
          po.title,
          po.description,
          po.category,
          po.post_type,
          po.hours_cost,
          po.status,
          po.city,
          po.region,
          po.state,
          po.country,
          po.latitude,
          po.longitude,
          po.exchange_format,
          po.meeting_preference,
          po.created_at,
          json_build_object(
            'full_name', pr.full_name,
            'username', pr.username
          ) as profiles
        from public.posts po
        left join public.profiles pr on pr.id = po.user_id
        where po.status = 'active'
        order by po.created_at desc
        limit 80
      ) po
    ), '[]'::json)
  )
  into v_result
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = p_user_id;

  if v_result is null then
    raise exception 'User not found';
  end if;

  return v_result;
end;
$$;

grant execute on function public.admin_get_user_preview(text, uuid) to anon, authenticated;
