'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, type Book, type UserBook } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, BookOpen, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface BookWithUserBook {
  book: Book;
  userBook: UserBook;
}

interface GoogleBooksInfo {
  bookId: string | null;
  viewability: string;
  embeddable: boolean;
  previewLink: string;
  webReaderLink: string | null;
  accessViewStatus: string;
}

export default function ReadBookClient() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;

  const [loading, setLoading] = useState(true);
  const [bookData, setBookData] = useState<BookWithUserBook | null>(null);
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [googleBooksInfo, setGoogleBooksInfo] = useState<GoogleBooksInfo | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (bookData) {
      checkGoogleBooksAvailability();
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

  async function checkGoogleBooksAvailability() {
    if (!bookData) return;

    setCheckingAvailability(true);
    setViewerError(null);

    try {
      let bookId = bookData.book.google_books_id;

      // If no google_books_id, search for the book
      if (!bookId) {
        const searchQuery = encodeURIComponent(`${bookData.book.title} ${bookData.book.author || ''}`);
        const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=1`;

        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchResponse.ok || !searchData.items || searchData.items.length === 0) {
          throw new Error('Book not found in Google Books database');
        }

        bookId = searchData.items[0].id;
      }

      // Get detailed book information
      const detailsUrl = `https://www.googleapis.com/books/v1/volumes/${bookId}`;
      const detailsResponse = await fetch(detailsUrl);

      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch book details from Google Books');
      }

      const bookDetails = await detailsResponse.json();
      const accessInfo = bookDetails.accessInfo || {};
      const volumeInfo = bookDetails.volumeInfo || {};

      const info: GoogleBooksInfo = {
        bookId: bookId,
        viewability: accessInfo.viewability || 'NO_PAGES',
        embeddable: accessInfo.embeddable || false,
        previewLink: volumeInfo.previewLink || `https://books.google.com/books?id=${bookId}`,
        webReaderLink: accessInfo.webReaderLink || null,
        accessViewStatus: accessInfo.accessViewStatus || 'NONE',
      };

      setGoogleBooksInfo(info);

      // Try to load the viewer if embeddable
      if (info.embeddable && info.bookId) {
        loadGoogleBooksViewer(info.bookId);
      } else {
        setViewerError(
          info.viewability === 'NO_PAGES'
            ? 'This book is not available for preview due to publisher restrictions.'
            : 'Limited preview available. Full content cannot be displayed.'
        );
        setCheckingAvailability(false);
      }
    } catch (error: any) {
      console.error('Error checking Google Books availability:', error);
      setViewerError(error.message || 'Unable to load book from Google Books');
      setCheckingAvailability(false);
    }
  }

  function loadGoogleBooksViewer(bookId: string) {
    // Check if script already loaded
    if ((window as any).google?.books) {
      initializeViewer(bookId);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/books/jsapi.js';
    script.async = true;
    script.onload = () => {
      initializeViewer(bookId);
    };
    script.onerror = () => {
      setViewerError('Failed to load Google Books viewer library');
      setCheckingAvailability(false);
    };
    document.body.appendChild(script);
  }

  function initializeViewer(bookId: string) {
    if (!(window as any).google) {
      setViewerError('Google Books library not available');
      setCheckingAvailability(false);
      return;
    }

    const google = (window as any).google;
    google.books.load();

    google.books.setOnLoadCallback(() => {
      const viewerElement = document.getElementById('viewerCanvas');
      if (!viewerElement) {
        setViewerError('Viewer container not found');
        setCheckingAvailability(false);
        return;
      }

      const viewer = new google.books.DefaultViewer(viewerElement);
      viewer.load(bookId, () => {
        setViewerLoaded(true);
        setCheckingAvailability(false);
        setViewerError(null);
      }, (error: any) => {
        console.error('Viewer load error:', error);
        setViewerError('This book cannot be displayed in the viewer. It may have limited preview or restricted access.');
        setCheckingAvailability(false);
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
            {/* Show loading state */}
            {checkingAvailability && (
              <div className="flex flex-col items-center justify-center p-12 text-center" style={{ minHeight: '600px' }}>
                <Loader2 className="h-16 w-16 text-primary mb-4 animate-spin" />
                <h3 className="text-xl font-semibold mb-2">Loading Book Content...</h3>
                <p className="text-muted-foreground max-w-md">
                  Checking availability on Google Books...
                </p>
              </div>
            )}

            {/* Show error state with options */}
            {!checkingAvailability && viewerError && (
              <div className="flex flex-col items-center justify-center p-12 text-center" style={{ minHeight: '600px' }}>
                <AlertCircle className="h-16 w-16 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-red-600">Unable to Display Book</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  {viewerError}
                </p>

                <div className="space-y-4 max-w-lg">
                  <div className="p-4 bg-muted rounded-lg text-left">
                    <p className="font-semibold mb-2">{bookData.book.title}</p>
                    <p className="text-sm text-muted-foreground mb-1">by {bookData.book.author}</p>
                    {bookData.book.description && (
                      <p className="text-sm text-muted-foreground mt-3">
                        {bookData.book.description.substring(0, 300)}{bookData.book.description.length > 300 ? '...' : ''}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {googleBooksInfo?.previewLink && (
                      <Button
                        className="w-full"
                        onClick={() => window.open(googleBooksInfo.previewLink, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Google Books
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => checkGoogleBooksAvailability()}
                    >
                      Try Again
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground mt-6">
                    <p className="font-semibold mb-2">Why can't I read this book?</p>
                    <p className="mb-2">
                      "{bookData.book.title}" has limited availability on Google Books due to copyright restrictions.
                      Most recent bestsellers and popular books have restricted access.
                    </p>
                    <p>
                      You can still track your reading progress here and access the book through other sources.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Show viewer or loading state */}
            {!viewerError && (
              <div id="viewerCanvas" style={{ minHeight: '600px', width: '100%' }}>
                {!viewerLoaded && !checkingAvailability && (
                  <div className="flex flex-col items-center justify-center p-12 text-center" style={{ minHeight: '600px' }}>
                    <BookOpen className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Initializing Book Viewer...</h3>
                    <p className="text-muted-foreground max-w-md">
                      Please wait while we load the book content.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
          <p>
            Book content is provided by Google Books. Availability depends on publisher permissions.
          </p>
          {googleBooksInfo && (
            <p className="text-xs">
              Status: {googleBooksInfo.viewability} |
              Embeddable: {googleBooksInfo.embeddable ? 'Yes' : 'No'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
