import { searchBooks, formatGoogleBook } from './google-books';

export interface QuizPreferences {
  genres: string[];
  moodHappySad: number;
  moodHopefulBleak: number;
  pacing: 'slow' | 'medium' | 'fast';
  length: 'short' | 'medium' | 'long';
  focus: number;
}

export interface AIBookRecommendation {
  title: string;
  author: string;
  description: string;
  matchScore: number;
  matchExplanation: string;
  coverUrl?: string;
  googleBooksId?: string;
  analytics: {
    pageCount: number;
    pacing: 'slow' | 'medium' | 'fast';
    moods: string[];
    themes: string[];
  };
}

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

export async function getAIRecommendations(
  preferences: QuizPreferences
): Promise<AIBookRecommendation[]> {
  if (!OPENROUTER_API_KEY) {
    console.log('No OpenRouter API key, falling back to Google Books search');
    return getGoogleBooksRecommendations(preferences);
  }

  try {
    console.log('Getting AI recommendations with preferences:', preferences);
    const prompt = buildPrompt(preferences);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : '',
        'X-Title': 'VibeReader',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log('AI Response received:', content.substring(0, 200));

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const aiSuggestions = JSON.parse(jsonMatch[0]);
    console.log('AI suggested', aiSuggestions.length, 'books');

    // Fetch real book data from Google Books for each AI suggestion
    const recommendations: AIBookRecommendation[] = [];

    for (const suggestion of aiSuggestions.slice(0, 5)) {
      const searchQuery = `${suggestion.title} ${suggestion.author}`;
      const books = await searchBooks(searchQuery, 1);

      if (books.length > 0) {
        const book = formatGoogleBook(books[0]);
        recommendations.push({
          title: book.title,
          author: book.author,
          description: book.description || suggestion.description,
          matchScore: suggestion.matchScore,
          matchExplanation: suggestion.matchExplanation,
          coverUrl: book.cover_url,
          googleBooksId: book.google_books_id,
          analytics: {
            pageCount: book.length || suggestion.analytics.pageCount,
            pacing: suggestion.analytics.pacing,
            moods: suggestion.analytics.moods,
            themes: suggestion.analytics.themes,
          },
        });
      } else {
        // If Google Books doesn't have it, use AI suggestion
        recommendations.push(suggestion);
      }
    }

    console.log('Final recommendations count:', recommendations.length);
    return recommendations;
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    return getGoogleBooksRecommendations(preferences);
  }
}

async function getGoogleBooksRecommendations(
  preferences: QuizPreferences
): Promise<AIBookRecommendation[]> {
  console.log('Using Google Books search for recommendations');

  const recommendations: AIBookRecommendation[] = [];
  const searchedBooks = new Set<string>();

  // Search for books in each preferred genre
  for (const genre of preferences.genres.slice(0, 3)) {
    const moodDescription = getMoodDescription(
      preferences.moodHappySad,
      preferences.moodHopefulBleak
    );

    const searchQuery = `subject:${genre} ${moodDescription}`;
    console.log('Searching Google Books:', searchQuery);

    const books = await searchBooks(searchQuery, 10);

    for (const googleBook of books) {
      const book = formatGoogleBook(googleBook);
      const bookKey = `${book.title}-${book.author}`;

      // Avoid duplicates
      if (searchedBooks.has(bookKey)) continue;
      searchedBooks.add(bookKey);

      // Filter by length preference
      if (!matchesLengthPreference(book.length, preferences.length)) continue;

      const matchScore = calculateMatchScore(book, preferences);

      recommendations.push({
        title: book.title,
        author: book.author,
        description: book.description || 'No description available.',
        matchScore,
        matchExplanation: generateMatchExplanation(preferences, genre),
        coverUrl: book.cover_url,
        googleBooksId: book.google_books_id,
        analytics: {
          pageCount: book.length,
          pacing: preferences.pacing,
          moods: [moodDescription],
          themes: [genre],
        },
      });

      if (recommendations.length >= 5) break;
    }

    if (recommendations.length >= 5) break;
  }

  // Sort by match score
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return recommendations.slice(0, 5);
}

function matchesLengthPreference(pageCount: number, preference: string): boolean {
  if (preference === 'short') return pageCount < 250;
  if (preference === 'medium') return pageCount >= 250 && pageCount <= 400;
  if (preference === 'long') return pageCount > 400;
  return true;
}

function calculateMatchScore(book: any, preferences: QuizPreferences): number {
  let score = 70;

  // Bonus for matching genre
  if (preferences.genres.some(g => book.genre?.includes(g))) {
    score += 15;
  }

  // Bonus for length match
  if (matchesLengthPreference(book.length, preferences.length)) {
    score += 10;
  }

  // Random variation
  score += Math.floor(Math.random() * 10);

  return Math.min(100, score);
}

