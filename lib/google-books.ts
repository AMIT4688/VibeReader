import type { GoogleBook } from './db';

const GOOGLE_BOOKS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
const BASE_URL = 'https://www.googleapis.com/books/v1';

export async function searchBooks(query: string, maxResults: number = 20): Promise<GoogleBook[]> {
  if (!query.trim()) {
    console.warn('Empty query provided to searchBooks');
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      maxResults: maxResults.toString(),
      printType: 'books',
      langRestrict: 'en',
    });

    if (GOOGLE_BOOKS_API_KEY && GOOGLE_BOOKS_API_KEY !== 'your_google_books_api_key_here') {
      params.append('key', GOOGLE_BOOKS_API_KEY);
      console.log('🔑 Using Google Books API key');
    } else {
      console.log('⚠️ No API key - using unauthenticated access');
    }

    const url = `${BASE_URL}/volumes?${params}`;
    console.log('🔍 Searching Google Books:', query);
    console.log('📡 API URL:', url.replace(GOOGLE_BOOKS_API_KEY || '', 'API_KEY_HIDDEN'));

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-cache',
    });

    console.log('📬 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google Books API error:', response.status, errorText);

      if (response.status === 403) {
        console.warn('⚠️ 403 Error - API may be disabled or rate limited');
      }

      throw new Error(`Google Books API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultCount = data.items?.length || 0;
    console.log(`✅ Google Books results: ${resultCount} books found for:`, query);

    if (resultCount === 0) {
      console.warn('⚠️ No results found. Total items in response:', data.totalItems);
    }

    return data.items || [];
  } catch (error) {
    console.error('💥 Error searching books:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return [];
  }
}

export async function getBookDetails(googleBooksId: string): Promise<GoogleBook | null> {
  try {
    const params = new URLSearchParams();

    if (GOOGLE_BOOKS_API_KEY && GOOGLE_BOOKS_API_KEY !== 'your_google_books_api_key_here') {
      params.append('key', GOOGLE_BOOKS_API_KEY);
    }

    const url = `${BASE_URL}/volumes/${googleBooksId}?${params}`;
    console.log('📖 Fetching book details for ID:', googleBooksId);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch book details:', response.status);
      throw new Error(`Google Books API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Book details fetched successfully');
    return data;
  } catch (error) {
    console.error('💥 Error fetching book details:', error);
    return null;
  }
}

export function formatGoogleBook(googleBook: GoogleBook) {
  const { volumeInfo } = googleBook;

  return {
    google_books_id: googleBook.id,
    title: volumeInfo.title || 'Unknown Title',
    author: volumeInfo.authors?.[0] || 'Unknown Author',
    cover_url: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
    description: volumeInfo.description || '',
    page_count: volumeInfo.pageCount || 0,
  };
}
