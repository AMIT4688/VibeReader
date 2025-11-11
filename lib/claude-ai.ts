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
const GOOGLE_AI_STUDIO_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY;

type AIProvider = 'google-ai-studio' | 'openrouter' | 'fallback';

function getAvailableProvider(): AIProvider {
  if (GOOGLE_AI_STUDIO_KEY && GOOGLE_AI_STUDIO_KEY !== 'your_google_ai_studio_api_key_here') {
    return 'google-ai-studio';
  }
  if (OPENROUTER_API_KEY) {
    return 'openrouter';
  }
  return 'fallback';
}

export async function getAIRecommendations(
  preferences: QuizPreferences
): Promise<AIBookRecommendation[]> {
  const provider = getAvailableProvider();
  console.log('Using AI provider:', provider);

  if (provider === 'fallback') {
    console.log('No AI API keys configured, falling back to Google Books search');
    return getGoogleBooksRecommendations(preferences);
  }

  try {
    console.log('Getting AI recommendations with preferences:', preferences);
    const prompt = buildPrompt(preferences);

    let content: string;

    if (provider === 'google-ai-studio') {
      content = await callGoogleAIStudio(prompt);
    } else {
      content = await callOpenRouter(prompt);
    }

    console.log('AI Response received:', content.substring(0, 200));

    let jsonMatch = content.match(/```json\s*(\[[\s\S]*?\])\s*```/);
    if (!jsonMatch) {
      jsonMatch = content.match(/\[[\s\S]*\]/);
    }
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : null;
    if (!jsonString) {
      throw new Error('No valid JSON found in response');
    }

    const aiSuggestions = JSON.parse(jsonString);
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
          description: book.description || suggestion.description || 'No description available.',
          matchScore: suggestion.matchScore || 85,
          matchExplanation: suggestion.matchExplanation || 'Recommended based on your preferences.',
          coverUrl: book.cover_url,
          googleBooksId: book.google_books_id,
          analytics: {
            pageCount: book.length || suggestion.analytics?.pageCount || 300,
            pacing: suggestion.analytics?.pacing || 'medium',
            moods: suggestion.analytics?.moods || ['engaging'],
            themes: suggestion.analytics?.themes || [book.genre || 'Fiction'],
          },
        });
      } else {
        // If Google Books doesn't have it, use AI suggestion with defaults
        recommendations.push({
          ...suggestion,
          analytics: {
            pageCount: suggestion.analytics?.pageCount || 300,
            pacing: suggestion.analytics?.pacing || 'medium',
            moods: suggestion.analytics?.moods || ['engaging'],
            themes: suggestion.analytics?.themes || ['Fiction'],
          },
        });
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
          pageCount: book.length || 300,
          pacing: preferences.pacing,
          moods: moodDescription ? [moodDescription] : ['engaging'],
          themes: genre ? [genre] : ['Fiction'],
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

async function callGoogleAIStudio(prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_STUDIO_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google AI Studio API error:', errorText);
    throw new Error(`Google AI Studio API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callOpenRouter(prompt: string): Promise<string> {
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
  return data.choices[0].message.content;
}

export async function getVibeBasedRecommendations(
  vibe: string
): Promise<AIBookRecommendation[]> {
  const provider = getAvailableProvider();
  console.log('Using AI provider for vibe recommendations:', provider);

  if (provider === 'fallback') {
    console.log('No AI API keys configured, falling back to Google Books search');
    return getGoogleBooksVibeRecommendations(vibe);
  }

  try {
    console.log('Getting AI recommendations for vibe:', vibe);
    const prompt = buildVibePrompt(vibe);

    let content: string;
    if (provider === 'google-ai-studio') {
      content = await callGoogleAIStudio(prompt);
    } else {
      content = await callOpenRouter(prompt);
    }

    console.log('AI Response received for vibe:', vibe);

    let jsonMatch = content.match(/```json\s*(\[[\s\S]*?\])\s*```/);
    if (!jsonMatch) {
      jsonMatch = content.match(/\[[\s\S]*\]/);
    }
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : null;
    if (!jsonString) {
      throw new Error('No valid JSON found in response');
    }

    const aiSuggestions = JSON.parse(jsonString);
    console.log('AI suggested', aiSuggestions.length, 'books for vibe:', vibe);

    const recommendations: AIBookRecommendation[] = [];

    for (const suggestion of aiSuggestions.slice(0, 6)) {
      const searchQuery = `${suggestion.title} ${suggestion.author}`;
      const books = await searchBooks(searchQuery, 1);

      if (books.length > 0) {
        const book = formatGoogleBook(books[0]);
        recommendations.push({
          title: book.title,
          author: book.author,
          description: book.description || suggestion.description || 'No description available.',
          matchScore: suggestion.matchScore || 90,
          matchExplanation: suggestion.matchExplanation || `Perfect for ${vibe} vibes!`,
          coverUrl: book.cover_url,
          googleBooksId: book.google_books_id,
          analytics: {
            pageCount: book.length || suggestion.analytics?.pageCount || 300,
            pacing: suggestion.analytics?.pacing || 'medium',
            moods: suggestion.analytics?.moods || [vibe.toLowerCase()],
            themes: suggestion.analytics?.themes || [book.genre || 'Fiction'],
          },
        });
      } else {
        recommendations.push({
          ...suggestion,
          analytics: {
            pageCount: suggestion.analytics?.pageCount || 300,
            pacing: suggestion.analytics?.pacing || 'medium',
            moods: suggestion.analytics?.moods || [vibe.toLowerCase()],
            themes: suggestion.analytics?.themes || ['Fiction'],
          },
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Error getting vibe-based AI recommendations:', error);
    return getGoogleBooksVibeRecommendations(vibe);
  }
}

function buildVibePrompt(vibe: string): string {
  const vibeDescriptions: Record<string, string> = {
    'Energetic': 'fast-paced, action-packed, thrilling books with high energy and excitement',
    'Calm': 'peaceful, meditative, slow-paced books that promote relaxation and contemplation',
    'Motivated': 'inspiring, self-improvement, achievement-focused books that drive ambition',
    'Reflective': 'thought-provoking, philosophical, introspective books that encourage deep thinking',
  };

  const description = vibeDescriptions[vibe] || 'engaging and well-written books';

  return `You are a book recommendation expert. Recommend books that match the "${vibe}" vibe.

Vibe description: ${description}

Return ONLY valid JSON array with 6 books. Do not include any other text:
[{
  "title": "Book Title",
  "author": "Author Name",
  "description": "Two engaging sentences explaining why this book matches the ${vibe} vibe",
  "matchScore": 92,
  "matchExplanation": "Why this book perfectly captures ${vibe} energy",
  "analytics": {
    "pageCount": 310,
    "pacing": "fast",
    "moods": ["${vibe.toLowerCase()}", "engaging", "immersive"],
    "themes": ["adventure", "discovery"]
  }
}]`;
}

async function getGoogleBooksVibeRecommendations(
  vibe: string
): Promise<AIBookRecommendation[]> {
  console.log('Using Google Books search for vibe:', vibe);

  const vibeQueries: Record<string, string[]> = {
    'Energetic': ['subject:thriller', 'subject:action', 'subject:adventure'],
    'Calm': ['subject:meditation', 'subject:nature', 'subject:poetry'],
    'Motivated': ['subject:self-help', 'subject:business', 'subject:biography'],
    'Reflective': ['subject:philosophy', 'subject:literary fiction', 'subject:memoir'],
  };

  const queries = vibeQueries[vibe] || ['bestseller'];
  const recommendations: AIBookRecommendation[] = [];
  const searchedBooks = new Set<string>();

  for (const query of queries) {
    const books = await searchBooks(query, 10);

    for (const googleBook of books) {
      const book = formatGoogleBook(googleBook);
      const bookKey = `${book.title}-${book.author}`;

      if (searchedBooks.has(bookKey)) continue;
      searchedBooks.add(bookKey);

      recommendations.push({
        title: book.title,
        author: book.author,
        description: book.description || 'No description available.',
        matchScore: 85 + Math.floor(Math.random() * 15),
        matchExplanation: `This book captures the ${vibe} energy you're looking for!`,
        coverUrl: book.cover_url,
        googleBooksId: book.google_books_id,
        analytics: {
          pageCount: book.length || 300,
          pacing: vibe === 'Energetic' ? 'fast' : vibe === 'Calm' ? 'slow' : 'medium',
          moods: [vibe.toLowerCase(), 'engaging'],
          themes: [book.genre || 'Fiction'],
        },
      });

      if (recommendations.length >= 6) break;
    }

    if (recommendations.length >= 6) break;
  }

  return recommendations.slice(0, 6);
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