function generateMatchExplanation(preferences: QuizPreferences, genre: string): string {
  const focusType = preferences.focus > 50 ? 'plot-driven' : 'character-driven';
  return `This ${genre} book matches your preference for ${focusType} stories with ${preferences.pacing} pacing and ${preferences.length} length.`;
}

function buildPrompt(preferences: QuizPreferences): string {
  const moodDescription = getMoodDescription(
    preferences.moodHappySad,
    preferences.moodHopefulBleak
  );
  const focusDescription = preferences.focus > 50 ? 'plot-driven' : 'character-driven';

  return `You are a book recommendation expert. User preferences:
- Genres: ${preferences.genres.join(', ')}
- Mood: ${moodDescription}
- Pacing: ${preferences.pacing}
- Length: ${preferences.length}
- Focus: ${focusDescription}

Return ONLY valid JSON array with 5 books. Do not include any other text:
[{
  "title": "Book Title",
  "author": "Author Name",
  "description": "Two engaging sentences",
  "matchScore": 92,
  "matchExplanation": "Why this matches the preferences",
  "analytics": {
    "pageCount": 310,
    "pacing": "fast",
    "moods": ["dark", "tense", "mysterious"],
    "themes": ["family", "identity"]
  }
}]`;
}

function getMoodDescription(happySad: number, hopefulBleak: number): string {
  const moodParts: string[] = [];

  if (happySad < 40) moodParts.push('melancholic');
  else if (happySad > 60) moodParts.push('uplifting');

  if (hopefulBleak < 40) moodParts.push('bleak');
  else if (hopefulBleak > 60) moodParts.push('hopeful');

  return moodParts.length > 0 ? moodParts.join(' and ') : 'balanced';
}

function getMockRecommendations(preferences: QuizPreferences): AIBookRecommendation[] {
  const mockBooks: AIBookRecommendation[] = [
    {
      title: 'The Midnight Library',
      author: 'Matt Haig',
      description:
        'Between life and death, there is a library with infinite books and infinite lives. A thought-provoking journey through choices and possibilities.',
      matchScore: 95,
      matchExplanation: `Perfect match for your ${preferences.genres.join(', ')} preferences with uplifting themes and ${preferences.pacing} pacing.`,
      analytics: {
        pageCount: 304,
        pacing: 'medium',
        moods: ['uplifting', 'thought-provoking', 'hopeful'],
        themes: ['choices', 'identity', 'second chances'],
      },
    },
    {
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      description:
        'A lone astronaut must save the earth from disaster in this propulsive, cinematic science thriller. Fast-paced and deeply engaging.',
      matchScore: 88,
      matchExplanation: 'Matches your preference for plot-driven stories with thrilling pacing.',
      analytics: {
        pageCount: 496,
        pacing: 'fast',
        moods: ['tense', 'hopeful', 'adventurous'],
        themes: ['survival', 'science', 'humanity'],
      },
    },
    {
      title: 'The House in the Cerulean Sea',
      author: 'TJ Klune',
      description:
        'A magical island, a dangerous task, a burning secret. A story about the profound experience of discovering an unlikely family.',
      matchScore: 92,
      matchExplanation: 'Character-driven with uplifting themes that match your mood preferences.',
      analytics: {
        pageCount: 394,
        pacing: 'medium',
        moods: ['uplifting', 'lighthearted', 'emotional'],
        themes: ['family', 'acceptance', 'magic'],
      },
    },
    {
      title: 'The Silent Patient',
      author: 'Alex Michaelides',
      description:
        "A woman shoots her husband and then never speaks another word. A criminal psychotherapist becomes obsessed with uncovering her motive.",
      matchScore: 85,
      matchExplanation: 'Fast-paced psychological thriller with dark, mysterious elements.',
      analytics: {
        pageCount: 325,
        pacing: 'fast',
        moods: ['suspenseful', 'dark', 'mysterious'],
        themes: ['psychology', 'secrets', 'obsession'],
      },
    },
    {
      title: 'Where the Crawdads Sing',
      author: 'Delia Owens',
      description:
        'A coming-of-age story about a young girl who raises herself in the marshes of North Carolina while becoming a suspect in a murder investigation.',
      matchScore: 90,
      matchExplanation: 'Beautiful character study with mystery elements at your preferred pacing.',
      analytics: {
        pageCount: 384,
        pacing: 'medium',
        moods: ['emotional', 'mysterious', 'atmospheric'],
        themes: ['nature', 'isolation', 'resilience'],
      },
    },
  ];

  return mockBooks.map((book) => ({
    ...book,
    matchScore: Math.max(75, book.matchScore - Math.floor(Math.random() * 10)),
  }));
}
