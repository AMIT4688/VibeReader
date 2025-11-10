/*
  # Add Books Insert Policy for Seeding

  ## Changes
  - Add policy to allow inserting books for system/seeding purposes
  - This allows the seed script to populate the books catalog

  ## Note
  In production, you may want to restrict this to service role only
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'books' AND policyname = 'Allow inserting books'
  ) THEN
    CREATE POLICY "Allow inserting books"
      ON books FOR INSERT
      TO authenticated, anon
      WITH CHECK (true);
  END IF;
END $$;
