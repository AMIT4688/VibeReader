/*
  # Update Books Insert Policy

  ## Changes
  - Drop existing insert policy
  - Create new policy that allows public inserts for seeding
*/

DROP POLICY IF EXISTS "Allow inserting books" ON books;

CREATE POLICY "Allow inserting books"
  ON books FOR INSERT
  WITH CHECK (true);
