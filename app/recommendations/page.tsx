'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RotateCcw, Zap, BookOpen, Star, Heart, Rocket, Target } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (showQuiz || (recommendations.length === 0 && !showQuiz)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Navigation />
        <div className="pt-16">
          <div className="max-w-[1200px] mx-auto px-6 py-16">
            {!showQuiz ? (
              <div className="max-w-5xl mx-auto text-center space-y-12">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 shadow-2xl">
                      <Sparkles className="h-14 w-14 text-white animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h1 className="text-6xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                      Find Your Next
                      <br />
                      Amazing Book!
                    </h1>
                    <p className="text-2xl md:text-3xl font-bold text-gray-700">
                      Take our fun quiz and discover books you'll love!
                    </p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 max-w-3xl mx-auto shadow-xl border-4 border-purple-200">
                    <div className="flex items-start gap-4 text-left">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Why VibeReader is Amazing:</h3>
                        <ul className="space-y-2 text-gray-700 text-lg">
                          <li className="flex items-start gap-2">
                            <span className="text-2xl">📚</span>
                            <span><strong>All in One Place:</strong> No more searching everywhere for good books!</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-2xl">✨</span>
                            <span><strong>Just for You:</strong> Get books picked specially for what YOU like</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-2xl">⚡</span>
                            <span><strong>Save Time:</strong> Spend less time scrolling, more time reading adventures!</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-2xl">🎯</span>
                            <span><strong>Easy to Use:</strong> Find, save, and read books super easily</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                  <div className="bg-white rounded-3xl p-8 shadow-lg border-4 border-purple-200 hover:scale-105 transition-transform">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 mb-4 shadow-lg">
                      <Rocket className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-black text-2xl text-gray-800 mb-2">Super Fast!</h3>
                    <p className="text-lg text-gray-600">Get 5 perfect book picks in just 2 minutes!</p>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-lg border-4 border-pink-200 hover:scale-105 transition-transform">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 mb-4 shadow-lg">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-black text-2xl text-gray-800 mb-2">Made for You!</h3>
                    <p className="text-lg text-gray-600">AI picks books that match YOUR interests!</p>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-lg border-4 border-blue-200 hover:scale-105 transition-transform">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4 shadow-lg">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-black text-2xl text-gray-800 mb-2">Always New!</h3>
                    <p className="text-lg text-gray-600">Take the quiz anytime to find new favorites!</p>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={() => setShowQuiz(true)}
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-12 py-8 text-2xl font-black rounded-full shadow-2xl transition-all hover:scale-110 border-4 border-white"
                >
                  <Sparkles className="h-8 w-8 mr-3 animate-pulse" />
                  Start the Fun Quiz!
                </Button>

                <div className="flex items-center justify-center gap-3 pt-4">
                  <Zap className="h-6 w-6 text-yellow-500 animate-bounce" />
                  <p className="text-lg font-bold text-gray-700">Only takes 2 minutes!</p>
                  <Zap className="h-6 w-6 text-yellow-500 animate-bounce delay-150" />
                </div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navigation />
      <div className="pt-16">
        <div className="max-w-[1400px] mx-auto px-6 py-16">
          <div className="text-center mb-12 space-y-6 animate-in fade-in slide-in-from-top duration-1000">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl">
              <BookOpen className="h-10 w-10 text-white" />
            </div>

            <div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Your Perfect Books Are Here!
              </h1>
              <p className="text-2xl font-bold text-gray-700">
                We found {recommendations.length} amazing books just for you! 🎉
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto shadow-lg border-4 border-yellow-200">
              <p className="text-lg text-gray-700 font-semibold">
                💡 <strong>Tip:</strong> Click on any book to add it to your library and start reading instantly!
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleStartOver}
              className="border-4 border-purple-300 text-purple-700 hover:bg-purple-100 bg-white px-8 py-6 text-lg font-bold rounded-full shadow-lg transition-all hover:scale-105"
            >
              <RotateCcw className="h-6 w-6 mr-3" />
              Try Quiz Again for New Books!
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
            {recommendations.map((recommendation, index) => (
              <div
                key={`${recommendation.title}-${index}`}
                className="animate-in fade-in slide-in-from-bottom duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <RecommendationCard recommendation={recommendation} />
              </div>
            ))}
          </div>

          <div className="mt-16 text-center space-y-6">
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl p-1 max-w-3xl mx-auto shadow-2xl">
              <div className="bg-white rounded-3xl p-8">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                  <h3 className="text-3xl font-black text-gray-800">Love These Books?</h3>
                  <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-xl text-gray-700 mb-6">
                  Add them to your library and start your reading adventure today!
                </p>
                <Button
                  onClick={() => router.push('/library')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-6 text-xl font-black rounded-full shadow-xl transition-all hover:scale-105"
                >
                  <BookOpen className="h-6 w-6 mr-3" />
                  Go to My Library
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={handleStartOver}
              className="text-gray-600 hover:text-gray-800 text-lg font-semibold"
            >
              Want different books? Take the quiz again! 🔄
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
