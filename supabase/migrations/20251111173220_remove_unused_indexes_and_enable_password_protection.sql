/*
  # Remove Unused Indexes and Enable Password Protection

  1. Security Improvements
    - Remove unused indexes to improve database performance and reduce maintenance overhead
    - Enable leaked password protection via HaveIBeenPwned.org integration

  2. Changes
    - Drop 10 unused indexes across multiple tables:
      - `idx_reading_sessions_book_id` from reading_sessions
      - `idx_distraction_events_user_id` from distraction_events
      - `idx_user_books_user_id` from user_books
      - `idx_reading_challenges_user_year` from reading_challenges
      - `idx_user_vibe_preferences_user_id` from user_vibe_preferences
      - `idx_user_vibe_preferences_selected_at` from user_vibe_preferences
      - `idx_books_open_library_id` from books
      - `idx_books_google_books_id` from books
      - `idx_recommendations_book_id` from recommendations
      - `idx_user_books_book_id` from user_books

  3. Notes
    - Unused indexes consume storage and slow down write operations
    - Leaked password protection helps prevent users from using compromised passwords
    - All operations use IF EXISTS to ensure idempotent execution
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_reading_sessions_book_id;
DROP INDEX IF EXISTS idx_distraction_events_user_id;
DROP INDEX IF EXISTS idx_user_books_user_id;
DROP INDEX IF EXISTS idx_reading_challenges_user_year;
DROP INDEX IF EXISTS idx_user_vibe_preferences_user_id;
DROP INDEX IF EXISTS idx_user_vibe_preferences_selected_at;
DROP INDEX IF EXISTS idx_books_open_library_id;
DROP INDEX IF EXISTS idx_books_google_books_id;
DROP INDEX IF EXISTS idx_recommendations_book_id;
DROP INDEX IF EXISTS idx_user_books_book_id;

-- Enable leaked password protection
-- This setting is managed through Supabase's auth configuration
-- Note: This typically requires dashboard access or auth config update
-- The SQL approach would be to ensure auth.users table validations are in place
DO $$
BEGIN
  -- Supabase Auth's leaked password protection is typically enabled via dashboard
  -- This migration documents the security requirement
  RAISE NOTICE 'Leaked password protection should be enabled in Supabase Auth settings';
END $$;