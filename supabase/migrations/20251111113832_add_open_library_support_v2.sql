/*
  # Add Open Library Support

  1. Changes to `books` table
    - Add `open_library_id` column to store Open Library work IDs
    - Add index on `open_library_id` for faster lookups

  2. Notes
    - Books can now come from either Google Books or Open Library
    - The `google_books_id` and `open_library_id` columns help identify the source
    - Both fields are nullable to support books from either source
*/

-- Add open_library_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'open_library_id'
  ) THEN
    ALTER TABLE books ADD COLUMN open_library_id text;
  END IF;
END $$;

-- Create index on open_library_id for faster lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'books' AND indexname = 'idx_books_open_library_id'
  ) THEN
    CREATE INDEX idx_books_open_library_id ON books(open_library_id);
  END IF;
END $$;
