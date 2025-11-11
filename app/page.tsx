'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Sparkles, TrendingUp, Zap, Users, Star, Search, ShoppingBag, Menu, X, ChevronRight, ArrowRight, Check, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getVibeBasedRecommendations, type AIBookRecommendation } from '@/lib/claude-ai';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeVibe, setActiveVibe] = useState<string | null>(null);
  const [showVibeModal, setShowVibeModal] = useState(false);
  const [vibeRecommendations, setVibeRecommendations] = useState<AIBookRecommendation[]>([]);
  const [loadingVibe, setLoadingVibe] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const bookCovers = useMemo(() => [
    'https://images.pexels.com/photos/1166657/pexels-photo-1166657.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/415071/pexels-photo-415071.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1301585/pexels-photo-1301585.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/4855420/pexels-photo-4855420.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/3358707/pexels-photo-3358707.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/4855419/pexels-photo-4855419.jpeg?auto=compress&cs=tinysrgb&w=300',
  ], []);

  const vibes = useMemo(() => [
    { emoji: '🔥', label: 'Energetic', color: 'from-orange-500 to-red-500' },
    { emoji: '🧘', label: 'Calm', color: 'from-blue-400 to-cyan-400' },
    { emoji: '🚀', label: 'Motivated', color: 'from-purple-500 to-pink-500' },
    { emoji: '💭', label: 'Reflective', color: 'from-indigo-500 to-purple-500' },
  ], []);

  useEffect(() => {
    checkUser();

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      observerRef.current?.disconnect();
    };
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push('/library');
    }
  }

  async function handleVibeClick(vibe: string) {
    setActiveVibe(vibe);
    setShowVibeModal(true);
    setLoadingVibe(true);
    setVibeRecommendations([]);

    try {
      // Save vibe preference to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any).from('user_vibe_preferences').insert({
          user_id: user.id,
          vibe: vibe,
          selected_at: new Date().toISOString(),
        });
      }

      // Get AI recommendations
      const recommendations = await getVibeBasedRecommendations(vibe);
      setVibeRecommendations(recommendations);
      toast.success(`Found ${recommendations.length} perfect ${vibe} books for you!`);
    } catch (error) {
      console.error('Error getting vibe recommendations:', error);
      toast.error('Failed to load recommendations. Please try again.');
    } finally {
      setLoadingVibe(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        toast.success('Account created! Redirecting...');
        router.push('/library');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success('Welcome back!');
        router.push('/library');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/70 backdrop-blur-xl shadow-lg shadow-purple-500/10' : 'bg-transparent'
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className={`font-black text-2xl ${
              scrolled ? 'text-gray-900' : 'text-white drop-shadow-lg'
            }`}>VibeReader</span>
          </div>

          <div className={`hidden md:flex items-center gap-8 text-base font-semibold ${
            scrolled ? 'text-gray-700' : 'text-white/90 drop-shadow-md'
          }`}>
            <a href="#features" className="hover:text-purple-500 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-purple-500 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-purple-500 transition-colors">Pricing</a>
            <a href="#get-started" className="hover:text-purple-500 transition-colors">Get started</a>
          </div>

          <div className="flex items-center gap-4">
            <button className={`hidden md:block hover:scale-110 transition-all ${
              scrolled ? 'text-gray-700 hover:text-purple-600' : 'text-white hover:text-purple-300'
            }`}>
              <Search className="h-6 w-6" />
            </button>
            <button className={`hidden md:block hover:scale-110 transition-all ${
              scrolled ? 'text-gray-700 hover:text-purple-600' : 'text-white hover:text-purple-300'
            }`}>
              <ShoppingBag className="h-6 w-6" />
            </button>
            <button className={`md:hidden ${scrolled ? 'text-gray-900' : 'text-white'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200 py-4 px-6 space-y-4">
            <a href="#features" className="block text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#pricing" className="block text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#get-started" className="block text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>Get started</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center relative overflow-hidden pt-20">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 animate-gradient-wave" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(236,72,153,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(139,92,246,0.3),transparent_50%)]" />

        {/* Floating Book Covers */}
        {bookCovers.map((cover, i) => (
          <div
            key={i}
            className="absolute hidden lg:block opacity-80"
            style={{
              left: `${10 + (i % 4) * 22}%`,
              top: `${15 + Math.floor(i / 4) * 35}%`,
              transform: `translate(${mousePosition.x * 0.015 * (i + 1)}px, ${mousePosition.y * 0.015 * (i + 1)}px) rotate(${-15 + i * 4}deg)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <div className="relative animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
              <img
                src={cover}
                alt="Book cover"
                className="w-20 h-32 rounded-lg shadow-2xl border-4 border-white/40 backdrop-blur-sm"
              />
              <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${vibes[i % vibes.length].color} opacity-30 mix-blend-overlay`} />
            </div>
          </div>
        ))}

        {/* Sparkle Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            >
              <Sparkles className="h-5 w-5 text-white/60" />
            </div>
          ))}
        </div>

        <div className="max-w-[1200px] mx-auto px-6 py-20 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
              {/* Eyebrow */}
              <div className="inline-block animate-in fade-in slide-in-from-top duration-1000 delay-200">
                <div className="bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full border-2 border-white/40 text-white font-bold text-sm flex items-center gap-2 shadow-xl">
                  🎯 SMART READING STARTS HERE
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight animate-in fade-in slide-in-from-left duration-1000 delay-300">
                <span className="text-white drop-shadow-2xl block">Your vibe, your reads—</span>
                <span className="text-white drop-shadow-2xl block">make time yours</span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-white/95 font-medium leading-relaxed max-w-xl drop-shadow-lg animate-in fade-in slide-in-from-left duration-1000 delay-500">
                Personalized book recommendations that match your energy, mood, and goals. AI finds your perfect next read in seconds, not hours.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-left duration-1000 delay-700">
                <Button
                  size="lg"
                  className="group bg-white text-purple-600 hover:bg-gray-50 px-8 py-7 text-lg font-bold rounded-2xl shadow-2xl transition-all hover:scale-105 hover:shadow-white/50"
                  onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Get Started Free
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-3 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-7 text-lg font-bold rounded-2xl shadow-xl transition-all hover:scale-105"
                  onClick={() => router.push('/recommendations')}
                >
                  See Your Vibe Match
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/20 shadow-2xl animate-in fade-in slide-in-from-left duration-1000 delay-900">
                <div className="flex flex-wrap items-center gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="font-bold">50,000+ readers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                    <span className="font-bold">4.9/5 rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <span className="font-bold">2M+ books analyzed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Phone Mockup */}
            <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-400 lg:block hidden">
              <div className="relative mx-auto w-[340px] h-[700px]">
                {/* Phone Frame */}
                <div className="relative w-full h-full bg-gray-900 rounded-[3.5rem] shadow-2xl border-[14px] border-gray-900 overflow-hidden animate-float">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-gray-900 rounded-b-3xl z-20" />

                  {/* Screen Content */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 text-center">
                      <div className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
                        VibeReader
                      </div>
                      <div className="text-xs text-gray-600 font-semibold">Find your perfect match</div>
                    </div>

                    {/* Book Cards */}
                    <div className="px-4 space-y-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="bg-white rounded-2xl p-4 shadow-lg flex gap-3 animate-slide-up"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        >
                          <div className={`w-14 h-20 bg-gradient-to-br ${vibes[i % vibes.length].color} rounded-lg shadow-md flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="h-3 bg-gray-200 rounded-full w-full mb-2" />
                            <div className="h-2 bg-gray-100 rounded-full w-2/3 mb-2" />
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, j) => (
                                <Star key={j} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-40 blur-3xl -z-10 animate-pulse" />

                {/* Vibe Waves */}
                <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-40 h-40 opacity-30">
                  <div className="absolute inset-0 border-4 border-white rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-4 border-4 border-white rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                  <div className="absolute inset-8 border-4 border-white rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Vibe Tags */}
          <div className="flex flex-wrap justify-center gap-3 mt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-1000">
            {vibes.map((vibe) => (
              <button
                key={vibe.label}
                onClick={() => handleVibeClick(vibe.label)}
                className={`group px-6 py-3 rounded-full font-bold text-base transition-all duration-300 cursor-pointer ${
                  activeVibe === vibe.label
                    ? `bg-white text-purple-600 shadow-2xl scale-110`
                    : `bg-gradient-to-r ${vibe.color} text-white hover:scale-105 shadow-xl hover:shadow-2xl`
                }`}
              >
                <span className="mr-2">{vibe.emoji}</span>
                {vibe.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-white" id="features">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* The Problem */}
            <div className="bg-red-50 rounded-3xl p-8 border-4 border-red-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-black text-gray-900">The Problem:</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                Searching for good books takes forever. Too many websites, too confusing, not fun! Time wasted scrolling instead of reading.
              </p>
            </div>

            {/* Our Solution */}
            <div className="bg-green-50 rounded-3xl p-8 border-4 border-green-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-black text-gray-900">Our Solution:</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                One place for everything! AI picks books YOU'll love based on your vibe. Easy, fast, and super fun! More reading, less searching.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section id="get-started" className="py-32 px-6 bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        <div className="max-w-md mx-auto">
          <Card className="p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-3xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600 font-medium">
                {isSignUp ? 'Start your reading journey today!' : 'Continue your reading adventure'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-purple-500"
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-purple-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-center text-purple-600 hover:text-purple-700 font-semibold transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </form>
          </Card>
        </div>
      </section>

      {/* Vibe Recommendations Modal */}
      <Dialog open={showVibeModal} onOpenChange={setShowVibeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              {activeVibe && (
                <span className="flex items-center gap-3">
                  <span className="text-4xl">
                    {vibes.find(v => v.label === activeVibe)?.emoji}
                  </span>
                  {activeVibe} Vibes
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {loadingVibe ? (
            <div className="py-20 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-lg text-gray-600 font-semibold">Finding perfect books for your {activeVibe} vibe...</p>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              {vibeRecommendations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-gray-600">No recommendations found. Please try again.</p>
                </div>
              ) : (
                vibeRecommendations.map((book, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg"
                  >
                    <div className="flex gap-4">
                      {book.coverUrl && (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-24 h-36 rounded-lg shadow-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-900 mb-1">{book.title}</h3>
                        <p className="text-sm font-semibold text-gray-600 mb-3">by {book.author}</p>

                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full">
                            <Star className="h-4 w-4 text-purple-600 fill-purple-600" />
                            <span className="text-sm font-bold text-purple-700">{book.matchScore}% Match</span>
                          </div>
                          <div className="text-xs bg-white px-3 py-1 rounded-full font-semibold text-gray-700">
                            {book.analytics.pageCount} pages
                          </div>
                          <div className="text-xs bg-white px-3 py-1 rounded-full font-semibold text-gray-700 capitalize">
                            {book.analytics.pacing} paced
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{book.description}</p>

                        <p className="text-sm font-semibold text-purple-700 mb-3">
                          💡 {book.matchExplanation}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {book.analytics.moods.slice(0, 3).map((mood, i) => (
                            <span key={i} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-semibold">
                              {mood}
                            </span>
                          ))}
                        </div>

                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg"
                          onClick={() => {
                            setShowVibeModal(false);
                            router.push('/recommendations');
                          }}
                        >
                          Add to Library
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
