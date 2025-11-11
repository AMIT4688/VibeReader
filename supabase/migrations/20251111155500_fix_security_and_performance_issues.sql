/*
  # Fix Security and Performance Issues
  
  1. Add Missing Foreign Key Indexes
    - Add index on `recommendations.book_id`
    - Add index on `user_books.book_id`
    
  2. Optimize RLS Policies (Auth Function Initialization)
    - Replace `auth.uid()` with `(select auth.uid())` in all policies
    - This prevents re-evaluation for each row, improving performance at scale
    
  3. Fix Function Search Path
    - Update `update_updated_at_column` function with immutable search path
    
  4. Notes
    - Unused indexes are kept as they will be used as data grows
    - Foreign key indexes are critical for join performance
    - RLS optimization significantly improves query performance
*/

-- ============================================
-- PART 1: Add Missing Foreign Key Indexes
-- ============================================

-- Index for recommendations.book_id foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'recommendations' AND indexname = 'idx_recommendations_book_id'
  ) THEN
    CREATE INDEX idx_recommendations_book_id ON recommendations(book_id);
  END IF;
END $$;

-- Index for user_books.book_id foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'user_books' AND indexname = 'idx_user_books_book_id'
  ) THEN
    CREATE INDEX idx_user_books_book_id ON user_books(book_id);
  END IF;
END $$;

-- ============================================
-- PART 2: Optimize RLS Policies - user_profiles
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- ============================================
-- PART 3: Optimize RLS Policies - reading_sessions
-- ============================================

DROP POLICY IF EXISTS "Users can view own reading sessions" ON reading_sessions;
CREATE POLICY "Users can view own reading sessions"
  ON reading_sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own reading sessions" ON reading_sessions;
CREATE POLICY "Users can insert own reading sessions"
  ON reading_sessions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own reading sessions" ON reading_sessions;
CREATE POLICY "Users can update own reading sessions"
  ON reading_sessions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own reading sessions" ON reading_sessions;
CREATE POLICY "Users can delete own reading sessions"
  ON reading_sessions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================
-- PART 4: Optimize RLS Policies - recommendations
-- ============================================

DROP POLICY IF EXISTS "Users can view own recommendations" ON recommendations;
CREATE POLICY "Users can view own recommendations"
  ON recommendations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own recommendations" ON recommendations;
CREATE POLICY "Users can insert own recommendations"
  ON recommendations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own recommendations" ON recommendations;
CREATE POLICY "Users can delete own recommendations"
  ON recommendations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================
-- PART 5: Optimize RLS Policies - distraction_events
-- ============================================

DROP POLICY IF EXISTS "Users can view own distraction events" ON distraction_events;
CREATE POLICY "Users can view own distraction events"
  ON distraction_events FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own distraction events" ON distraction_events;
CREATE POLICY "Users can insert own distraction events"
  ON distraction_events FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- PART 6: Optimize RLS Policies - user_books
-- ============================================

DROP POLICY IF EXISTS "Users can view own books" ON user_books;
CREATE POLICY "Users can view own books"
  ON user_books FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own books" ON user_books;
CREATE POLICY "Users can insert own books"
  ON user_books FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own books" ON user_books;
CREATE POLICY "Users can update own books"
  ON user_books FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own books" ON user_books;
CREATE POLICY "Users can delete own books"
  ON user_books FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================
-- PART 7: Optimize RLS Policies - reading_challenges
-- ============================================

DROP POLICY IF EXISTS "Users can view own challenges" ON reading_challenges;
CREATE POLICY "Users can view own challenges"
  ON reading_challenges FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own challenges" ON reading_challenges;
CREATE POLICY "Users can insert own challenges"
  ON reading_challenges FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own challenges" ON reading_challenges;
CREATE POLICY "Users can update own challenges"
  ON reading_challenges FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- PART 8: Optimize RLS Policies - user_vibe_preferences
-- ============================================

DROP POLICY IF EXISTS "Users can view own vibe preferences" ON user_vibe_preferences;
CREATE POLICY "Users can view own vibe preferences"
  ON user_vibe_preferences FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own vibe preferences" ON user_vibe_preferences;
CREATE POLICY "Users can insert own vibe preferences"
  ON user_vibe_preferences FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own vibe preferences" ON user_vibe_preferences;
CREATE POLICY "Users can update own vibe preferences"
  ON user_vibe_preferences FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own vibe preferences" ON user_vibe_preferences;
CREATE POLICY "Users can delete own vibe preferences"
  ON user_vibe_preferences FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================
-- PART 9: Fix Function Search Path
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;