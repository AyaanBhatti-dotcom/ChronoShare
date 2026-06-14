-- Rotate dev admin access key (replaces default chrono-dev-admin).

update public.admin_access
set dev_key = 'Steezz66!!'
where id = 1;
