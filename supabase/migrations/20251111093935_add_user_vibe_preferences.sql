/*
  # Add User Vibe Preferences Table

  1. New Table
    - `user_vibe_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `vibe` (text) - The selected vibe (Energetic, Calm, Motivated, Reflective)
      - `selected_at` (timestamptz) - When the vibe was selected
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for authenticated users to read/write their own preferences

  3. Indexes
    - Index on user_id for faster lookups
*/

CREATE TABLE IF NOT EXISTS user_vibe_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vibe text NOT NULL CHECK (vibe IN ('Energetic', 'Calm', 'Motivated', 'Reflective')),
  selected_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_vibe_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vibe preferences"
  ON user_vibe_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vibe preferences"
  ON user_vibe_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vibe preferences"
  ON user_vibe_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vibe preferences"
  ON user_vibe_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_vibe_preferences_user_id 
  ON user_vibe_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_vibe_preferences_selected_at 
  ON user_vibe_preferences(selected_at DESC);
