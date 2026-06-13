-- confirmed_at is generated on hosted Supabase; only email_confirmed_at may be set.

create or replace function public.autoconfirm_auth_user()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if new.email_confirmed_at is null then
    update auth.users
    set
      email_confirmed_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
    where id = new.id;
  end if;

  return new;
end;
$$;
