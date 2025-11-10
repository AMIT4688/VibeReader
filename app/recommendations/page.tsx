'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { QuizFlow } from '@/components/QuizFlow';
import { RecommendationCard } from '@/components/RecommendationCard';
import { getAIRecommendations, type QuizPreferences, type AIBookRecommendation } from '@/lib/claude-ai';

export default function RecommendationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [gettingRecommendations, setGettingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<AIBookRecommendation[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    setLoading(false);
  }

  async function handleQuizComplete(preferences: QuizPreferences) {
    setGettingRecommendations(true);

    try {
      const results = await getAIRecommendations(preferences);
      setRecommendations(results);
      setShowQuiz(false);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setGettingRecommendations(false);
    }
  }

  function handleStartOver() {
    setRecommendations([]);
    setShowQuiz(true);
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showQuiz || (recommendations.length === 0 && !showQuiz)) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        {!showQuiz ? (
          <>
            <div className="text-center space-y-4">
              <Sparkles className="h-16 w-16 text-accent mx-auto" />
              <h1 className="text-4xl font-bold text-primary">AI Recommendations</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Answer a few questions about your reading preferences to get personalized book recommendations
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Button size="lg" className="w-full" onClick={() => setShowQuiz(true)}>
                Take the Quiz
              </Button>
            </div>
          </>
        ) : (
          <QuizFlow onComplete={handleQuizComplete} loading={gettingRecommendations} />
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary">Your Personalized Recommendations</h1>
          <p className="text-muted-foreground mt-2">
            Based on your reading preferences, here are {recommendations.length} books we think you'll love
          </p>
        </div>
        <Button variant="outline" onClick={handleStartOver}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Retake Quiz
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {recommendations.map((recommendation, index) => (
          <RecommendationCard
            key={`${recommendation.title}-${index}`}
            recommendation={recommendation}
          />
        ))}
      </div>
    </div>
  );
}
