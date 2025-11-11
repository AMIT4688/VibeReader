'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RotateCcw, Zap } from 'lucide-react';
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
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-[#0071E3]" />
        </div>
      </div>
    );
  }

  if (showQuiz || (recommendations.length === 0 && !showQuiz)) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-16">
          <div className="max-w-[1200px] mx-auto px-6 py-16">
            {!showQuiz ? (
              <div className="max-w-4xl mx-auto text-center space-y-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#0071E3] to-[#00C7BE] mb-6">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#1D1D1F]">
                    Discover your
                    <br />
                    perfect read
                  </h1>
                  <p className="text-xl text-[#86868B] max-w-2xl mx-auto leading-relaxed">
                    Answer a few questions about your reading preferences to get personalized book recommendations powered by AI.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto py-8">
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0071E3]/10">
                      <Sparkles className="h-6 w-6 text-[#0071E3]" />
                    </div>
                    <h3 className="font-semibold text-[#1D1D1F]">AI-Powered</h3>
                    <p className="text-sm text-[#86868B]">Smart recommendations based on your unique taste</p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#34C759]/10">
                      <Zap className="h-6 w-6 text-[#34C759]" />
                    </div>
                    <h3 className="font-semibold text-[#1D1D1F]">Instant Results</h3>
                    <p className="text-sm text-[#86868B]">Get 5 personalized picks in seconds</p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#5856D6]/10">
                      <RotateCcw className="h-6 w-6 text-[#5856D6]" />
                    </div>
                    <h3 className="font-semibold text-[#1D1D1F]">Always Fresh</h3>
                    <p className="text-sm text-[#86868B]">Retake anytime for new suggestions</p>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={() => setShowQuiz(true)}
                  className="bg-[#0071E3] hover:bg-[#0077ED] text-white px-8 py-6 text-lg rounded-xl transition-all hover:scale-105"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start the quiz
                </Button>
              </div>
            ) : (
              <QuizFlow onComplete={handleQuizComplete} loading={gettingRecommendations} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-16">
        <div className="max-w-[1400px] mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#1D1D1F] mb-3">
                Your picks
              </h1>
              <p className="text-lg text-[#86868B]">
                {recommendations.length} books curated just for you
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleStartOver}
              className="border-[#0071E3] text-[#0071E3] hover:bg-[#0071E3]/5 px-6 py-6 text-base rounded-xl transition-all hover:scale-105"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Retake quiz
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={`${recommendation.title}-${index}`}
                recommendation={recommendation}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
