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

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY;

async function checkModels() {
  console.log('🔍 Checking available Gemini models...\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);
      return;
    }

    const data = await response.json();

    console.log('✅ Available models:\n');
    data.models.forEach((model: any) => {
      console.log(`📦 ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    });

    // Find the right model for generateContent
    const generateModels = data.models.filter((m: any) =>
      m.supportedGenerationMethods?.includes('generateContent')
    );

    console.log('\n✨ Models supporting generateContent:');
    generateModels.forEach((model: any) => {
      console.log(`   • ${model.name}`);
    });

  } catch (error: any) {
    console.error('❌ Exception:', error.message);
  }
}

checkModels();
