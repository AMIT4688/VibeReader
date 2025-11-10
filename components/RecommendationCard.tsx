'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Check } from 'lucide-react';
import { supabase } from '@/lib/db';
import { searchBooks, formatGoogleBook } from '@/lib/google-books';
import type { AIBookRecommendation } from '@/lib/claude-ai';
import { toast } from 'sonner';

interface RecommendationCardProps {
  recommendation: AIBookRecommendation;
  onAdded?: () => void;
}

export function RecommendationCard({ recommendation, onAdded }: RecommendationCardProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAddToLibrary() {
    setAdding(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let bookId: string;
      let googleBooksId: string | null = null;
      let coverUrl: string | null = null;

      try {
        const searchResults = await searchBooks(`${recommendation.title} ${recommendation.author}`);

        if (searchResults.length > 0) {
          const googleBook = searchResults[0];
          googleBooksId = googleBook.id;
          coverUrl = googleBook.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null;
        } else {
          console.log('No Google Books results found, adding book without cover');
        }
      } catch (searchError) {
        console.error('Google Books search failed:', searchError);
      }

      const { data: existingBook } = await (supabase as any)
        .from('books')
        .select('id')
        .eq('title', recommendation.title)
        .eq('author', recommendation.author)
        .maybeSingle();

      if (existingBook) {
        bookId = existingBook.id;
      } else {
        const { data: newBook, error: bookError } = await (supabase as any)
          .from('books')
          .insert([{
            google_books_id: googleBooksId,
            title: recommendation.title,
            author: recommendation.author,
            cover_url: coverUrl,
            description: recommendation.description,
            page_count: recommendation.analytics.pageCount || 0,
          }])
          .select('id')
          .single();

        if (bookError) throw bookError;
        bookId = newBook.id;
      }

      const { data: existingUserBook } = await (supabase as any)
        .from('user_books')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();

      if (existingUserBook) {
        toast.info('Book already in your library');
        setAdded(true);
      } else {
        const { error: userBookError } = await (supabase as any)
          .from('user_books')
          .insert([{
            user_id: user.id,
            book_id: bookId,
            status: 'want_to_read',
            ai_analytics: recommendation.analytics,
          }]);

        if (userBookError) throw userBookError;
        toast.success('Added to Want to Read!');
        setAdded(true);
        onAdded?.();
      }
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('Failed to add book');
    } finally {
      setAdding(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{recommendation.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{recommendation.author}</p>
          </div>
          <Badge variant="secondary" className="text-accent font-semibold text-base shrink-0">
            {recommendation.matchScore}% Match
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{recommendation.description}</p>

        <div className="space-y-2">
          <p className="text-sm font-medium">Why this matches:</p>
          <p className="text-sm text-muted-foreground italic">{recommendation.matchExplanation}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Book Vibe:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{recommendation.analytics.pacing} paced</Badge>
            <Badge variant="outline">{recommendation.analytics.pageCount} pages</Badge>
            {recommendation.analytics.moods.slice(0, 3).map((mood) => (
              <Badge key={mood} variant="secondary">
                {mood}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {recommendation.analytics.themes.slice(0, 3).map((theme) => (
              <Badge key={theme} variant="outline" className="text-xs">
                {theme}
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={handleAddToLibrary}
          disabled={adding || added}
          className="w-full"
          variant={added ? 'secondary' : 'default'}
        >
          {adding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : added ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Added to Library
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add to Want to Read
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
