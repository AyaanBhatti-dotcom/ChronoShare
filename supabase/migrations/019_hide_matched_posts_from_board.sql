-- Keep matched listings off the job board: block reopening posts with active exchanges.

create or replace function public.prevent_reopen_matched_post()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'active' and old.status is distinct from 'active' then
    if exists (
      select 1
      from public.exchanges e
      where e.post_id = new.id
        and e.status in ('pending', 'completed')
    ) then
      raise exception 'This listing was matched in an exchange and cannot be reopened';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_prevent_reopen_matched on public.posts;

create trigger posts_prevent_reopen_matched
  before update on public.posts
  for each row
  execute function public.prevent_reopen_matched_post();

-- Repair any listings that slipped back to active after being matched.
update public.posts p
set status = 'closed'
where p.status = 'active'
  and exists (
    select 1
    from public.exchanges e
    where e.post_id = p.id
      and e.status in ('pending', 'completed')
  );
