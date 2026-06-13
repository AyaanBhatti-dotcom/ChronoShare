-- User and post location for regional job matching

alter table public.profiles
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists state text,
  add column if not exists country text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_updated_at timestamptz;

alter table public.posts
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists state text,
  add column if not exists country text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists posts_state_idx on public.posts(state);
create index if not exists posts_location_idx on public.posts(latitude, longitude)
  where latitude is not null and longitude is not null;
