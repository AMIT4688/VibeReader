'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Step {step} of 5</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full ${
                  i <= step ? 'bg-accent' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
        <CardTitle>
          {step === 1 && 'What genres do you enjoy?'}
          {step === 2 && 'What mood are you looking for?'}
          {step === 3 && 'What pacing do you prefer?'}
          {step === 4 && 'How long should the book be?'}
          {step === 5 && 'What kind of story appeals to you?'}
        </CardTitle>
        <CardDescription>
          {step === 1 && 'Select all genres that interest you'}
          {step === 2 && 'Adjust the sliders to match your preferred mood'}
          {step === 3 && 'Choose how fast you want the story to move'}
          {step === 4 && 'Select your preferred book length'}
          {step === 5 && 'Do you prefer character-driven or plot-driven stories?'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {GENRES.map((genre) => (
              <div key={genre} className="flex items-center space-x-2">
                <Checkbox
                  id={genre}
                  checked={preferences.genres?.includes(genre)}
                  onCheckedChange={() => handleGenreToggle(genre)}
                />
                <Label htmlFor={genre} className="cursor-pointer">
                  {genre}
                </Label>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Happy</span>
                <span className="font-medium">{preferences.moodHappySad}</span>
                <span>Sad</span>
              </div>
              <Slider
                value={[preferences.moodHappySad || 50]}
                onValueChange={([value]) =>
                  setPreferences({ ...preferences, moodHappySad: value })
                }
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Hopeful</span>
                <span className="font-medium">{preferences.moodHopefulBleak}</span>
                <span>Bleak</span>
              </div>
              <Slider
                value={[preferences.moodHopefulBleak || 50]}
                onValueChange={([value]) =>
                  setPreferences({ ...preferences, moodHopefulBleak: value })
                }
                max={100}
                step={1}
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
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="slow" id="slow" />
              <Label htmlFor="slow" className="cursor-pointer">
                <div className="font-medium">Slow</div>
                <div className="text-sm text-muted-foreground">
                  Detailed descriptions, character development
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="cursor-pointer">
                <div className="font-medium">Medium</div>
                <div className="text-sm text-muted-foreground">
                  Balanced between action and reflection
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fast" id="fast" />
              <Label htmlFor="fast" className="cursor-pointer">
                <div className="font-medium">Fast</div>
                <div className="text-sm text-muted-foreground">
                  Action-packed, page-turner
                </div>
              </Label>
            </div>
          </RadioGroup>
        )}

        {step === 4 && (
          <RadioGroup
            value={preferences.length}
            onValueChange={(value) =>
              setPreferences({ ...preferences, length: value as any })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="short" id="short" />
              <Label htmlFor="short" className="cursor-pointer">
                <div className="font-medium">Short</div>
                <div className="text-sm text-muted-foreground">Under 250 pages</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium-length" />
              <Label htmlFor="medium-length" className="cursor-pointer">
                <div className="font-medium">Medium</div>
                <div className="text-sm text-muted-foreground">250-400 pages</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="long" id="long" />
              <Label htmlFor="long" className="cursor-pointer">
                <div className="font-medium">Long</div>
                <div className="text-sm text-muted-foreground">Over 400 pages</div>
              </Label>
            </div>
          </RadioGroup>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Character-Driven</span>
                <span className="font-medium">{preferences.focus}</span>
                <span>Plot-Driven</span>
              </div>
              <Slider
                value={[preferences.focus || 50]}
                onValueChange={([value]) =>
                  setPreferences({ ...preferences, focus: value })
                }
                max={100}
                step={1}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Character-driven stories focus on internal growth and relationships. Plot-driven
              stories emphasize external action and events.
            </p>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button onClick={handleNext} disabled={!canProceed() || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Recommendations...
              </>
            ) : step === 5 ? (
              'Get Recommendations'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
