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

        // Update book in database with found google_books_id
        await (supabase as any)
          .from('books')
          .update({ google_books_id: bookId })
          .eq('id', bookData.book.id);
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
      setCheckingAvailability(false);

      // Check if book can be embedded (using modern iframe approach)
      const canEmbed = info.embeddable && info.viewability !== 'NO_PAGES';

      if (canEmbed) {
        // Viewer will load via iframe
        setViewerLoaded(true);
        setViewerError(null);
      } else {
        setViewerError(
          info.viewability === 'NO_PAGES'
            ? 'This book is not available for preview due to publisher restrictions.'
            : 'Limited preview available. Full content cannot be displayed.'
        );
      }
    } catch (error: any) {
      console.error('Error checking Google Books availability:', error);
      setViewerError(error.message || 'Unable to load book from Google Books');
      setCheckingAvailability(false);
    }
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
                    <p className="mb-4">
                      You can still track your reading progress here and access the book through other sources.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                      <p className="text-blue-800 font-medium mb-2">💡 Books That Usually Work:</p>
                      <ul className="text-blue-700 text-xs space-y-1 ml-4 list-disc">
                        <li>Classic literature (Pride and Prejudice, Moby Dick, The Great Gatsby)</li>
                        <li>Public domain books (anything published before 1928)</li>
                        <li>Books with full preview enabled by the publisher</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show iframe viewer for embeddable books */}
            {!viewerError && viewerLoaded && googleBooksInfo?.bookId && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-xl p-4 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                      <span className="font-bold text-gray-900">Interactive Reader</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                        ✓ Available
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Use the navigation controls inside the reader to browse pages, search text, and adjust settings.
                  </p>
                </div>

                <div className="relative w-full bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200" style={{ height: '800px' }}>
                  <iframe
                    src={`https://books.google.com/books?id=${googleBooksInfo.bookId}&lpg=PP1&pg=PP1&output=embed`}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    title={`${bookData.book.title} - Book Viewer`}
                    allowFullScreen
                    onLoad={() => {
                      console.log('Book viewer loaded successfully');
                    }}
                    onError={() => {
                      setViewerError('Failed to load book viewer. The book may not be available for preview.');
                      setViewerLoaded(false);
                    }}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900 mb-2">Reading Tips:</p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Use arrow keys or click arrows to navigate pages</li>
                        <li>• Click the search icon to find specific content</li>
                        <li>• Adjust zoom level for comfortable reading</li>
                        <li>• Your progress is automatically saved as you read</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show loading state */}
            {!viewerError && !viewerLoaded && !checkingAvailability && (
              <div className="flex flex-col items-center justify-center p-12 text-center" style={{ minHeight: '600px' }}>
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Initializing Book Viewer...</h3>
                <p className="text-muted-foreground max-w-md">
                  Please wait while we load the book content.
                </p>
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
