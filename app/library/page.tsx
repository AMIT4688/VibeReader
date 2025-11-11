'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Book, type UserBook, type BookStatus } from '@/lib/db';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Loader2, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { AddBookModal } from '@/components/AddBookModal';
import { BookCard } from '@/components/BookCard';
import { toast } from 'sonner';

interface BookWithUserBook {
  book: Book;
  userBook: UserBook;
}

export default function LibraryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);
  const [books, setBooks] = useState<BookWithUserBook[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    await loadBooks();
    setLoading(false);
  }

  async function loadBooks() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_books')
        .select(`
          *,
          book:books(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = data?.map((item: any) => ({
        book: item.book,
        userBook: {
          id: item.id,
          user_id: item.user_id,
          book_id: item.book_id,
          status: item.status,
          progress_percent: item.progress_percent,
          ai_analytics: item.ai_analytics,
          finished_at: item.finished_at,
          created_at: item.created_at,
          updated_at: item.updated_at,
        },
      })) || [];

      setBooks(formatted);
    } catch (error) {
      console.error('Error loading books:', error);
      toast.error('Failed to load books');
    }
  }

  async function handleMoveBook(userBookId: string, newStatus: BookStatus) {
    try {
      if (newStatus === 'finished') {
        const { error } = await (supabase as any)
          .from('user_books')
          .update({ status: newStatus, finished_at: new Date().toISOString() })
          .eq('id', userBookId);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('user_books')
          .update({ status: newStatus })
          .eq('id', userBookId);

        if (error) throw error;
      }

      toast.success('Book moved successfully');
      await loadBooks();
    } catch (error) {
      console.error('Error moving book:', error);
      toast.error('Failed to move book');
    }
  }

  async function handleDeleteBook(userBookId: string) {
    try {
      const { error } = await supabase
        .from('user_books')
        .delete()
        .eq('id', userBookId);

      if (error) throw error;

      toast.success('Book removed from library');
      await loadBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to remove book');
    }
  }

  async function handleUpdateProgress(userBookId: string, progress: number) {
    try {
      if (progress >= 100) {
        const { error } = await (supabase as any)
          .from('user_books')
          .update({
            progress_percent: progress,
            status: 'finished',
            finished_at: new Date().toISOString(),
          })
          .eq('id', userBookId);

        if (error) throw error;
        toast.success('Congratulations! Book marked as finished');
      } else {
        const { error } = await (supabase as any)
          .from('user_books')
          .update({ progress_percent: progress })
          .eq('id', userBookId);

        if (error) throw error;
        toast.success('Progress updated');
      }

      await loadBooks();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  }

  function getBooksByStatus(status: BookStatus) {
    return books.filter((b) => b.userBook.status === status);
  }

  const currentlyReading = getBooksByStatus('currently_reading');
  const wantToRead = getBooksByStatus('want_to_read');
  const finished = getBooksByStatus('finished');

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-[#0071E3]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="pt-16">
        <div className="max-w-[1400px] mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#1D1D1F] mb-3">
                My Library
              </h1>
              <p className="text-lg text-[#86868B]">
                {books.length} {books.length === 1 ? 'book' : 'books'} in your collection
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setShowAddBook(true)}
              className="bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-6 text-base rounded-xl transition-all hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Book
            </Button>
          </div>

          <div className="space-y-16">
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-full bg-[#0071E3]/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-[#0071E3]" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#1D1D1F]">Currently Reading</h2>
                  <p className="text-sm text-[#86868B]">{currentlyReading.length} {currentlyReading.length === 1 ? 'book' : 'books'}</p>
                </div>
              </div>

              {currentlyReading.length === 0 ? (
                <Card className="border-0 bg-[#F5F5F7] rounded-2xl">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-16 w-16 text-[#86868B] mx-auto mb-4 opacity-50" />
                    <p className="text-lg text-[#86868B]">No books currently reading.</p>
                    <p className="text-sm text-[#86868B] mt-2">Start reading by moving a book from your wishlist.</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="w-full">
                  <div className="flex gap-6 pb-4">
                    {currentlyReading.map(({ book, userBook }) => (
                      <BookCard
                        key={userBook.id}
                        book={book}
                        userBook={userBook}
                        onMove={handleMoveBook}
                        onDelete={handleDeleteBook}
                        onUpdateProgress={handleUpdateProgress}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </section>

            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[#34C759]" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#1D1D1F]">Want to Read</h2>
                  <p className="text-sm text-[#86868B]">{wantToRead.length} {wantToRead.length === 1 ? 'book' : 'books'}</p>
                </div>
              </div>

              {wantToRead.length === 0 ? (
                <Card className="border-0 bg-[#F5F5F7] rounded-2xl">
                  <CardContent className="p-12 text-center">
                    <Clock className="h-16 w-16 text-[#86868B] mx-auto mb-4 opacity-50" />
                    <p className="text-lg text-[#86868B]">No books in your wishlist.</p>
                    <p className="text-sm text-[#86868B] mt-2">Add books you want to read to build your collection.</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="w-full">
                  <div className="flex gap-6 pb-4">
                    {wantToRead.map(({ book, userBook }) => (
                      <BookCard
                        key={userBook.id}
                        book={book}
                        userBook={userBook}
                        onMove={handleMoveBook}
                        onDelete={handleDeleteBook}
                        onUpdateProgress={handleUpdateProgress}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </section>

            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-full bg-[#5856D6]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#5856D6]" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#1D1D1F]">Finished</h2>
                  <p className="text-sm text-[#86868B]">{finished.length} {finished.length === 1 ? 'book' : 'books'}</p>
                </div>
              </div>

              {finished.length === 0 ? (
                <Card className="border-0 bg-[#F5F5F7] rounded-2xl">
                  <CardContent className="p-12 text-center">
                    <CheckCircle2 className="h-16 w-16 text-[#86868B] mx-auto mb-4 opacity-50" />
                    <p className="text-lg text-[#86868B]">No finished books yet.</p>
                    <p className="text-sm text-[#86868B] mt-2">Complete a book to see your achievements.</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="w-full">
                  <div className="flex gap-6 pb-4">
                    {finished.map(({ book, userBook }) => (
                      <BookCard
                        key={userBook.id}
                        book={book}
                        userBook={userBook}
                        onMove={handleMoveBook}
                        onDelete={handleDeleteBook}
                        onUpdateProgress={handleUpdateProgress}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </section>
          </div>
        </div>
      </div>

      <AddBookModal
        open={showAddBook}
        onOpenChange={setShowAddBook}
        onBookAdded={loadBooks}
      />
    </div>
  );
}
