import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn('⚠️ Supabase environment variables are not configured. Database features will not work.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Book = Database['public']['Tables']['books']['Row'];
export type UserBook = Database['public']['Tables']['user_books']['Row'];
export type ReadingChallenge = Database['public']['Tables']['reading_challenges']['Row'];

export type BookStatus = 'want_to_read' | 'currently_reading' | 'finished';

export interface AIAnalytics {
  pageCount: number;
  pacing: 'slow' | 'medium' | 'fast';
  moods: string[];
  themes: string[];
}

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    pageCount?: number;
  };
}
