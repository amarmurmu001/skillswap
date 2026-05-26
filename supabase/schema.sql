-- ============================================================
-- SkillSwap — Supabase SQL Schema
-- Run this in your Supabase project → SQL Editor → New query
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── Profiles (extends auth.users) ───────────────────────────────────────────
create table if not exists profiles (
  id            uuid references auth.users on delete cascade primary key,
  name          text not null,
  email         text,
  bio           text default '',
  avatar_url    text,
  location      text default '',
  rating        numeric(3,2) default 0,
  total_reviews integer default 0,
  is_online     boolean default false,
  banned        boolean default false,
  is_admin      boolean not null default false,
  joined_at     timestamptz default now()
);

-- ─── Skills master list ───────────────────────────────────────────────────────
create table if not exists skills (
  id       uuid primary key default uuid_generate_v4(),
  name     text unique not null,
  category text not null
);

-- ─── User skill mappings ──────────────────────────────────────────────────────
create table if not exists user_skills_offered (
  user_id          uuid references profiles(id) on delete cascade,
  skill_id         uuid references skills(id)   on delete cascade,
  experience_level text default 'intermediate',
  primary key (user_id, skill_id)
);

create table if not exists user_skills_wanted (
  user_id  uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id)   on delete cascade,
  primary key (user_id, skill_id)
);

-- ─── Matches ──────────────────────────────────────────────────────────────────
create table if not exists matches (
  id         uuid primary key default uuid_generate_v4(),
  user_a_id  uuid references profiles(id) on delete cascade,
  user_b_id  uuid references profiles(id) on delete cascade,
  status     text default 'pending' check (status in ('pending','active','completed','rejected')),
  score      integer default 0,
  is_perfect boolean default false,
  created_at timestamptz default now(),
  constraint chk_not_self_match check (user_a_id <> user_b_id)
);

create unique index if not exists unique_user_pair_idx 
  on matches (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id));

