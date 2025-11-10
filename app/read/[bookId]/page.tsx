'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, type Book, type UserBook } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BookWithUserBook {
  book: Book;
  userBook: UserBook;
}

export default function ReadBookPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;

  const [loading, setLoading] = useState(true);
  const [bookData, setBookData] = useState<BookWithUserBook | null>(null);
  const [viewerLoaded, setViewerLoaded] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (bookData?.book.google_books_id) {
      loadGoogleBooksViewer();
    }
  }, [bookData]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    await loadBookData(user.id);
  }

  async function loadBookData(userId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('user_books')
        .select(`
          *,
          book:books(*)
        `)
        .eq('id', bookId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const formatted: BookWithUserBook = {
        book: data.book,
        userBook: {
          id: data.id,
          user_id: data.user_id,
          book_id: data.book_id,
          status: data.status,
          progress_percent: data.progress_percent,
          ai_analytics: data.ai_analytics,
          finished_at: data.finished_at,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      };

      setBookData(formatted);
      setLoading(false);
    } catch (error) {
      console.error('Error loading book:', error);
      toast.error('Failed to load book');
      router.push('/library');
    }
  }

  function loadGoogleBooksViewer() {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/books/jsapi.js';
    script.async = true;
    script.onload = () => {
      initializeViewer();
    };
    document.body.appendChild(script);
  }

  function initializeViewer() {
    if (!(window as any).google || !bookData) return;

    const google = (window as any).google;
    google.books.load();

    google.books.setOnLoadCallback(() => {
      const viewer = new google.books.DefaultViewer(document.getElementById('viewerCanvas'));
      viewer.load(bookData.book.google_books_id, () => {
        setViewerLoaded(true);
      }, (error: any) => {
        console.error('Viewer error:', error);
        toast.error('This book is not available for reading. Only the preview may be available.');
      });
    });
  }

  async function updateProgress(newProgress: number) {
    if (!bookData) return;

    try {
      const updateData: any = { progress_percent: newProgress };

      if (newProgress >= 100) {
        updateData.status = 'finished';
        updateData.finished_at = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('user_books')
        .update(updateData)
        .eq('id', bookId);

      if (error) throw error;

      setBookData({
        ...bookData,
        userBook: {
          ...bookData.userBook,
          progress_percent: newProgress,
          status: newProgress >= 100 ? 'finished' : bookData.userBook.status,
        },
      });

      if (newProgress >= 100) {
        toast.success('Congratulations! Book marked as finished');
      } else {
        toast.success('Progress updated');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!bookData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/library')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{bookData.book.title}</h1>
              <p className="text-sm text-muted-foreground">{bookData.book.author}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-lg font-semibold">{bookData.userBook.progress_percent}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Update Reading Progress: {bookData.userBook.progress_percent}%
                </label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[bookData.userBook.progress_percent]}
                    onValueChange={(value) => updateProgress(value[0])}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {bookData.userBook.progress_percent}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div id="viewerCanvas" style={{ minHeight: '600px', width: '100%' }}>
              {!viewerLoaded && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Loading Book Viewer...</h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    We're loading the book content from Google Books. Please note that not all books are available for full reading - some may only show a preview.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Book:</strong> {bookData.book.title}</p>
                    <p><strong>Author:</strong> {bookData.book.author}</p>
                    {bookData.book.description && (
                      <p className="max-w-2xl mt-4 text-left">
                        <strong>Description:</strong> {bookData.book.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Book content is provided by Google Books. Availability depends on publisher permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
