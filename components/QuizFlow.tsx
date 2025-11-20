'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight, Loader2, Star, Smile, Frown, Zap, BookOpen } from 'lucide-react';
import type { QuizPreferences } from '@/lib/claude-ai';

interface QuizFlowProps {
  onComplete: (preferences: QuizPreferences) => void;
  loading?: boolean;
}

const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Thriller',
  'Romance',
  'Science Fiction',
  'Fantasy',
  'Biography',
  'History',
  'Self-Help',
  'Literary Fiction',
  'Horror',
];

const GENRE_EMOJIS: Record<string, string> = {
  'Fiction': '📖',
  'Non-Fiction': '📚',
  'Mystery': '🔍',
  'Thriller': '😱',
  'Romance': '💕',
  'Science Fiction': '🚀',
  'Fantasy': '🧙',
  'Biography': '👤',
  'History': '🏛️',
  'Self-Help': '💪',
  'Literary Fiction': '✨',
  'Horror': '👻',
};

export function QuizFlow({ onComplete, loading = false }: QuizFlowProps) {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<Partial<QuizPreferences>>({
    genres: [],
    moodHappySad: 50,
    moodHopefulBleak: 50,
    pacing: 'medium',
    length: 'medium',
    focus: 50,
  });

  function handleGenreToggle(genre: string) {
    const current = preferences.genres || [];
    const updated = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    setPreferences({ ...preferences, genres: updated });
  }

  function handleNext() {
    if (step < 5) {
      setStep(step + 1);
    } else {
      onComplete(preferences as QuizPreferences);
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  function canProceed() {
    if (step === 1) return (preferences.genres?.length || 0) > 0;
    return true;
  }

  return (
    <Card className="max-w-4xl mx-auto border-0 bg-white rounded-3xl shadow-2xl">
      <CardContent className="p-8 md:p-12">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                {step}
              </div>
              <span className="text-lg font-bold text-gray-700">Question {step} of 5</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full transition-all duration-300 ${
                    i <= step
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 scale-125'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 leading-tight">
              {step === 1 && '📚 What kinds of books do you like?'}
              {step === 2 && '😊 How do you want to feel?'}
              {step === 3 && '⚡ How fast should the story move?'}
              {step === 4 && '📏 How long should the book be?'}
              {step === 5 && '🎭 What kind of story do you like?'}
            </h2>

            <p className="text-xl text-gray-600 font-semibold">
              {step === 1 && 'Pick all the types you enjoy reading!'}
              {step === 2 && 'Move the sliders to show what mood you want'}
              {step === 3 && 'Choose your perfect reading speed'}
              {step === 4 && 'Pick your favorite book size'}
              {step === 5 && 'Do you like books about people or action?'}
            </p>
          </div>
        </div>

        <div className="mb-10">
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {GENRES.map((genre) => (
                <label
                  key={genre}
                  className={`flex items-center gap-3 p-5 rounded-2xl border-4 cursor-pointer transition-all transform hover:scale-105 ${
                    preferences.genres?.includes(genre)
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <Checkbox
                      id={genre}
                      checked={preferences.genres?.includes(genre)}
                      onCheckedChange={() => handleGenreToggle(genre)}
                      className="w-6 h-6 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{GENRE_EMOJIS[genre]}</span>
                    <span className="font-bold text-gray-800">{genre}</span>
                  </div>
                </label>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-50 to-blue-50 rounded-2xl p-6 border-4 border-yellow-200">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <Smile className="h-8 w-8 text-yellow-500" />
                      <span className="text-xl font-bold text-gray-800">Happy</span>
                    </div>
                    <div className="text-3xl font-black text-purple-600">{preferences.moodHappySad}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-gray-800">Sad</span>
                      <Frown className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  <Slider
                    value={[preferences.moodHappySad || 50]}
                    onValueChange={([value]) =>
                      setPreferences({ ...preferences, moodHappySad: value })
                    }
                    max={100}
                    step={1}
                    className="py-3"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-purple-50 rounded-2xl p-6 border-4 border-green-200">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <Star className="h-8 w-8 text-green-500 fill-green-500" />
                      <span className="text-xl font-bold text-gray-800">Hopeful</span>
                    </div>
                    <div className="text-3xl font-black text-purple-600">{preferences.moodHopefulBleak}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-gray-800">Dark</span>
                      <Star className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                  <Slider
                    value={[preferences.moodHopefulBleak || 50]}
                    onValueChange={([value]) =>
                      setPreferences({ ...preferences, moodHopefulBleak: value })
                    }
                    max={100}
                    step={1}
                    className="py-3"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <RadioGroup
              value={preferences.pacing}
              onValueChange={(value) =>
                setPreferences({ ...preferences, pacing: value as any })
              }
              className="space-y-4"
            >
              <label
                className={`flex items-start gap-4 p-6 rounded-2xl border-4 cursor-pointer transition-all transform hover:scale-105 ${
                  preferences.pacing === 'slow'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <RadioGroupItem value="slow" id="slow" className="mt-1 w-6 h-6" />
                <div>
                  <div className="font-black text-2xl text-gray-800 mb-2 flex items-center gap-2">
                    🐢 Slow & Steady
                  </div>
                  <div className="text-lg text-gray-600">
                    Lots of details and getting to know characters really well
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-6 rounded-2xl border-4 cursor-pointer transition-all transform hover:scale-105 ${
                  preferences.pacing === 'medium'
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg'
                    : 'border-gray-200 hover:border-green-300 bg-white'
                }`}
              >
                <RadioGroupItem value="medium" id="medium" className="mt-1 w-6 h-6" />
                <div>
                  <div className="font-black text-2xl text-gray-800 mb-2 flex items-center gap-2">
                    🚶 Just Right
                  </div>
                  <div className="text-lg text-gray-600">
                    A good mix of action and character moments
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-6 rounded-2xl border-4 cursor-pointer transition-all transform hover:scale-105 ${
                  preferences.pacing === 'fast'
                    ? 'border-red-500 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg'
                    : 'border-gray-200 hover:border-red-300 bg-white'
                }`}
              >
                <RadioGroupItem value="fast" id="fast" className="mt-1 w-6 h-6" />
                <div>
                  <div className="font-black text-2xl text-gray-800 mb-2 flex items-center gap-2">
                    🚀 Super Fast!
                  </div>
                  <div className="text-lg text-gray-600">
                    Lots of action and excitement on every page!
                  </div>
                </div>
              </label>
            </RadioGroup>
          )}

          {step === 4 && (
            <RadioGroup
              value={preferences.length}
              onValueChange={(value) =>
                setPreferences({ ...preferences, length: value as any })
              }
              className="space-y-4"
            >
              <label
                className={`flex items-start gap-4 p-6 rounded-2xl border-4 cursor-pointer transition-all transform hover:scale-105 ${
                  preferences.length === 'short'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300 bg-white'
                }`}
              >
                <RadioGroupItem value="short" id="short" className="mt-1 w-6 h-6" />
                <div>
                  <div className="font-black text-2xl text-gray-800 mb-2 flex items-center gap-2">
                    📕 Quick Read
                  </div>
                  <div className="text-lg text-gray-600">Under 250 pages - finish it fast!</div>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-6 rounded-2xl border-4 cursor-pointer transition-all transform hover:scale-105 ${
                  preferences.length === 'medium'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <RadioGroupItem value="medium" id="medium-length" className="mt-1 w-6 h-6" />
                <div>
                  <div className="font-black text-2xl text-gray-800 mb-2 flex items-center gap-2">
                    📗 Medium Size
                  </div>
                  <div className="text-lg text-gray-600">250-400 pages - just right!</div>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-6 rounded-2xl border-4 cursor-pointer transition-all transform hover:scale-105 ${
                  preferences.length === 'long'
                    ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg'
                    : 'border-gray-200 hover:border-orange-300 bg-white'
                }`}
              >
                <RadioGroupItem value="long" id="long" className="mt-1 w-6 h-6" />
                <div>
                  <div className="font-black text-2xl text-gray-800 mb-2 flex items-center gap-2">
                    📘 Big Adventure
                  </div>
                  <div className="text-lg text-gray-600">Over 400 pages - dive deep into the story!</div>
                </div>
              </label>
            </RadioGroup>
          )}

          {step === 5 && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border-4 border-indigo-200">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">👥</span>
                    <span className="text-xl font-bold text-gray-800">About People</span>
                  </div>
                  <div className="text-4xl font-black text-purple-600">{preferences.focus}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-800">Lots of Action</span>
                    <span className="text-3xl">💥</span>
                  </div>
                </div>
                <Slider
                  value={[preferences.focus || 50]}
                  onValueChange={([value]) =>
                    setPreferences({ ...preferences, focus: value })
                  }
                  max={100}
                  step={1}
                  className="py-3"
                />
              </div>
              <div className="bg-white rounded-2xl p-6 border-4 border-yellow-200 shadow-lg">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-lg text-gray-700 font-semibold">
                    <strong>People-focused books</strong> are about feelings, friendships, and growing up.
                    <br />
                    <strong>Action-focused books</strong> have lots of exciting events and adventures!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-8 border-t-4 border-gray-100">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="border-4 border-gray-300 text-gray-700 hover:bg-gray-100 bg-white px-8 py-6 text-lg font-bold rounded-full shadow-lg disabled:opacity-50"
          >
            <ChevronLeft className="h-6 w-6 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white px-8 py-6 text-lg font-black rounded-full shadow-2xl transition-all hover:scale-105 disabled:opacity-50 border-4 border-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                Finding Your Books...
              </>
            ) : step === 5 ? (
              <>
                <Zap className="h-6 w-6 mr-2" />
                Show Me Books!
              </>
            ) : (
              <>
                Next Question
                <ChevronRight className="h-6 w-6 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
