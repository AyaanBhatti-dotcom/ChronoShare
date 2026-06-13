-- Auto-confirm new auth users so signup does not require email verification.
-- Supabase may still attempt to send mail depending on project auth settings,
-- but users can sign in immediately after signup.

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

drop trigger if exists autoconfirm_user_on_signup on auth.users;

create trigger autoconfirm_user_on_signup
  after insert on auth.users
  for each row
  execute function public.autoconfirm_auth_user();
