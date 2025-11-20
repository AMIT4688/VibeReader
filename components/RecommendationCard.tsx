'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Check, Star, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/db';
import { searchBooks } from '@/lib/google-books';
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      sessionStorage.setItem('pendingRecommendation', JSON.stringify(recommendation));
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      toast.error('Please sign up or log in to add books to your library!');
      window.location.href = '/#get-started';
      return;
    }

    setAdding(true);

    try {

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
        const genre = recommendation.analytics.themes[0] || 'General';
        const { data: newBook, error: bookError } = await (supabase as any)
          .from('books')
          .insert([{
            google_books_id: googleBooksId,
            title: recommendation.title,
            author: recommendation.author,
            genre: genre,
            mood_tags: recommendation.analytics.moods || [],
            length: recommendation.analytics.pageCount || 0,
            cover_url: coverUrl || '',
            description: recommendation.description || '',
          }])
          .select('id')
          .single();

        if (bookError) {
          console.error('Error inserting book:', bookError);
          throw bookError;
        }
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
        toast.success('Added to Want to Read! Refreshing...');
        setAdded(true);
        onAdded?.();

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Error adding book:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add book';
      toast.error(errorMessage);
    } finally {
      setAdding(false);
    }
  }

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 80) return 'from-blue-500 to-cyan-600';
    if (score >= 70) return 'from-purple-500 to-pink-600';
    return 'from-orange-500 to-amber-600';
  };

  return (
    <Card className="border-0 bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1">
      <div className={`h-2 bg-gradient-to-r ${getMatchColor(recommendation.matchScore)}`}></div>

      <CardContent className="p-6">
        <div className="flex gap-6 mb-6">
          {recommendation.coverUrl && (
            <div className="flex-shrink-0">
              <img
                src={recommendation.coverUrl}
                alt={recommendation.title}
                className="w-32 h-48 object-cover rounded-2xl shadow-lg border-4 border-gray-100"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-2xl font-black text-gray-800 leading-tight line-clamp-2">
                {recommendation.title}
              </h3>
              <div className={`flex-shrink-0 px-4 py-2 rounded-full bg-gradient-to-r ${getMatchColor(recommendation.matchScore)} text-white font-black text-lg shadow-lg`}>
                {recommendation.matchScore}%
              </div>
            </div>
            <p className="text-lg font-bold text-gray-600 mb-3">by {recommendation.author}</p>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(recommendation.matchScore / 20)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-600">Perfect Match!</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
            <p className="text-base text-gray-700 leading-relaxed">{recommendation.description}</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-800 mb-1">Why You'll Love This:</p>
                <p className="text-base text-gray-700">{recommendation.matchExplanation}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-gray-800 mb-3">Book Details:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-1.5 text-base font-bold">
                {recommendation.analytics.pacing} paced
              </Badge>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-1.5 text-base font-bold">
                {recommendation.analytics.pageCount} pages
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendation.analytics.moods.slice(0, 4).map((mood) => (
                <Badge
                  key={mood}
                  className="bg-yellow-100 text-yellow-800 border-2 border-yellow-300 px-3 py-1 text-sm font-bold"
                >
                  {mood}
                </Badge>
              ))}
            </div>
            {recommendation.analytics.themes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recommendation.analytics.themes.slice(0, 3).map((theme) => (
                  <Badge
                    key={theme}
                    className="bg-blue-100 text-blue-800 border-2 border-blue-300 px-3 py-1 text-sm font-bold"
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleAddToLibrary}
            disabled={adding || added}
            className={`w-full py-6 text-lg font-black rounded-2xl shadow-lg transition-all transform hover:scale-105 ${
              added
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700'
            }`}
          >
            {adding ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Adding to Your Library...
              </>
            ) : added ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Added to Your Library! 🎉
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Add This Book to My Library!
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
