-- SkillSwap Production Migration: Constraints + RLS Audit
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ================================================================
-- 1. Unique Match Pair Constraint
--    Prevents duplicate match rows between the same two users,
--    regardless of who initiated (userA vs userB).
-- ================================================================
-- Create unique index for matches unordered pair (resolves Postgres UNIQUE expression syntax error)
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_pair_idx 
ON matches (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id));

-- ================================================================
-- 2. RLS Policies
--    Verify your Supabase dashboard has these enabled.
--    If RLS is already on these tables, drop and re-add as needed.
-- ================================================================

-- profiles: anyone can read, only the owner can update
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- matches: only participants can view/update
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match participants can view"
  ON matches FOR SELECT
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Match participants can update"
  ON matches FOR UPDATE
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Authenticated users can insert matches"
  ON matches FOR INSERT WITH CHECK (auth.uid() = user_a_id);

-- messages: only match participants
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
        AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Match participants can send messages"
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
        AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
    )
  );

-- notifications: only the recipient
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- sessions: only participants
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = sessions.match_id
        AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Session host can insert"
  ON sessions FOR INSERT WITH CHECK (
    auth.uid() = host_id AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_id
        AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Session participants can update"
  ON sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = sessions.match_id
        AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
    )
  );

-- reviews: reviewee can read, authenticated can insert
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can leave reviews"
  ON reviews FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_id
        AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
    )
  );

-- ================================================================
-- 3. Cascade deletes: when a user is deleted, clean up their data
-- ================================================================
ALTER TABLE matches       DROP CONSTRAINT IF EXISTS matches_user_a_id_fkey;
ALTER TABLE matches       ADD CONSTRAINT matches_user_a_id_fkey
  FOREIGN KEY (user_a_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE matches       DROP CONSTRAINT IF EXISTS matches_user_b_id_fkey;
ALTER TABLE matches       ADD CONSTRAINT matches_user_b_id_fkey
  FOREIGN KEY (user_b_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE messages      DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages      ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE reviews        DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;
ALTER TABLE reviews        ADD CONSTRAINT reviews_reviewer_id_fkey
  FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE reviews        DROP CONSTRAINT IF EXISTS reviews_reviewee_id_fkey;
ALTER TABLE reviews        ADD CONSTRAINT reviews_reviewee_id_fkey
  FOREIGN KEY (reviewee_id) REFERENCES profiles(id) ON DELETE CASCADE;
