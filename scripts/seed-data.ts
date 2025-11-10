import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const lines = envFile.split('\n');
    for (const line of lines) {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sampleBooks = [
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    genre: 'Fiction',
    mood_tags: ['uplifting', 'thought-provoking', 'emotional'],
    length: 304,
    description: 'Between life and death, there is a library with infinite books and infinite lives. What if you could try out all your life choices and see how different they might be?',
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Self-Help',
    mood_tags: ['inspiring', 'thought-provoking'],
    length: 320,
    description: 'An easy and proven way to build good habits and break bad ones. Transform your life with tiny changes that deliver remarkable results.',
  },
  {
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    genre: 'Thriller',
    mood_tags: ['suspenseful', 'dark', 'mysterious'],
    length: 325,
    description: "A woman shoots her husband and then never speaks another word. A criminal psychotherapist becomes obsessed with uncovering her motive.",
  },
  {
    title: 'Where the Crawdads Sing',
    author: 'Delia Owens',
    genre: 'Mystery',
    mood_tags: ['emotional', 'romantic', 'mysterious'],
    length: 384,
    description: 'A coming-of-age story about a young girl who raises herself in the marshes of North Carolina while becoming a suspect in a murder investigation.',
  },
  {
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    genre: 'Science Fiction',
    mood_tags: ['adventurous', 'thought-provoking', 'uplifting'],
    length: 496,
    description: 'A lone astronaut must save the earth from disaster in this propulsive, cinematic science thriller from the author of The Martian.',
  },
  {
    title: 'The Seven Husbands of Evelyn Hugo',
    author: 'Taylor Jenkins Reid',
    genre: 'Romance',
    mood_tags: ['emotional', 'romantic', 'thought-provoking'],
    length: 400,
    description: 'Aging Hollywood icon Evelyn Hugo finally tells the truth about her glamorous and scandalous life, revealing shocking secrets.',
  },
  {
    title: 'Educated',
    author: 'Tara Westover',
    genre: 'Biography',
    mood_tags: ['inspiring', 'thought-provoking', 'emotional'],
    length: 334,
    description: 'A memoir about a young woman who leaves her survivalist family and goes on to earn a PhD from Cambridge University.',
  },
  {
    title: 'The House in the Cerulean Sea',
    author: 'TJ Klune',
    genre: 'Fantasy',
    mood_tags: ['uplifting', 'lighthearted', 'emotional'],
    length: 394,
    description: 'A magical island, a dangerous task, a burning secret. A story about the profound experience of discovering an unlikely family.',
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genre: 'History',
    mood_tags: ['thought-provoking', 'inspiring'],
    length: 443,
    description: 'A brief history of humankind from the Stone Age to the modern age, exploring how Homo sapiens came to dominate the world.',
  },
  {
    title: 'The Thursday Murder Club',
    author: 'Richard Osman',
    genre: 'Mystery',
    mood_tags: ['lighthearted', 'mysterious', 'uplifting'],
    length: 368,
    description: 'Four unlikely friends meet weekly to investigate unsolved murders, but when a real killer strikes, the game is on.',
  },
];

async function seedDatabase() {
  console.log('Starting database seed...');

  try {
    const { data: existingBooks } = await supabase.from('books').select('title');
    const existingTitles = new Set(existingBooks?.map(b => b.title) || []);

    const booksToInsert = sampleBooks.filter(book => !existingTitles.has(book.title));

    if (booksToInsert.length === 0) {
      console.log('All sample books already exist in the database');
      return;
    }

    console.log(`Inserting ${booksToInsert.length} new books...`);
    const { data: books, error: booksError } = await supabase
      .from('books')
      .insert(booksToInsert)
      .select();

    if (booksError) {
      console.error('Error inserting books:', booksError);
      throw booksError;
    }

    console.log(`Successfully inserted ${books?.length || 0} books`);
    console.log('Database seed completed successfully!');

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();
