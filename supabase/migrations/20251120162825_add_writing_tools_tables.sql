/*
  # Add Writing Tools Tables

  1. New Tables
    - `characters`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, character name)
      - `description` (text, character physical description)
      - `motivations` (text, character goals and desires)
      - `relationships` (text, character relationships)
      - `backstory` (text, character history)
      - `ai_suggestions` (jsonb, AI-generated suggestions)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `stories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text, story title)
      - `outline` (text, story outline)
      - `mood` (text, story mood/tone)
      - `pacing` (text, story pacing)
      - `genre` (text, story genre)
      - `setting` (text, story setting)
      - `ai_plot_suggestions` (jsonb, AI-generated plot suggestions)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Users can only view, create, update, and delete their own data
    - Authenticated users only

  3. Important Notes
    - Tables support AI-enhanced writing workflow
    - JSON columns store structured AI suggestions
    - All operations require authentication
*/

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  motivations text DEFAULT '',
  relationships text DEFAULT '',
  backstory text DEFAULT '',
  ai_suggestions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Story',
  outline text DEFAULT '',
  mood text DEFAULT '',
  pacing text DEFAULT '',
  genre text DEFAULT '',
  setting text DEFAULT '',
  ai_plot_suggestions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters"
  ON characters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stories"
  ON stories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON stories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS characters_user_id_idx ON characters(user_id);
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);