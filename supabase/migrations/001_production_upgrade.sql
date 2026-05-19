-- SkillSwap production upgrade (run in Supabase SQL Editor if schema already exists)
-- Adds admin role, profile email sync, and admin RLS policies.

alter table profiles add column if not exists email text;
alter table profiles add column if not exists is_admin boolean not null default false;

-- Sync email from auth.users for existing profiles
update profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Profile auto-create includes email
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url, joined_at, is_online)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'https://api.dicebear.com/8.x/avataaars/svg?seed=' || new.id,
    now(),
    true
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

-- Admin policies (participants + admins)
drop policy if exists "Admins update any profile" on profiles;
create policy "Admins update any profile" on profiles for update
  using (public.is_admin());

drop policy if exists "Admins read all matches" on matches;
create policy "Admins read all matches" on matches for select
  using (
    public.is_admin()
    or auth.uid() = user_a_id
    or auth.uid() = user_b_id
  );

drop policy if exists "Admins update any match" on matches;
create policy "Admins update any match" on matches for update
  using (public.is_admin());

drop policy if exists "Admins read all reviews" on reviews;
create policy "Admins read all reviews" on reviews for select
  using (true);

drop policy if exists "System inserts notifs" on notifications;
create policy "Authenticated insert notifications" on notifications for insert
  with check (auth.uid() is not null);

-- Promote your account (replace with your user UUID from auth.users):
-- update profiles set is_admin = true where email = 'you@example.com';
