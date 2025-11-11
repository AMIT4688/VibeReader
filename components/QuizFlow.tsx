'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
    <Card className="max-w-3xl mx-auto border-0 bg-white rounded-3xl shadow-sm">
      <CardContent className="p-8 md:p-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-[#86868B]">Question {step} of 5</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 w-12 rounded-full transition-all duration-300 ${
                    i <= step ? 'bg-[#0071E3]' : 'bg-[#E8E8ED]'
                  }`}
                />
              ))}
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-[#1D1D1F] mb-3">
            {step === 1 && 'What genres do you enjoy?'}
            {step === 2 && 'What mood are you looking for?'}
            {step === 3 && 'What pacing do you prefer?'}
            {step === 4 && 'How long should the book be?'}
            {step === 5 && 'What kind of story appeals to you?'}
          </h2>

          <p className="text-lg text-[#86868B]">
            {step === 1 && 'Select all genres that interest you'}
            {step === 2 && 'Adjust the sliders to match your preferred mood'}
            {step === 3 && 'Choose how fast you want the story to move'}
            {step === 4 && 'Select your preferred book length'}
            {step === 5 && 'Do you prefer character-driven or plot-driven stories?'}
          </p>
        </div>

        <div className="mb-8">
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {GENRES.map((genre) => (
                <label
                  key={genre}
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    preferences.genres?.includes(genre)
                      ? 'border-[#0071E3] bg-[#0071E3]/5'
                      : 'border-[#E8E8ED] hover:border-[#0071E3]/50'
                  }`}
                >
                  <Checkbox
                    id={genre}
                    checked={preferences.genres?.includes(genre)}
                    onCheckedChange={() => handleGenreToggle(genre)}
                    className="data-[state=checked]:bg-[#0071E3] data-[state=checked]:border-[#0071E3]"
                  />
                  <span className="font-medium text-[#1D1D1F]">{genre}</span>
                </label>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between text-base font-medium">
                  <span className="text-[#1D1D1F]">Happy</span>
                  <span className="text-[#0071E3]">{preferences.moodHappySad}</span>
                  <span className="text-[#1D1D1F]">Sad</span>
                </div>
                <Slider
                  value={[preferences.moodHappySad || 50]}
                  onValueChange={([value]) =>
                    setPreferences({ ...preferences, moodHappySad: value })
                  }
                  max={100}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-base font-medium">
                  <span className="text-[#1D1D1F]">Hopeful</span>
                  <span className="text-[#0071E3]">{preferences.moodHopefulBleak}</span>
                  <span className="text-[#1D1D1F]">Bleak</span>
                </div>
                <Slider
                  value={[preferences.moodHopefulBleak || 50]}
                  onValueChange={([value]) =>
                    setPreferences({ ...preferences, moodHopefulBleak: value })
                  }
                  max={100}
                  step={1}
                  className="py-2"
                />
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
                className={`flex items-start space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  preferences.pacing === 'slow'
                    ? 'border-[#0071E3] bg-[#0071E3]/5'
                    : 'border-[#E8E8ED] hover:border-[#0071E3]/50'
                }`}
              >
                <RadioGroupItem value="slow" id="slow" className="mt-1" />
                <div>
                  <div className="font-semibold text-lg text-[#1D1D1F] mb-1">Slow</div>
                  <div className="text-[#86868B]">
                    Detailed descriptions, character development
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  preferences.pacing === 'medium'
                    ? 'border-[#0071E3] bg-[#0071E3]/5'
                    : 'border-[#E8E8ED] hover:border-[#0071E3]/50'
                }`}
              >
                <RadioGroupItem value="medium" id="medium" className="mt-1" />
                <div>
                  <div className="font-semibold text-lg text-[#1D1D1F] mb-1">Medium</div>
                  <div className="text-[#86868B]">
                    Balanced between action and reflection
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  preferences.pacing === 'fast'
                    ? 'border-[#0071E3] bg-[#0071E3]/5'
                    : 'border-[#E8E8ED] hover:border-[#0071E3]/50'
                }`}
              >
                <RadioGroupItem value="fast" id="fast" className="mt-1" />
                <div>
                  <div className="font-semibold text-lg text-[#1D1D1F] mb-1">Fast</div>
                  <div className="text-[#86868B]">
                    Action-packed, page-turner
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
                className={`flex items-start space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  preferences.length === 'short'
                    ? 'border-[#0071E3] bg-[#0071E3]/5'
                    : 'border-[#E8E8ED] hover:border-[#0071E3]/50'
                }`}
              >
                <RadioGroupItem value="short" id="short" className="mt-1" />
                <div>
                  <div className="font-semibold text-lg text-[#1D1D1F] mb-1">Short</div>
                  <div className="text-[#86868B]">Under 250 pages</div>
                </div>
              </label>

              <label
                className={`flex items-start space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  preferences.length === 'medium'
                    ? 'border-[#0071E3] bg-[#0071E3]/5'
                    : 'border-[#E8E8ED] hover:border-[#0071E3]/50'
                }`}
              >
                <RadioGroupItem value="medium" id="medium-length" className="mt-1" />
                <div>
                  <div className="font-semibold text-lg text-[#1D1D1F] mb-1">Medium</div>
                  <div className="text-[#86868B]">250-400 pages</div>
                </div>
              </label>

              <label
                className={`flex items-start space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  preferences.length === 'long'
                    ? 'border-[#0071E3] bg-[#0071E3]/5'
                    : 'border-[#E8E8ED] hover:border-[#0071E3]/50'
                }`}
              >
                <RadioGroupItem value="long" id="long" className="mt-1" />
                <div>
                  <div className="font-semibold text-lg text-[#1D1D1F] mb-1">Long</div>
                  <div className="text-[#86868B]">Over 400 pages</div>
                </div>
              </label>
            </RadioGroup>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-base font-medium">
                  <span className="text-[#1D1D1F]">Character-Driven</span>
                  <span className="text-[#0071E3]">{preferences.focus}</span>
                  <span className="text-[#1D1D1F]">Plot-Driven</span>
                </div>
                <Slider
                  value={[preferences.focus || 50]}
                  onValueChange={([value]) =>
                    setPreferences({ ...preferences, focus: value })
                  }
                  max={100}
                  step={1}
                  className="py-2"
                />
              </div>
              <div className="p-4 bg-[#F5F5F7] rounded-xl">
                <p className="text-sm text-[#86868B]">
                  Character-driven stories focus on internal growth and relationships. Plot-driven
                  stories emphasize external action and events.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="border-[#E8E8ED] text-[#1D1D1F] hover:bg-[#F5F5F7] px-6 py-6 text-base rounded-xl"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-6 text-base rounded-xl transition-all hover:scale-105"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Getting Recommendations...
              </>
            ) : step === 5 ? (
              'Get Recommendations'
            ) : (
              <>
                Next
                <ChevronRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
