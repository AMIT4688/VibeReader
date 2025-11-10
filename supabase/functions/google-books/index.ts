import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GoogleBooksVolume {
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

interface BookResult {
  title: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  description: string;
  pageCount: number;
  categories: string[];
  cover: string;
  isbn: string;
}

// Simple in-memory cache with 15-minute expiration
const cache = new Map<string, { data: BookResult; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

function getCached(key: string): BookResult | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: BookResult): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function parseBookData(volume: GoogleBooksVolume): BookResult {
  const { volumeInfo } = volume;
  
  // Find ISBN-13 or ISBN-10
  let isbn = '';
  if (volumeInfo.industryIdentifiers) {
    const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13');
    const isbn10 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_10');
    isbn = isbn13?.identifier || isbn10?.identifier || '';
  }

  return {
    title: volumeInfo.title || '',
    authors: volumeInfo.authors || [],
    publisher: volumeInfo.publisher || '',
    publishedDate: volumeInfo.publishedDate || '',
    description: volumeInfo.description || '',
    pageCount: volumeInfo.pageCount || 0,
    categories: volumeInfo.categories || [],
    cover: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '',
    isbn: isbn,
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_BOOKS_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Google Books API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Remove 'google-books' from path if present
    const functionIndex = pathParts.indexOf('google-books');
    const actualPath = functionIndex >= 0 ? pathParts.slice(functionIndex + 1) : pathParts;

    let googleBooksUrl: string;
    let cacheKey: string;

    // Route: /isbn/{isbn}
    if (actualPath[0] === 'isbn' && actualPath[1]) {
      const isbn = actualPath[1];
      cacheKey = `isbn:${isbn}`;
      
      // Check cache
      const cached = getCached(cacheKey);
      if (cached) {
        return new Response(
          JSON.stringify({ ok: true, book: cached, cached: true }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`;
    }
    // Route: /search?title=...&author=...
    else if (actualPath[0] === 'search') {
      const title = url.searchParams.get('title');
      const author = url.searchParams.get('author');
      
      if (!title && !author) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Either title or author parameter is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const queryParts = [];
      if (title) queryParts.push(`intitle:${title}`);
      if (author) queryParts.push(`inauthor:${author}`);
      const query = queryParts.join('+');
      
      cacheKey = `search:${query}`;
      
      // Check cache
      const cached = getCached(cacheKey);
      if (cached) {
        return new Response(
          JSON.stringify({ ok: true, book: cached, cached: true }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}`;
    }
    else {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Invalid endpoint. Use /isbn/{isbn} or /search?title=...&author=...' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch from Google Books API
    const response = await fetch(googleBooksUrl);
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to fetch from Google Books API' }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: 'No books found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const book = parseBookData(data.items[0]);
    
    // Cache the result
    setCache(cacheKey, book);

    return new Response(
      JSON.stringify({ ok: true, book, cached: false }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});