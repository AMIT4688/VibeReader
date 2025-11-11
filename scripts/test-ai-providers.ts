import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    });
  }
}

loadEnvFile();

const GOOGLE_AI_STUDIO_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY;
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

interface TestResult {
  provider: string;
  status: 'success' | 'failed' | 'not_configured';
  message: string;
  responseTime?: number;
  sampleResponse?: string;
}

async function testGoogleAIStudio(): Promise<TestResult> {
  if (!GOOGLE_AI_STUDIO_KEY || GOOGLE_AI_STUDIO_KEY === 'your_google_ai_studio_api_key_here') {
    return {
      provider: 'Google AI Studio',
      status: 'not_configured',
      message: 'API key not configured in .env file'
    };
  }

  const testPrompt = `You are a book recommendation expert. Recommend books that match the "Energetic" vibe.

Vibe description: fast-paced, action-packed, thrilling books with high energy and excitement

Return ONLY valid JSON array with 3 books. Do not include any other text:
[{
  "title": "Book Title",
  "author": "Author Name",
  "description": "Two engaging sentences explaining why this book matches the Energetic vibe",
  "matchScore": 92,
  "matchExplanation": "Why this book perfectly captures Energetic energy",
  "analytics": {
    "pageCount": 310,
    "pacing": "fast",
    "moods": ["energetic", "engaging", "immersive"],
    "themes": ["adventure", "discovery"]
  }
}]`;

  const startTime = Date.now();

  try {
    console.log('\n🧪 Testing Google AI Studio (Gemini)...');
    console.log('API Key:', GOOGLE_AI_STUDIO_KEY.substring(0, 10) + '...' + GOOGLE_AI_STUDIO_KEY.substring(GOOGLE_AI_STUDIO_KEY.length - 4));

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
                  text: testPrompt,
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

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return {
        provider: 'Google AI Studio',
        status: 'failed',
        message: `API Error: ${response.status} ${response.statusText}`,
        responseTime
      };
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return {
        provider: 'Google AI Studio',
        status: 'failed',
        message: 'Invalid response structure from API',
        responseTime
      };
    }

    const content = data.candidates[0].content.parts[0].text;

    // Try to parse the JSON response (handle markdown code blocks)
    let jsonMatch = content.match(/```json\s*(\[[\s\S]*?\])\s*```/);
    if (!jsonMatch) {
      jsonMatch = content.match(/\[[\s\S]*\]/);
    }
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : null;

    if (!jsonString) {
      return {
        provider: 'Google AI Studio',
        status: 'failed',
        message: 'No valid JSON found in response',
        responseTime,
        sampleResponse: content.substring(0, 200)
      };
    }

    const recommendations = JSON.parse(jsonString);

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return {
        provider: 'Google AI Studio',
        status: 'failed',
        message: 'No recommendations returned',
        responseTime
      };
    }

    return {
      provider: 'Google AI Studio',
      status: 'success',
      message: `✅ Successfully generated ${recommendations.length} recommendations`,
      responseTime,
      sampleResponse: JSON.stringify(recommendations[0], null, 2)
    };

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      provider: 'Google AI Studio',
      status: 'failed',
      message: `Exception: ${error.message}`,
      responseTime
    };
  }
}

async function testOpenRouter(): Promise<TestResult> {
  if (!OPENROUTER_API_KEY) {
    return {
      provider: 'OpenRouter',
      status: 'not_configured',
      message: 'API key not configured in .env file'
    };
  }

  const testPrompt = `You are a book recommendation expert. Recommend books that match the "Calm" vibe.

Vibe description: peaceful, meditative, slow-paced books that promote relaxation and contemplation

Return ONLY valid JSON array with 3 books. Do not include any other text:
[{
  "title": "Book Title",
  "author": "Author Name",
  "description": "Two engaging sentences",
  "matchScore": 92,
  "matchExplanation": "Why this matches",
  "analytics": {
    "pageCount": 310,
    "pacing": "slow",
    "moods": ["calm", "peaceful"],
    "themes": ["meditation", "nature"]
  }
}]`;

  const startTime = Date.now();

  try {
    console.log('\n🧪 Testing OpenRouter (Claude)...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: testPrompt,
          },
        ],
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return {
        provider: 'OpenRouter',
        status: 'failed',
        message: `API Error: ${response.status} ${response.statusText}`,
        responseTime
      };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return {
        provider: 'OpenRouter',
        status: 'failed',
        message: 'No valid JSON found in response',
        responseTime,
        sampleResponse: content.substring(0, 200)
      };
    }

    const recommendations = JSON.parse(jsonMatch[0]);

    return {
      provider: 'OpenRouter',
      status: 'success',
      message: `✅ Successfully generated ${recommendations.length} recommendations`,
      responseTime,
      sampleResponse: JSON.stringify(recommendations[0], null, 2)
    };

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      provider: 'OpenRouter',
      status: 'failed',
      message: `Exception: ${error.message}`,
      responseTime
    };
  }
}

async function runTests() {
  console.log('🚀 Testing AI Provider Integrations for VibeReader\n');
  console.log('=' .repeat(60));

  const results: TestResult[] = [];

  // Test Google AI Studio
  const googleResult = await testGoogleAIStudio();
  results.push(googleResult);

  // Test OpenRouter
  const openRouterResult = await testOpenRouter();
  results.push(openRouterResult);

  // Display Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY\n');

  results.forEach(result => {
    const statusEmoji = result.status === 'success' ? '✅' :
                        result.status === 'failed' ? '❌' : '⚠️';

    console.log(`${statusEmoji} ${result.provider}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Message: ${result.message}`);

    if (result.responseTime) {
      console.log(`   Response Time: ${result.responseTime}ms`);
    }

    if (result.sampleResponse) {
      console.log(`   Sample Response:\n${result.sampleResponse.split('\n').map(line => '   ' + line).join('\n')}`);
    }
    console.log('');
  });

  console.log('='.repeat(60));

  // Determine primary provider
  const primaryProvider = results.find(r => r.status === 'success');
  if (primaryProvider) {
    console.log(`\n✨ Your app will use: ${primaryProvider.provider}`);
    console.log(`⚡ Response time: ~${primaryProvider.responseTime}ms`);
  } else {
    console.log('\n⚠️  No AI providers configured - app will use Google Books API fallback');
  }

  console.log('\n💡 To use a specific provider, ensure its API key is in .env:');
  console.log('   • NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY (Priority 1)');
  console.log('   • NEXT_PUBLIC_OPENROUTER_API_KEY (Priority 2)');
  console.log('   • Google Books API (Automatic fallback)');
}

runTests().catch(console.error);
