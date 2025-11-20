export interface CharacterSuggestion {
  category: string;
  suggestions: string[];
}

export interface PlotSuggestion {
  chapterNumber: number;
  title: string;
  description: string;
  keyEvents: string[];
}

export interface SettingSuggestion {
  aspect: string;
  details: string[];
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callAIAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Google AI Studio API key is not configured. Please add NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY to your environment variables.');
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
}

export async function getCharacterDevelopmentSuggestions(
  name: string,
  description: string,
  motivations: string,
  relationships: string,
  backstory: string
): Promise<CharacterSuggestion[]> {
  const prompt = `You are a creative writing assistant specializing in character development.

Given this character information:
- Name: ${name || 'Not specified'}
- Description: ${description || 'Not specified'}
- Motivations: ${motivations || 'Not specified'}
- Relationships: ${relationships || 'Not specified'}
- Backstory: ${backstory || 'Not specified'}

Provide 3-5 specific, actionable suggestions for developing this character further. Format your response as a JSON array with this structure:
[
  {
    "category": "Personality Depth",
    "suggestions": ["suggestion 1", "suggestion 2"]
  },
  {
    "category": "Conflict & Growth",
    "suggestions": ["suggestion 1", "suggestion 2"]
  }
]

Focus on: personality traits, internal conflicts, character arcs, relationship dynamics, and unique quirks.`;

  try {
    const response = await callAIAPI(prompt);

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [
      {
        category: 'General Development',
        suggestions: [response.substring(0, 200)],
      },
    ];
  } catch (error) {
    console.error('Error getting character suggestions:', error);
    throw error;
  }
}

export async function getPlotArchitectSuggestions(
  title: string,
  outline: string,
  mood: string,
  pacing: string,
  genre: string,
  setting: string
): Promise<{
  chapters: PlotSuggestion[];
  plotTwists: string[];
  settings: SettingSuggestion[];
}> {
  const prompt = `You are a Plot Architect AI, specializing in story structure and narrative development.

Story Details:
- Title: ${title || 'Untitled'}
- Outline: ${outline || 'Not specified'}
- Mood: ${mood || 'Not specified'}
- Pacing: ${pacing || 'Not specified'}
- Genre: ${genre || 'Not specified'}
- Setting: ${setting || 'Not specified'}

Create a structured plot plan with:
1. Chapter ideas (3-5 chapters) with titles, descriptions, and key events
2. Plot twists (2-3 compelling twists)
3. Setting details (3-4 setting aspects to develop)

Format as JSON:
{
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Chapter Title",
      "description": "What happens in this chapter",
      "keyEvents": ["event 1", "event 2"]
    }
  ],
  "plotTwists": ["twist 1", "twist 2"],
  "settings": [
    {
      "aspect": "Visual Atmosphere",
      "details": ["detail 1", "detail 2"]
    }
  ]
}`;

  try {
    const response = await callAIAPI(prompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      chapters: [],
      plotTwists: [response.substring(0, 150)],
      settings: [],
    };
  } catch (error) {
    console.error('Error getting plot suggestions:', error);
    throw error;
  }
}
