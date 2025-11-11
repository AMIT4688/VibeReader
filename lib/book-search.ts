import { searchBooks as searchGoogleBooks, getBookDetails as getGoogleBookDetails, formatGoogleBook } from './google-books';
import { searchOpenLibrary, enrichWithOpenLibraryDetails } from './open-library';
import type { GoogleBook } from './db';

export async function searchAllBooks(query: string, maxResults: number = 20): Promise<GoogleBook[]> {
  console.log('🔍 Searching all book sources for:', query);

  const [googleResults, openLibraryResults] = await Promise.all([
    searchGoogleBooks(query, Math.floor(maxResults / 2)),
    searchOpenLibrary(query, Math.floor(maxResults / 2)),
  ]);

  console.log(`📚 Google Books: ${googleResults.length} results`);
  console.log(`📚 Open Library: ${openLibraryResults.length} results`);

  const combined = [...googleResults, ...openLibraryResults];

  const uniqueBooks = new Map<string, GoogleBook>();
  combined.forEach(book => {
    const title = book.volumeInfo?.title?.toLowerCase() || '';
    const author = book.volumeInfo?.authors?.[0]?.toLowerCase() || '';
    const key = `${title}-${author}`;

    if (!uniqueBooks.has(key)) {
      uniqueBooks.set(key, book);
    }
  });

  const results = Array.from(uniqueBooks.values()).slice(0, maxResults);
  console.log(`✅ Combined unique results: ${results.length} books`);

  return results;
}

export async function getBookDetailsFromAnySource(bookId: string, source?: string): Promise<GoogleBook | null> {
  if (source === 'openlibrary' || bookId.startsWith('/works/')) {
    console.log('📖 Fetching from Open Library:', bookId);
    const details = await enrichWithOpenLibraryDetails(bookId);
    return details;
  }

  console.log('📖 Fetching from Google Books:', bookId);
  return await getGoogleBookDetails(bookId);
}

export function formatBookForDatabase(book: GoogleBook) {
  const { volumeInfo } = book;
  const isOpenLibrary = (book as any).source === 'openlibrary';

  return {
    google_books_id: isOpenLibrary ? null : book.id,
    open_library_id: isOpenLibrary ? book.id : null,
    title: volumeInfo.title || 'Unknown Title',
    author: volumeInfo.authors?.[0] || 'Unknown Author',
    genre: volumeInfo.categories?.[0] || 'General',
    mood_tags: volumeInfo.categories || [],
    length: volumeInfo.pageCount || 0,
    cover_url: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
    description: volumeInfo.description || '',
  };
}