-- ─── Messages ─────────────────────────────────────────────────────────────────
create table if not exists messages (
  id         uuid primary key default uuid_generate_v4(),
  match_id   uuid references matches(id) on delete cascade,
  sender_id  uuid references profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
create table if not exists sessions (
  id           uuid primary key default uuid_generate_v4(),
  match_id     uuid references matches(id)  on delete cascade,
  host_id      uuid references profiles(id) on delete cascade,
  topic        text,
  scheduled_at timestamptz not null,
  duration     integer default 60,
  meeting_link text,
  status       text default 'upcoming' check (status in ('upcoming','completed','cancelled')),
  created_at   timestamptz default now()
);

-- ─── Reviews ──────────────────────────────────────────────────────────────────
create table if not exists reviews (
  id          uuid primary key default uuid_generate_v4(),
  reviewer_id uuid references profiles(id) on delete cascade,
  reviewee_id uuid references profiles(id) on delete cascade,
  match_id    uuid references matches(id)  on delete cascade,
  rating      integer check (rating between 1 and 5),
  comment     text default '',
  skill_taught text default '',
  created_at  timestamptz default now(),
  constraint chk_not_self_review check (reviewer_id <> reviewee_id)
);

-- Recalculate average rating trigger function
create or replace function public.calculate_user_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reviewee_id uuid;
  v_avg_rating numeric(3,2);
  v_total_reviews integer;
begin
  if (TG_OP = 'DELETE') then
    v_reviewee_id := old.reviewee_id;
  else
    v_reviewee_id := new.reviewee_id;
  end if;

  select coalesce(avg(rating), 0), count(*)
  into v_avg_rating, v_total_reviews
  from public.reviews
  where reviewee_id = v_reviewee_id;

  update public.profiles
  set rating = round(v_avg_rating, 2),
      total_reviews = v_total_reviews
  where id = v_reviewee_id;

  return null;
end;
$$;

drop trigger if exists tr_on_review_change on public.reviews;
create trigger tr_on_review_change
  after insert or update or delete
  on public.reviews
  for each row
  execute procedure public.calculate_user_rating();

-- ─── Notifications ────────────────────────────────────────────────────────────
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  message    text default '',
  is_read    boolean default false,
  link       text default '/',
  created_at timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table profiles            enable row level security;
alter table matches             enable row level security;
alter table messages            enable row level security;
alter table sessions            enable row level security;
alter table reviews             enable row level security;
alter table notifications       enable row level security;
alter table skills              enable row level security;
alter table user_skills_offered enable row level security;
alter table user_skills_wanted  enable row level security;

-- Helper: admin check (security definer avoids RLS recursion)
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

-- profiles: public read, self-write, admins can moderate
create policy "Profiles viewable by all"   on profiles for select using (true);
create policy "Users insert own profile"   on profiles for insert with check (auth.uid() = id);
create policy "Users update own profile"   on profiles for update using (auth.uid() = id);
create policy "Admins update any profile"  on profiles for update using (public.is_admin());

-- matches
create policy "Participants view matches"  on matches for select
  using (public.is_admin() or auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "Auth users create matches"  on matches for insert
  with check (auth.uid() = user_a_id);
create policy "Participants update match"  on matches for update
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "Admins update any match"    on matches for update
  using (public.is_admin());

-- messages
create policy "Participants read messages" on messages for select
  using (exists (select 1 from matches where id = match_id and (user_a_id = auth.uid() or user_b_id = auth.uid())));
create policy "Sender inserts messages"    on messages for insert
  with check (auth.uid() = sender_id);

-- sessions
create policy "Participants view sessions" on sessions for select
  using (exists (select 1 from matches where id = match_id and (user_a_id = auth.uid() or user_b_id = auth.uid())));
create policy "Host creates sessions"      on sessions for insert
  with check (
    auth.uid() = host_id and
    exists (
      select 1 from matches
      where matches.id = match_id
        and (matches.user_a_id = auth.uid() or matches.user_b_id = auth.uid())
    )
  );
create policy "Host updates sessions"      on sessions for update
  using (auth.uid() = host_id);

-- reviews: public read
create policy "Reviews viewable by all"   on reviews for select using (true);
create policy "Reviewer inserts review"   on reviews for insert
  with check (
    auth.uid() = reviewer_id and
    exists (
      select 1 from matches
      where matches.id = match_id
        and (matches.user_a_id = auth.uid() or matches.user_b_id = auth.uid())
    )
  );

-- notifications
create policy "Own notifications read"    on notifications for select using (auth.uid() = user_id);
create policy "Own notifications update"  on notifications for update using (auth.uid() = user_id);
create policy "Authenticated insert notifications" on notifications for insert with check (auth.uid() is not null);

-- skills (read-only for everyone, no user can insert/update)
create policy "Skills viewable by all" on skills for select using (true);

-- user_skills_offered
create policy "Skills offered viewable by all"   on user_skills_offered for select using (true);
create policy "Users manage own skills offered"   on user_skills_offered for insert with check (auth.uid() = user_id);
create policy "Users delete own skills offered"   on user_skills_offered for delete using (auth.uid() = user_id);

-- user_skills_wanted
create policy "Skills wanted viewable by all"    on user_skills_wanted for select using (true);
create policy "Users manage own skills wanted"   on user_skills_wanted for insert with check (auth.uid() = user_id);
create policy "Users delete own skills wanted"   on user_skills_wanted for delete using (auth.uid() = user_id);

-- ─── Seed skills ──────────────────────────────────────────────────────────────
insert into skills (name, category) values
  ('JavaScript','Tech'),('Python','Tech'),('React','Tech'),('Node.js','Tech'),
  ('Machine Learning','Tech'),('UI/UX Design','Tech'),('Docker','Tech'),('GraphQL','Tech'),
  ('Guitar','Music'),('Piano','Music'),('Music Production','Music'),('Singing','Music'),
  ('Spanish','Language'),('French','Language'),('Japanese','Language'),
  ('Hindi','Language'),('German','Language'),
  ('Photography','Art'),('Illustration','Art'),('Video Editing','Art'),
  ('Yoga','Fitness'),('Cooking','Lifestyle'),('Chess','Games'),('Public Speaking','Professional')
on conflict (name) do nothing;

-- ─── Realtime (enable for messages table) ─────────────────────────────────────
-- This enables WebSockets for instant message delivery
alter publication supabase_realtime add table messages;

-- ─── Auto-create profile on signup (bypasses RLS) ────────────────────────────
-- This trigger fires when a new row is added to auth.users.
-- security definer = runs as the function owner (superuser), not the caller.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, bio, location, avatar_url, joined_at, is_online)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'bio', ''),
    coalesce(new.raw_user_meta_data->>'location', ''),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/8.x/avataaars/svg?seed=' || new.id
    ),
    coalesce(new.created_at, now()),
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, profiles.name),
    bio = coalesce(excluded.bio, profiles.bio),
    location = coalesce(excluded.location, profiles.location),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

-- Drop if exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
