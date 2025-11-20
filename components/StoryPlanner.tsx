'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Save, Sparkles, BookOpen, Lightbulb, MapPin } from 'lucide-react';
import { getPlotArchitectSuggestions, type PlotSuggestion, type SettingSuggestion } from '@/lib/skywork-ai';

interface Story {
  id: string;
  title: string;
  outline: string;
  mood: string;
  pacing: string;
  genre: string;
  setting: string;
  ai_plot_suggestions: {
    chapters?: PlotSuggestion[];
    plotTwists?: string[];
    settings?: SettingSuggestion[];
  };
}

export function StoryPlanner() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    outline: '',
    mood: '',
    pacing: '',
    genre: '',
    setting: '',
  });

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to manage stories');
        return;
      }

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveStory() {
    if (!formData.title.trim()) {
      toast.error('Please enter a story title');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (selectedStory) {
        const { error } = await supabase
          .from('stories')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedStory.id);

        if (error) throw error;
        toast.success('Story updated successfully!');
      } else {
        const { error } = await supabase
          .from('stories')
          .insert({
            ...formData,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success('Story created successfully!');
      }

      resetForm();
      await loadStories();
    } catch (error) {
      console.error('Error saving story:', error);
      toast.error('Failed to save story');
    } finally {
      setSaving(false);
    }
  }

  async function handleGetPlotSuggestions() {
    if (!formData.title.trim()) {
      toast.error('Please enter story details first');
      return;
    }

    setGeneratingAI(selectedStory?.id || 'new');

    try {
      const suggestions = await getPlotArchitectSuggestions(
        formData.title,
        formData.outline,
        formData.mood,
        formData.pacing,
        formData.genre,
        formData.setting
      );

      if (selectedStory) {
        const { error } = await supabase
          .from('stories')
          .update({
            ai_plot_suggestions: suggestions,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedStory.id);

        if (error) throw error;
      }

      setSelectedStory(prev => prev ? { ...prev, ai_plot_suggestions: suggestions } : null);
      toast.success('Plot suggestions generated!');
    } catch (error) {
      console.error('Error generating plot suggestions:', error);
      toast.error('Failed to generate plot suggestions. Check your API key.');
    } finally {
      setGeneratingAI(null);
    }
  }

  async function handleDeleteStory(id: string) {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Story deleted');
      if (selectedStory?.id === id) {
        resetForm();
      }
      await loadStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Failed to delete story');
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      outline: '',
      mood: '',
      pacing: '',
      genre: '',
      setting: '',
    });
    setSelectedStory(null);
  }

  function selectStory(story: Story) {
    setSelectedStory(story);
    setFormData({
      title: story.title,
      outline: story.outline,
      mood: story.mood,
      pacing: story.pacing,
      genre: story.genre,
      setting: story.setting,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Your Stories</h3>
            <Button
              size="sm"
              onClick={resetForm}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>

          {stories.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No stories yet. Start planning your first story!
            </p>
          ) : (
            <div className="space-y-2">
              {stories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => selectStory(story)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedStory?.id === story.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-gray-900">{story.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(story.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {story.genre && (
                    <p className="text-xs text-gray-600 mt-1">
                      {story.genre}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {selectedStory ? 'Edit Story' : 'Plan New Story'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Story Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter your story title"
                className="border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Story Outline
              </label>
              <Textarea
                value={formData.outline}
                onChange={(e) => setFormData({ ...formData, outline: e.target.value })}
                placeholder="Describe the main plot, themes, and key story beats..."
                rows={4}
                className="border-2"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Genre
                </label>
                <Input
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  placeholder="e.g., Fantasy, Thriller, Romance"
                  className="border-2"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mood/Tone
                </label>
                <Input
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  placeholder="e.g., Dark, Hopeful, Suspenseful"
                  className="border-2"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Pacing
                </label>
                <Input
                  value={formData.pacing}
                  onChange={(e) => setFormData({ ...formData, pacing: e.target.value })}
                  placeholder="e.g., Fast, Moderate, Slow"
                  className="border-2"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Setting
                </label>
                <Input
                  value={formData.setting}
                  onChange={(e) => setFormData({ ...formData, setting: e.target.value })}
                  placeholder="e.g., Victorian London, Space Station"
                  className="border-2"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveStory}
                disabled={saving || !formData.title.trim()}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Story
                  </>
                )}
              </Button>

              <Button
                onClick={handleGetPlotSuggestions}
                disabled={generatingAI !== null || !formData.title.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {generatingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Plot Ideas
                  </>
                )}
              </Button>
            </div>

            {selectedStory?.ai_plot_suggestions && (
              <div className="mt-6 space-y-4">
                {selectedStory.ai_plot_suggestions.chapters && selectedStory.ai_plot_suggestions.chapters.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Chapter Ideas
                    </h4>
                    <div className="space-y-3">
                      {selectedStory.ai_plot_suggestions.chapters.map((chapter, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg">
                          <h5 className="font-bold text-sm text-blue-700 mb-1">
                            Chapter {chapter.chapterNumber}: {chapter.title}
                          </h5>
                          <p className="text-sm text-gray-700 mb-2">{chapter.description}</p>
                          {chapter.keyEvents && chapter.keyEvents.length > 0 && (
                            <ul className="space-y-1">
                              {chapter.keyEvents.map((event, i) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                  <span className="text-blue-600 mt-0.5">•</span>
                                  <span>{event}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStory.ai_plot_suggestions.plotTwists && selectedStory.ai_plot_suggestions.plotTwists.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-purple-600" />
                      Plot Twists
                    </h4>
                    <ul className="space-y-2">
                      {selectedStory.ai_plot_suggestions.plotTwists.map((twist, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2 bg-white p-3 rounded-lg">
                          <span className="text-purple-600 font-bold">{index + 1}.</span>
                          <span>{twist}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedStory.ai_plot_suggestions.settings && selectedStory.ai_plot_suggestions.settings.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Setting Details
                    </h4>
                    <div className="space-y-3">
                      {selectedStory.ai_plot_suggestions.settings.map((setting, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg">
                          <h5 className="font-bold text-sm text-green-700 mb-2">
                            {setting.aspect}
                          </h5>
                          <ul className="space-y-1">
                            {setting.details.map((detail, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">•</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
