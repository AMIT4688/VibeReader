/*
  # Reading Habit Tracker Database Schema

  ## Overview
  This migration creates the complete database schema for a distraction-free reading habit tracker app
  with personalized recommendations, progress tracking, and distraction detection.

  ## New Tables

  ### `user_profiles`
  Extends auth.users with reading preferences and goals
  - `id` (uuid, FK to auth.users) - User identifier
  - `name` (text) - User display name
  - `preferences` (jsonb) - Stores genre, mood, pace preferences
  - `reading_goal` (integer) - Daily reading goal in minutes
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `books`
  Catalog of available books
  - `id` (uuid) - Book identifier
  - `title` (text) - Book title
  - `author` (text) - Book author
  - `genre` (text) - Primary genre
  - `mood_tags` (text[]) - Array of mood descriptors
  - `length` (integer) - Book length in pages
  - `cover_url` (text) - Book cover image URL
  - `description` (text) - Book description
  - `created_at` (timestamptz) - Record creation timestamp

  ### `reading_sessions`
  Tracks individual reading sessions
  - `id` (uuid) - Session identifier
  - `user_id` (uuid, FK) - User who read
  - `book_id` (uuid, FK) - Book being read
  - `start_time` (timestamptz) - Session start
  - `end_time` (timestamptz) - Session end
  - `pages_read` (integer) - Pages completed in session
  - `created_at` (timestamptz) - Record creation timestamp

  ### `recommendations`
  AI-generated book recommendations
  - `id` (uuid) - Recommendation identifier
  - `user_id` (uuid, FK) - User receiving recommendation
  - `book_id` (uuid, FK) - Recommended book
  - `score` (decimal) - Recommendation confidence score (0-1)
  - `reason` (text) - Explanation for recommendation
  - `created_at` (timestamptz) - Recommendation generation timestamp

  ### `distraction_events`
  Logs distraction detection and responses
  - `id` (uuid) - Event identifier
  - `user_id` (uuid, FK) - User who was distracted
  - `timestamp` (timestamptz) - When distraction occurred
  - `app_detected` (text) - Application that caused distraction
  - `response_action` (text) - User's response to nudge
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Books table is readable by all authenticated users
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  preferences jsonb DEFAULT '{"genres": [], "moods": [], "pace": "medium"}'::jsonb,
  reading_goal integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  genre text NOT NULL,
  mood_tags text[] DEFAULT ARRAY[]::text[],
  length integer DEFAULT 0,
  cover_url text DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Books are viewable by authenticated users"
  ON books FOR SELECT
  TO authenticated
  USING (true);

-- Create reading_sessions table
CREATE TABLE IF NOT EXISTS reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  pages_read integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading sessions"
  ON reading_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading sessions"
  ON reading_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading sessions"
  ON reading_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading sessions"
  ON reading_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  score decimal(3,2) DEFAULT 0.5 CHECK (score >= 0 AND score <= 1),
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
  ON recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create distraction_events table
CREATE TABLE IF NOT EXISTS distraction_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  app_detected text DEFAULT '',
  response_action text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE distraction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own distraction events"
  ON distraction_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own distraction events"
  ON distraction_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_distraction_events_user_id ON distraction_events(user_id);
