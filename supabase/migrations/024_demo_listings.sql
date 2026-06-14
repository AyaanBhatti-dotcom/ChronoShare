-- Demo users and listings for the global job board (idempotent seed).

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists is_demo boolean not null default false;

create index if not exists profiles_is_demo_idx on public.profiles(is_demo)
  where is_demo = true;

create or replace function public.ensure_demo_user(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_username text,
  p_city text,
  p_region text,
  p_state text,
  p_country text,
  p_lat double precision,
  p_lng double precision
)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if not exists (select 1 from auth.users where id = p_id) then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      is_sso_user
    ) values (
      '00000000-0000-0000-0000-000000000002',
      p_id,
      'authenticated',
      'authenticated',
      p_email,
      extensions.crypt('chrono-demo-no-login', extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_full_name),
      now(),
      now(),
      '',
      '',
      '',
      '',
      false
    );

    insert into auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      p_id::text,
      p_id,
      jsonb_build_object(
        'sub', p_id::text,
        'email', p_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  update public.profiles
  set
    full_name = p_full_name,
    email = p_email,
    username = p_username,
    is_demo = true,
    hours_available = 8.0,
    city = p_city,
    region = p_region,
    state = p_state,
    country = p_country,
    latitude = p_lat,
    longitude = p_lng,
    location_updated_at = now(),
    profile_setup_completed_at = coalesce(profile_setup_completed_at, now()),
    onboarding_completed_at = coalesce(onboarding_completed_at, now()),
    show_public_profile = true,
    show_rating = true,
    updated_at = now()
  where id = p_id;
end;
$$;

create or replace function public.ensure_demo_post(
  p_id uuid,
  p_user_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_post_type text,
  p_hours_cost numeric,
  p_exchange_format text,
  p_meeting_preference text,
  p_city text,
  p_region text,
  p_state text,
  p_country text,
  p_lat double precision,
  p_lng double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.posts (
    id,
    user_id,
    title,
    description,
    category,
    post_type,
    hours_cost,
    status,
    city,
    region,
    state,
    country,
    latitude,
    longitude,
    exchange_format,
    meeting_preference
  ) values (
    p_id,
    p_user_id,
    p_title,
    p_description,
    p_category,
    p_post_type,
    p_hours_cost,
    'active',
    p_city,
    p_region,
    p_state,
    p_country,
    p_lat,
    p_lng,
    p_exchange_format,
    p_meeting_preference
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    post_type = excluded.post_type,
    hours_cost = excluded.hours_cost,
    status = 'active',
    city = excluded.city,
    region = excluded.region,
    state = excluded.state,
    country = excluded.country,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    exchange_format = excluded.exchange_format,
    meeting_preference = excluded.meeting_preference,
    updated_at = now();
end;
$$;

create or replace function public.seed_demo_listings()
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  -- Tokyo
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000001',
    'demo.yuki.tokyo@demo.chronoshare.app',
    'Yuki Tanaka', 'demo_yuki_tokyo',
    'Tokyo', 'Kanto', null, 'JP', 35.6762, 139.6503
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-a000-000000000001',
    'Japanese conversation practice',
    'Friendly chat sessions for beginners — we can meet at a café in Shibuya or connect over video.',
    'Education', 'offers', 1.0, 'flexible', 'public_venue',
    'Tokyo', 'Kanto', null, 'JP', 35.6762, 139.6503
  );

  -- Lagos
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000002',
    'demo.amara.lagos@demo.chronoshare.app',
    'Amara Okafor', 'demo_amara_lagos',
    'Lagos', 'Lagos State', null, 'NG', 6.5244, 3.3792
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000002',
    '00000000-0000-4000-a000-000000000002',
    'Website help for my tailoring shop',
    'Need a simple one-page site with hours, photos, and WhatsApp contact. Happy to trade sewing repairs.',
    'Tech', 'needs', 2.0, 'remote', 'remote_only',
    'Lagos', 'Lagos State', null, 'NG', 6.5244, 3.3792
  );

  -- London
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000003',
    'demo.james.london@demo.chronoshare.app',
    'James Mitchell', 'demo_james_london',
    'London', 'England', null, 'GB', 51.5074, -0.1278
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000003',
    '00000000-0000-4000-a000-000000000003',
    'Acoustic guitar lessons',
    'Learn chords, strumming patterns, and your first songs. I can host at a community centre or teach remotely.',
    'Music', 'offers', 1.5, 'flexible', 'flexible',
    'London', 'England', null, 'GB', 51.5074, -0.1278
  );

  -- Mexico City
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000004',
    'demo.sofia.cdmx@demo.chronoshare.app',
    'Sofia Mendez', 'demo_sofia_cdmx',
    'Mexico City', 'CDMX', null, 'MX', 19.4326, -99.1332
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000004',
    '00000000-0000-4000-a000-000000000004',
    'Tamale-making workshop at home',
    'Small group lesson — masa, fillings, and steaming. Vegetarian options available.',
    'Cooking', 'offers', 2.0, 'in_person', 'public_venue',
    'Mexico City', 'CDMX', null, 'MX', 19.4326, -99.1332
  );

  -- Mumbai
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000005',
    'demo.raj.mumbai@demo.chronoshare.app',
    'Raj Patel', 'demo_raj_mumbai',
    'Mumbai', 'Maharashtra', null, 'IN', 19.0760, 72.8777
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000005',
    '00000000-0000-4000-a000-000000000005',
    'Excel & spreadsheet tutoring',
    'Formulas, pivot tables, and tidy budgets for freelancers. Remote sessions work great.',
    'Tech', 'offers', 1.0, 'remote', 'remote_only',
    'Mumbai', 'Maharashtra', null, 'IN', 19.0760, 72.8777
  );

  -- Stockholm
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000006',
    'demo.emma.stockholm@demo.chronoshare.app',
    'Emma Lindström', 'demo_emma_stockholm',
    'Stockholm', 'Stockholm County', null, 'SE', 59.3293, 18.0686
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000006',
    '00000000-0000-4000-a000-000000000006',
    'Balcony garden design consult',
    'Help me plan herbs, containers, and compost for a north-facing balcony.',
    'Design', 'needs', 1.5, 'in_person', 'flexible',
    'Stockholm', 'Stockholm County', null, 'SE', 59.3293, 18.0686
  );

  -- Nairobi
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000007',
    'demo.kwame.nairobi@demo.chronoshare.app',
    'Kwame Mensah', 'demo_kwame_nairobi',
    'Nairobi', 'Nairobi County', null, 'KE', -1.2921, 36.8219
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000007',
    '00000000-0000-4000-a000-000000000007',
    'Swahili for travelers',
    'Practical phrases, pronunciation, and cultural tips. In person at a public library or online.',
    'Education', 'offers', 1.0, 'flexible', 'public_venue',
    'Nairobi', 'Nairobi County', null, 'KE', -1.2921, 36.8219
  );

  -- São Paulo
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000008',
    'demo.lucas.saopaulo@demo.chronoshare.app',
    'Lucas Silva', 'demo_lucas_saopaulo',
    'São Paulo', 'São Paulo', null, 'BR', -23.5505, -46.6333
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000008',
    '00000000-0000-4000-a000-000000000008',
    'Logo for community garden',
    'Looking for a warm, hand-drawn mark for our neighbourhood garden co-op.',
    'Design', 'needs', 2.5, 'remote', 'remote_only',
    'São Paulo', 'São Paulo', null, 'BR', -23.5505, -46.6333
  );

  -- Seoul
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000009',
    'demo.minji.seoul@demo.chronoshare.app',
    'Min-Ji Park', 'demo_minji_seoul',
    'Seoul', 'Seoul', null, 'KR', 37.5665, 126.9780
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000009',
    '00000000-0000-4000-a000-000000000009',
    'Korean cooking basics',
    'Kimchi jjigae, bibimbap, and banchan prep — ingredients list included.',
    'Cooking', 'offers', 2.0, 'in_person', 'public_venue',
    'Seoul', 'Seoul', null, 'KR', 37.5665, 126.9780
  );

  -- Berlin
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000010',
    'demo.oliver.berlin@demo.chronoshare.app',
    'Oliver Bauer', 'demo_oliver_berlin',
    'Berlin', 'Berlin', null, 'DE', 52.5200, 13.4050
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000010',
    '00000000-0000-4000-a000-000000000010',
    'Bike tune-up & flat repair',
    'Brakes, gears, and chain care. Bring your bike to Tempelhofer Feld on weekends.',
    'Labor', 'offers', 1.0, 'in_person', 'public_venue',
    'Berlin', 'Berlin', null, 'DE', 52.5200, 13.4050
  );

  -- Paris
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000011',
    'demo.claire.paris@demo.chronoshare.app',
    'Claire Dubois', 'demo_claire_paris',
    'Paris', 'Île-de-France', null, 'FR', 48.8566, 2.3522
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000011',
    '00000000-0000-4000-a000-000000000011',
    'Watercolour sketching walk',
    'Two-hour plein-air session along the canal — materials list provided.',
    'Design', 'offers', 1.5, 'in_person', 'public_venue',
    'Paris', 'Île-de-France', null, 'FR', 48.8566, 2.3522
  );

  -- Dubai
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000012',
    'demo.fatima.dubai@demo.chronoshare.app',
    'Fatima Al-Hassan', 'demo_fatima_dubai',
    'Dubai', 'Dubai', null, 'AE', 25.2048, 55.2708
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000012',
    '00000000-0000-4000-a000-000000000012',
    'Resume review for career switch',
    'Moving from hospitality to UX — need feedback on structure and portfolio links.',
    'Education', 'needs', 1.0, 'remote', 'remote_only',
    'Dubai', 'Dubai', null, 'AE', 25.2048, 55.2708
  );

  -- Sydney
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000013',
    'demo.liam.sydney@demo.chronoshare.app',
    'Liam O''Connor', 'demo_liam_sydney',
    'Sydney', 'New South Wales', null, 'AU', -33.8688, 151.2093
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000013',
    '00000000-0000-4000-a000-000000000013',
    'Surfboard ding repair',
    'Small cracks and fin box fixes — drop off at Bondi community shed.',
    'Labor', 'offers', 1.5, 'in_person', 'flexible',
    'Sydney', 'New South Wales', null, 'AU', -33.8688, 151.2093
  );

  -- Toronto
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000014',
    'demo.noah.toronto@demo.chronoshare.app',
    'Noah Thompson', 'demo_noah_toronto',
    'Toronto', 'Ontario', null, 'CA', 43.6532, -79.3832
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000014',
    '00000000-0000-4000-a000-000000000014',
    'Python tutoring for teens',
    'Fun projects with Turtle graphics and small games. Remote or at the public library.',
    'Tech', 'offers', 2.0, 'flexible', 'public_venue',
    'Toronto', 'Ontario', null, 'CA', 43.6532, -79.3832
  );

  -- Cape Town
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000015',
    'demo.zane.capetown@demo.chronoshare.app',
    'Zane Ndlovu', 'demo_zane_capetown',
    'Cape Town', 'Western Cape', null, 'ZA', -33.9249, 18.4241
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000015',
    '00000000-0000-4000-a000-000000000015',
    'Help moving plants to new plot',
    'Community food garden relocation — need an extra pair of hands for a morning.',
    'Labor', 'needs', 1.0, 'in_person', 'public_venue',
    'Cape Town', 'Western Cape', null, 'ZA', -33.9249, 18.4241
  );

  -- Buenos Aires
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000016',
    'demo.carla.buenosaires@demo.chronoshare.app',
    'Carla Vega', 'demo_carla_buenosaires',
    'Buenos Aires', 'Buenos Aires', null, 'AR', -34.6037, -58.3816
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000016',
    '00000000-0000-4000-a000-000000000016',
    'Intro tango lesson',
    'Basic steps, embrace, and musicality — no partner required.',
    'Music', 'offers', 1.5, 'in_person', 'public_venue',
    'Buenos Aires', 'Buenos Aires', null, 'AR', -34.6037, -58.3816
  );

  -- Bangkok
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000017',
    'demo.pim.bangkok@demo.chronoshare.app',
    'Pim Srisuk', 'demo_pim_bangkok',
    'Bangkok', 'Bangkok', null, 'TH', 13.7563, 100.5018
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000017',
    '00000000-0000-4000-a000-000000000017',
    'Thai street food at home',
    'Pad krapow and mango sticky rice — market tour optional.',
    'Cooking', 'offers', 2.0, 'in_person', 'flexible',
    'Bangkok', 'Bangkok', null, 'TH', 13.7563, 100.5018
  );

  -- New York
  perform public.ensure_demo_user(
    '00000000-0000-4000-a000-000000000018',
    'demo.maya.nyc@demo.chronoshare.app',
    'Maya Johnson', 'demo_maya_nyc',
    'New York', 'New York', 'NY', 'US', 40.7128, -74.0060
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000018',
    '00000000-0000-4000-a000-000000000018',
    'Furniture assembly help',
    'IKEA bookshelf and desk — tools provided, Brooklyn apartment walk-up.',
    'Labor', 'needs', 1.0, 'in_person', 'public_venue',
    'New York', 'New York', 'NY', 'US', 40.7128, -74.0060
  );

  -- Extra listings from existing demo users (more board variety)
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000019',
    '00000000-0000-4000-a000-000000000003',
    'Dog walking swap',
    'Need someone to walk Luna on weekday mornings — I can pet-sit on weekends.',
    'Labor', 'needs', 0.5, 'in_person', 'flexible',
    'London', 'England', null, 'GB', 51.5074, -0.1278
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000020',
    '00000000-0000-4000-a000-000000000005',
    'Tax prep spreadsheet cleanup',
    'Organize receipts and categories before accountant visit.',
    'Tech', 'needs', 1.5, 'remote', 'remote_only',
    'Mumbai', 'Maharashtra', null, 'IN', 19.0760, 72.8777
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000021',
    '00000000-0000-4000-a000-000000000014',
    'Snow shoveling — winter swap',
    'Clear driveway after storms; will trade summer lawn care hours.',
    'Labor', 'offers', 1.0, 'in_person', 'flexible',
    'Toronto', 'Ontario', null, 'CA', 43.6532, -79.3832
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000022',
    '00000000-0000-4000-a000-000000000010',
    'German conversation over coffee',
    'Casual B1/B2 practice for expats new to Berlin.',
    'Education', 'offers', 1.0, 'in_person', 'public_venue',
    'Berlin', 'Berlin', null, 'DE', 52.5200, 13.4050
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000023',
    '00000000-0000-4000-a000-000000000001',
    'Help translating event flyer',
    'Community solar workshop — need English ↔ Japanese copy edit.',
    'Design', 'needs', 1.0, 'remote', 'remote_only',
    'Tokyo', 'Kanto', null, 'JP', 35.6762, 139.6503
  );
  perform public.ensure_demo_post(
    '00000000-0000-4000-b000-000000000024',
    '00000000-0000-4000-a000-000000000018',
    'Jazz piano listening club',
    'Monthly remote listen-and-chat — share favourites and learn basic theory.',
    'Music', 'offers', 0.5, 'remote', 'remote_only',
    'New York', 'New York', 'NY', 'US', 40.7128, -74.0060
  );
end;
$$;

create or replace function public.admin_seed_demo_listings(p_key text)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if not public.admin_verify_key(p_key) then
    raise exception 'Invalid admin key';
  end if;

  perform public.seed_demo_listings();
end;
$$;

revoke all on function public.ensure_demo_user(uuid, text, text, text, text, text, text, text, double precision, double precision) from public;
revoke all on function public.ensure_demo_post(uuid, uuid, text, text, text, text, numeric, text, text, text, text, text, text, double precision, double precision) from public;
revoke all on function public.seed_demo_listings() from public;

grant execute on function public.admin_seed_demo_listings(text) to anon, authenticated;

select public.seed_demo_listings();
