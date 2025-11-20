export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          google_books_id: string | null
          title: string
          author: string | null
          cover_url: string | null
          description: string | null
          page_count: number
          created_at: string
        }
        Insert: {
          id?: string
          google_books_id?: string | null
          title: string
          author?: string | null
          cover_url?: string | null
          description?: string | null
          page_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          google_books_id?: string | null
          title?: string
          author?: string | null
          cover_url?: string | null
          description?: string | null
          page_count?: number
          created_at?: string
        }
      }
      user_books: {
        Row: {
          id: string
          user_id: string
          book_id: string
          status: 'want_to_read' | 'currently_reading' | 'finished'
          progress_percent: number
          ai_analytics: Json | null
          finished_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          status: 'want_to_read' | 'currently_reading' | 'finished'
          progress_percent?: number
          ai_analytics?: Json | null
          finished_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          status?: 'want_to_read' | 'currently_reading' | 'finished'
          progress_percent?: number
          ai_analytics?: Json | null
          finished_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reading_challenges: {
        Row: {
          id: string
          user_id: string
          year: number
          goal: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          goal?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: number
          goal?: number
          created_at?: string
        }
      }
    }
  }
}
