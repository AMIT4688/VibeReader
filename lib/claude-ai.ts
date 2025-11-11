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
    return getMockRecommendations(preferences);
  }

  try {
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
      throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    return getMockRecommendations(preferences);
  }
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
