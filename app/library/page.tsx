'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Book, type UserBook, type BookStatus } from '@/lib/db';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Loader2, BookOpen, Star, CheckCircle2, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navigation />

      <div className="pt-16">
        <div className="max-w-[1400px] mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="text-6xl">📚</div>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-3">
                My Awesome Library!
              </h1>
              <p className="text-2xl font-bold text-gray-700">
                {books.length} {books.length === 1 ? 'book' : 'books'} in your collection! 🎉
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setShowAddBook(true)}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-8 py-6 text-xl font-black rounded-full shadow-2xl transition-all hover:scale-110 border-4 border-white"
            >
              <Plus className="h-6 w-6 mr-2" />
              Add New Book!
            </Button>
          </div>

          {books.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-white rounded-3xl p-12 max-w-2xl mx-auto shadow-xl border-4 border-purple-200">
                <div className="text-8xl mb-6">📖</div>
                <h2 className="text-4xl font-black text-gray-800 mb-4">
                  Your Library is Empty!
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Let's add some awesome books! Click the button above or take our quiz to get personalized book recommendations.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => setShowAddBook(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-black rounded-full shadow-xl"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add a Book
                  </Button>
                  <Button
                    onClick={() => router.push('/recommendations')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-6 text-lg font-black rounded-full shadow-xl"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Get Recommendations
                  </Button>
                </div>
              </div>
            </div>
          )}

          {books.length > 0 && (
            <div className="space-y-16">
              <section className="animate-in fade-in slide-in-from-bottom duration-1000">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-6 mb-8 shadow-xl border-4 border-white">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <BookOpen className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="text-white">
                      <h2 className="text-4xl font-black">Currently Reading</h2>
                      <p className="text-xl font-bold">{currentlyReading.length} {currentlyReading.length === 1 ? 'book' : 'books'} you're reading right now!</p>
                    </div>
                  </div>
                </div>

                {currentlyReading.length === 0 ? (
                  <Card className="border-0 bg-white rounded-3xl shadow-lg">
                    <CardContent className="p-12 text-center">
                      <BookOpen className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                      <p className="text-2xl font-bold text-gray-600 mb-2">No books here yet!</p>
                      <p className="text-lg text-gray-500">Move a book from "Want to Read" to start your reading adventure!</p>
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

              <section className="animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 mb-8 shadow-xl border-4 border-white">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <Star className="h-8 w-8 text-orange-500 fill-orange-500" />
                    </div>
                    <div className="text-white">
                      <h2 className="text-4xl font-black">Want to Read</h2>
                      <p className="text-xl font-bold">{wantToRead.length} {wantToRead.length === 1 ? 'book' : 'books'} on your wishlist!</p>
                    </div>
                  </div>
                </div>

                {wantToRead.length === 0 ? (
                  <Card className="border-0 bg-white rounded-3xl shadow-lg">
                    <CardContent className="p-12 text-center">
                      <Star className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                      <p className="text-2xl font-bold text-gray-600 mb-2">Your wishlist is empty!</p>
                      <p className="text-lg text-gray-500">Add books you want to read to build your collection!</p>
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

              <section className="animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-6 mb-8 shadow-xl border-4 border-white">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="text-white">
                      <h2 className="text-4xl font-black">Finished!</h2>
                      <p className="text-xl font-bold">{finished.length} {finished.length === 1 ? 'book' : 'books'} completed! Amazing! 🎉</p>
                    </div>
                  </div>
                </div>

                {finished.length === 0 ? (
                  <Card className="border-0 bg-white rounded-3xl shadow-lg">
                    <CardContent className="p-12 text-center">
                      <CheckCircle2 className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                      <p className="text-2xl font-bold text-gray-600 mb-2">No finished books yet!</p>
                      <p className="text-lg text-gray-500">Complete a book to see your awesome achievements here!</p>
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
          )}

          {books.length > 0 && (
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl p-1 max-w-2xl mx-auto shadow-2xl">
                <div className="bg-white rounded-3xl p-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Sparkles className="h-8 w-8 text-purple-500 animate-pulse" />
                    <h3 className="text-3xl font-black text-gray-800">Need More Books?</h3>
                    <Sparkles className="h-8 w-8 text-pink-500 animate-pulse" />
                  </div>
                  <p className="text-xl text-gray-700 mb-6 font-semibold">
                    Take our fun quiz to discover more amazing books you'll love!
                  </p>
                  <Button
                    onClick={() => router.push('/recommendations')}
                    className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-10 py-6 text-xl font-black rounded-full shadow-xl transition-all hover:scale-105"
                  >
                    <Sparkles className="h-6 w-6 mr-2" />
                    Get Book Recommendations!
                  </Button>
                </div>
              </div>
            </div>
          )}
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
