'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Book, type UserBook, type BookStatus } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Loader2 } from 'lucide-react';
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
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-primary">My Library</h1>
        <Button size="lg" className="gap-2" onClick={() => setShowAddBook(true)}>
          <Plus className="h-5 w-5" />
          Add Book
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currently Reading</CardTitle>
        </CardHeader>
        <CardContent>
          {currentlyReading.length === 0 ? (
            <p className="text-muted-foreground">No books currently reading.</p>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Want to Read</CardTitle>
        </CardHeader>
        <CardContent>
          {wantToRead.length === 0 ? (
            <p className="text-muted-foreground">No books in your wishlist.</p>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Finished</CardTitle>
        </CardHeader>
        <CardContent>
          {finished.length === 0 ? (
            <p className="text-muted-foreground">No finished books yet.</p>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
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
        </CardContent>
      </Card>

      <AddBookModal
        open={showAddBook}
        onOpenChange={setShowAddBook}
        onBookAdded={loadBooks}
      />
    </div>
  );
}
