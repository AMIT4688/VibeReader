'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { CharacterManager } from '@/components/CharacterManager';
import { StoryPlanner } from '@/components/StoryPlanner';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, BookOpen, Sparkles, AlertCircle } from 'lucide-react';

export default function WritingToolsPage() {
  const [activeTab, setActiveTab] = useState('characters');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navigation />

      <div className="max-w-[1400px] mx-auto px-6 pt-24 pb-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-black text-gray-900">AI Writing Tools</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl">
            Enhanced with Skywork.ai to help you create compelling characters and plot engaging stories.
            Get AI-powered suggestions to bring your creative writing to life.
          </p>
        </div>

        <Card className="p-2 bg-white/80 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="characters"
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                <User className="h-4 w-4" />
                Character Manager
              </TabsTrigger>
              <TabsTrigger
                value="stories"
                className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
              >
                <BookOpen className="h-4 w-4" />
                Story Planner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="characters" className="mt-0">
              <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">How Character Manager Works</h3>
                    <p className="text-sm text-blue-800">
                      Enter your character details like name, description, motivations, relationships, and backstory.
                      Click "Get AI Suggestions" to receive personalized character development ideas from Skywork.ai.
                      The AI analyzes your character and provides suggestions for personality depth, conflicts, growth arcs, and unique traits.
                    </p>
                  </div>
                </div>
              </div>
              <CharacterManager />
            </TabsContent>

            <TabsContent value="stories" className="mt-0">
              <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">How Story Planner Works</h3>
                    <p className="text-sm text-green-800">
                      Input your story title, outline, genre, mood, pacing, and setting details.
                      Click "Get Plot Ideas" to let Skywork.ai's Plot Architect generate chapter outlines, plot twists, and setting details.
                      The AI creates structured story plans with chapter ideas, compelling twists, and rich setting descriptions tailored to your vision.
                    </p>
                  </div>
                </div>
              </div>
              <StoryPlanner />
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Build Rich Characters</h3>
            <p className="text-sm text-gray-700">
              Create multi-dimensional characters with depth. AI helps you develop personalities, backstories, and compelling arcs.
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-200">
            <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Plot Your Story</h3>
            <p className="text-sm text-gray-700">
              Structure your narrative with AI-generated chapter ideas, plot twists, and pacing recommendations tailored to your genre.
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200">
            <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">AI-Powered Insights</h3>
            <p className="text-sm text-gray-700">
              Leverage Skywork.ai's creative intelligence to overcome writer's block and discover fresh ideas for your stories.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
