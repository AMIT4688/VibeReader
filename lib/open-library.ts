const BASE_URL = 'https://openlibrary.org';

export interface OpenLibraryBook {
  key: string;
  title: string;
  authors?: Array<{ name: string }>;
  subjects?: string[];
  description?: string | { value: string };
  covers?: number[];
  number_of_pages?: number;
  first_publish_date?: string;
}

export interface OpenLibrarySearchResult {
  docs: Array<{
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    cover_i?: number;
    subject?: string[];
    number_of_pages_median?: number;
  }>;
  numFound: number;
}

export async function searchOpenLibrary(query: string, limit: number = 20): Promise<any[]> {
  if (!query.trim()) {
    console.warn('Empty query provided to searchOpenLibrary');
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      fields: 'key,title,author_name,first_publish_year,cover_i,subject,number_of_pages_median',
    });

    const url = `${BASE_URL}/search.json?${params}`;
    console.log('🔍 Searching Open Library:', query);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-cache',
    });

    console.log('📬 Open Library Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Open Library API error: ${response.statusText}`);
    }

    const data: OpenLibrarySearchResult = await response.json();
    console.log(`✅ Open Library results: ${data.docs.length} books found`);

    return data.docs.map(doc => convertToGoogleBookFormat(doc));
  } catch (error) {
    console.error('💥 Error searching Open Library:', error);
    return [];
  }
}

export async function getOpenLibraryBookDetails(workId: string): Promise<OpenLibraryBook | null> {
  try {
    const url = `${BASE_URL}${workId}.json`;
    console.log('📖 Fetching Open Library book details for:', workId);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`Open Library API error: ${response.statusText}`);
    }

    const data: OpenLibraryBook = await response.json();
    console.log('✅ Open Library book details fetched successfully');
    return data;
  } catch (error) {
    console.error('💥 Error fetching Open Library book details:', error);
    return null;
  }
}

function convertToGoogleBookFormat(openLibDoc: any) {
  const workId = openLibDoc.key;
  const coverId = openLibDoc.cover_i;
  const coverUrl = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : '';

  return {
    id: workId,
    volumeInfo: {
      title: openLibDoc.title || 'Unknown Title',
      authors: openLibDoc.author_name || ['Unknown Author'],
      categories: openLibDoc.subject?.slice(0, 3) || ['General'],
      pageCount: openLibDoc.number_of_pages_median || 0,
      imageLinks: {
        thumbnail: coverUrl,
      },
      description: '',
      publishedDate: openLibDoc.first_publish_year?.toString() || '',
    },
    source: 'openlibrary',
  };
}

export async function enrichWithOpenLibraryDetails(workId: string) {
  const details = await getOpenLibraryBookDetails(workId);
  if (!details) return null;

  let description = '';
  if (details.description) {
    description = typeof details.description === 'string'
      ? details.description
      : details.description.value;
  }

  const coverId = details.covers?.[0];
  const coverUrl = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : '';

  return {
    id: workId,
    volumeInfo: {
      title: details.title || 'Unknown Title',
      authors: details.authors?.map(a => a.name) || ['Unknown Author'],
      categories: details.subjects?.slice(0, 3) || ['General'],
      pageCount: details.number_of_pages || 0,
      imageLinks: {
        thumbnail: coverUrl,
      },
      description: description,
      publishedDate: details.first_publish_date || '',
    },
    source: 'openlibrary',
  };
}
