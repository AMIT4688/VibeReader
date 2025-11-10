'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { searchBooks, formatGoogleBook } from '@/lib/google-books';
import { supabase, type BookStatus, type GoogleBook } from '@/lib/db';
import { toast } from 'sonner';

interface AddBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAdded?: () => void;
}

export function AddBookModal({ open, onOpenChange, onBookAdded }: AddBookModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      console.log('Searching for:', searchQuery);
      const results = await searchBooks(searchQuery);
      console.log('Search results:', results.length, 'books found');

      if (results.length === 0) {
        toast.info('No books found. Try a different search term.');
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search books. Check console for details.');
    } finally {
      setSearching(false);
    }
  }

  async function handleAddBook(googleBook: GoogleBook, status: BookStatus) {
    setAdding(googleBook.id);

    try {
      console.log('📚 Starting to add book:', googleBook.volumeInfo.title);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error('Authentication error: ' + authError.message);
      }
      if (!user) {
        console.error('❌ No user found');
        throw new Error('Not authenticated');
      }

      console.log('✅ User authenticated:', user.id);

      const formattedBook = formatGoogleBook(googleBook);
      console.log('📖 Formatted book data:', formattedBook);

      let bookId: string;
      const { data: existingBook, error: checkError } = await (supabase as any)
        .from('books')
        .select('id')
        .eq('google_books_id', formattedBook.google_books_id)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing book:', checkError);
        throw checkError;
      }

      if (existingBook) {
        console.log('✅ Book already exists in database:', existingBook.id);
        bookId = existingBook.id;
      } else {
        console.log('📝 Inserting new book into database...');
        const { data: newBook, error: bookError } = await (supabase as any)
          .from('books')
          .insert([formattedBook])
          .select('id')
          .single();

        if (bookError) {
          console.error('❌ Error inserting book:', bookError);
          throw bookError;
        }
        console.log('✅ Book inserted successfully:', newBook.id);
        bookId = newBook.id;
      }

      console.log('🔍 Checking if user already has this book...');
      const { data: existingUserBook, error: checkUserBookError } = await (supabase as any)
        .from('user_books')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();

      if (checkUserBookError) {
        console.error('❌ Error checking user book:', checkUserBookError);
        throw checkUserBookError;
      }

      if (existingUserBook) {
        console.log('⚠️ Book already in user library');
        toast.info('Book already in your library');
      } else {
        console.log('📝 Adding book to user library...');
        const { error: userBookError } = await (supabase as any)
          .from('user_books')
          .insert([{
            user_id: user.id,
            book_id: bookId,
            status,
          }]);

        if (userBookError) {
          console.error('❌ Error adding to user library:', userBookError);
          throw userBookError;
        }
        console.log('✅ Book added to user library successfully!');
        toast.success('Book added to your library!');
      }

      setSearchQuery('');
      setSearchResults([]);
      onOpenChange(false);
      onBookAdded?.();
    } catch (error) {
      console.error('💥 Error adding book:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        toast.error('Failed to add book: ' + error.message);
      } else {
        toast.error('Failed to add book');
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add a Book</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={searching}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>

        <ScrollArea className="h-[400px] pr-4">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Search for books to add to your library</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((book) => {
                const { volumeInfo } = book;
                const thumbnail = volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:');

                return (
                  <div key={book.id} className="flex gap-4 p-4 border rounded-lg">
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt={volumeInfo.title}
                        className="w-20 h-28 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2">{volumeInfo.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {volumeInfo.authors?.join(', ') || 'Unknown Author'}
                      </p>
                      {volumeInfo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {volumeInfo.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Select
                          onValueChange={(status) => handleAddBook(book, status as BookStatus)}
                          disabled={adding === book.id}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Add to shelf..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="want_to_read">Want to Read</SelectItem>
                            <SelectItem value="currently_reading">Currently Reading</SelectItem>
                            <SelectItem value="finished">Finished</SelectItem>
                          </SelectContent>
                        </Select>
                        {adding === book.id && (
                          <Loader2 className="h-4 w-4 animate-spin self-center" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
