/*
  # Add Missing Book Columns
  
  1. Changes to `books` table
    - Add `google_books_id` column to store Google Books API IDs
    - Add `page_count` column to store number of pages
    - Add indexes for better query performance
    
  2. Notes
    - These columns support AI recommendations that use page count
    - The google_books_id helps prevent duplicate books and enables rich data
    - Both fields are nullable to support books added manually
*/

-- Add google_books_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'google_books_id'
  ) THEN
    ALTER TABLE books ADD COLUMN google_books_id text;
  END IF;
END $$;

-- Add page_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'page_count'
  ) THEN
    ALTER TABLE books ADD COLUMN page_count integer DEFAULT 0;
  END IF;
END $$;

-- Create index on google_books_id for faster lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'books' AND indexname = 'idx_books_google_books_id'
  ) THEN
    CREATE INDEX idx_books_google_books_id ON books(google_books_id);
  END IF;
END $$;