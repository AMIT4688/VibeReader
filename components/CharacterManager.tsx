'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Save, Sparkles, User } from 'lucide-react';
import { getCharacterDevelopmentSuggestions, type CharacterSuggestion } from '@/lib/skywork-ai';

interface Character {
  id: string;
  name: string;
  description: string;
  motivations: string;
  relationships: string;
  backstory: string;
  ai_suggestions: CharacterSuggestion[];
}

export function CharacterManager() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    motivations: '',
    relationships: '',
    backstory: '',
  });

  useEffect(() => {
    loadCharacters();
  }, []);

  async function loadCharacters() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to manage characters');
        return;
      }

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCharacters(data || []);
    } catch (error) {
      console.error('Error loading characters:', error);
      toast.error('Failed to load characters');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCharacter() {
    if (!formData.name.trim()) {
      toast.error('Please enter a character name');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (selectedCharacter) {
        const { error } = await supabase
          .from('characters')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedCharacter.id);

        if (error) throw error;
        toast.success('Character updated successfully!');
      } else {
        const { error } = await supabase
          .from('characters')
          .insert({
            ...formData,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success('Character created successfully!');
      }

      resetForm();
      await loadCharacters();
    } catch (error) {
      console.error('Error saving character:', error);
      toast.error('Failed to save character');
    } finally {
      setSaving(false);
    }
  }

  async function handleGetAISuggestions() {
    if (!formData.name.trim()) {
      toast.error('Please enter character details first');
      return;
    }

    setGeneratingAI(selectedCharacter?.id || 'new');

    try {
      const suggestions = await getCharacterDevelopmentSuggestions(
        formData.name,
        formData.description,
        formData.motivations,
        formData.relationships,
        formData.backstory
      );

      if (selectedCharacter) {
        const { error } = await supabase
          .from('characters')
          .update({
            ai_suggestions: suggestions,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedCharacter.id);

        if (error) throw error;
      }

      setSelectedCharacter(prev => prev ? { ...prev, ai_suggestions: suggestions } : null);
      toast.success('AI suggestions generated!');
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      toast.error('Failed to generate AI suggestions. Check your API key.');
    } finally {
      setGeneratingAI(null);
    }
  }

  async function handleDeleteCharacter(id: string) {
    if (!confirm('Are you sure you want to delete this character?')) return;

    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Character deleted');
      if (selectedCharacter?.id === id) {
        resetForm();
      }
      await loadCharacters();
    } catch (error) {
      console.error('Error deleting character:', error);
      toast.error('Failed to delete character');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      motivations: '',
      relationships: '',
      backstory: '',
    });
    setSelectedCharacter(null);
  }

  function selectCharacter(character: Character) {
    setSelectedCharacter(character);
    setFormData({
      name: character.name,
      description: character.description,
      motivations: character.motivations,
      relationships: character.relationships,
      backstory: character.backstory,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Your Characters</h3>
            <Button
              size="sm"
              onClick={resetForm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>

          {characters.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No characters yet. Create your first character!
            </p>
          ) : (
            <div className="space-y-2">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedCharacter?.id === character.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  onClick={() => selectCharacter(character)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-bold text-gray-900">{character.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCharacter(character.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {character.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {character.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {selectedCharacter ? 'Edit Character' : 'Create New Character'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Character Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter character name"
                className="border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Physical Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe appearance, age, distinctive features..."
                rows={3}
                className="border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Motivations & Goals
              </label>
              <Textarea
                value={formData.motivations}
                onChange={(e) => setFormData({ ...formData, motivations: e.target.value })}
                placeholder="What drives this character? What do they want?"
                rows={3}
                className="border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Relationships
              </label>
              <Textarea
                value={formData.relationships}
                onChange={(e) => setFormData({ ...formData, relationships: e.target.value })}
                placeholder="Relationships with other characters..."
                rows={3}
                className="border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Backstory
              </label>
              <Textarea
                value={formData.backstory}
                onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
                placeholder="Character's history and background..."
                rows={4}
                className="border-2"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveCharacter}
                disabled={saving || !formData.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Character
                  </>
                )}
              </Button>

              <Button
                onClick={handleGetAISuggestions}
                disabled={generatingAI !== null || !formData.name.trim()}
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
                    Get AI Suggestions
                  </>
                )}
              </Button>
            </div>

            {selectedCharacter?.ai_suggestions && selectedCharacter.ai_suggestions.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Development Suggestions
                </h4>
                <div className="space-y-4">
                  {selectedCharacter.ai_suggestions.map((suggestion, index) => (
                    <div key={index}>
                      <h5 className="font-bold text-sm text-purple-700 mb-2">
                        {suggestion.category}
                      </h5>
                      <ul className="space-y-1">
                        {suggestion.suggestions.map((item, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
