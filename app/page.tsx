'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Sparkles, TrendingUp, Zap, Heart, Search, ShoppingBag, Menu, X, ChevronRight, Star, Book, Library } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    checkUser();

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

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
      observerRef.current?.disconnect();
    };
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push('/library');
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
    <div className="bg-white text-[#1D1D1F] overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-[980px] mx-auto px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-xl">
            <BookOpen className="h-5 w-5" />
            <span>VibeReader</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="hover:text-[#0071E3] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#0071E3] transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-[#0071E3] transition-colors">Pricing</a>
            <a href="#get-started" className="hover:text-[#0071E3] transition-colors">Get started</a>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden md:block hover:text-[#0071E3] transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="hidden md:block hover:text-[#0071E3] transition-colors">
              <ShoppingBag className="h-5 w-5" />
            </button>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4 px-6 space-y-4">
            <a href="#features" className="block text-lg" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-lg" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#pricing" className="block text-lg" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#get-started" className="block text-lg" onClick={() => setMobileMenuOpen(false)}>Get started</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-11 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#F5F5F7] to-white opacity-60" />
        <div className="max-w-[980px] mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 bg-gradient-to-b from-[#1D1D1F] to-[#86868B] bg-clip-text text-transparent">
            Reading,
            <br />
            redefined.
          </h1>
          <p className="text-xl md:text-2xl text-[#86868B] font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Discover books that match your vibe. Powered by AI.
            <br />
            Designed for readers who know what they want.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-[#0071E3] hover:bg-[#0077ED] text-white px-8 py-6 text-lg rounded-full transition-all hover:scale-105"
              onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#0071E3] text-[#0071E3] hover:bg-[#0071E3]/5 px-8 py-6 text-lg rounded-full transition-all hover:scale-105"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn more
            </Button>
          </div>

          <div className="mt-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent h-32 bottom-0 z-10" />
              <img
                src="https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Reading Experience"
                className="rounded-3xl shadow-2xl w-full max-w-4xl mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1 - Dark */}
      <section
        id="features"
        data-animate
        className={`py-32 px-6 bg-[#000000] text-white transition-all duration-1000 ${
          visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="max-w-[980px] mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <img
                src="https://images.pexels.com/photos/4855419/pexels-photo-4855419.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="AI Recommendations"
                className="rounded-2xl shadow-2xl"
              />
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
                Your reading DNA,
                <br />
                decoded.
              </h2>
              <p className="text-xl text-[#86868B] leading-relaxed">
                Our AI analyzes your mood, pacing preferences, and themes to recommend books that truly resonate. No more endless scrolling through generic bestseller lists.
              </p>
              <ul className="space-y-4 text-lg">
                <li className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-[#0071E3]" />
                  <span>Personalized AI recommendations</span>
                </li>
                <li className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-[#0071E3]" />
                  <span>Mood-based matching</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-[#0071E3]" />
                  <span>Instant suggestions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2 - Light */}
      <section
        data-animate
        id="how-it-works"
        className={`py-32 px-6 bg-white transition-all duration-1000 delay-200 ${
          visibleSections.has('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="max-w-[980px] mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
                Track every
                <br />
                chapter.
              </h2>
              <p className="text-xl text-[#86868B] leading-relaxed">
                Build your personal library. Organize books into Want to Read, Currently Reading, and Finished. Track progress and never lose your place.
              </p>
              <div className="grid grid-cols-3 gap-6 pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#0071E3] mb-2">2x</div>
                  <div className="text-sm text-[#86868B]">More books<br />read yearly</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#0071E3] mb-2">95%</div>
                  <div className="text-sm text-[#86868B]">Match<br />accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#0071E3] mb-2">∞</div>
                  <div className="text-sm text-[#86868B]">Books to<br />discover</div>
                </div>
              </div>
            </div>
            <div>
              <img
                src="https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Library Management"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section
        data-animate
        className={`py-32 px-6 bg-[#F5F5F7] transition-all duration-1000 delay-300 ${
          visibleSections.has('feature-cards') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
        id="feature-cards"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Everything you need.
              <br />
              Nothing you don't.
            </h2>
            <p className="text-xl text-[#86868B]">Beautifully simple. Incredibly powerful.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-8 bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl">
              <Sparkles className="h-12 w-12 text-[#0071E3] mb-6" />
              <h3 className="text-2xl font-bold mb-3">AI Quiz</h3>
              <p className="text-[#86868B] leading-relaxed">
                Answer a few questions about your reading preferences and mood.
              </p>
            </Card>

            <Card className="p-8 bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl">
              <Book className="h-12 w-12 text-[#0071E3] mb-6" />
              <h3 className="text-2xl font-bold mb-3">Smart Match</h3>
              <p className="text-[#86868B] leading-relaxed">
                Get instant recommendations from Google Books based on your vibe.
              </p>
            </Card>

            <Card className="p-8 bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl">
              <Library className="h-12 w-12 text-[#0071E3] mb-6" />
              <h3 className="text-2xl font-bold mb-3">Your Library</h3>
              <p className="text-[#86868B] leading-relaxed">
                Organize and track all your books in one beautiful place.
              </p>
            </Card>

            <Card className="p-8 bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl">
              <Heart className="h-12 w-12 text-[#0071E3] mb-6" />
              <h3 className="text-2xl font-bold mb-3">Read & Enjoy</h3>
              <p className="text-[#86868B] leading-relaxed">
                Access books directly through Google Books integration.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        data-animate
        id="pricing"
        className={`py-32 px-6 bg-white transition-all duration-1000 delay-400 ${
          visibleSections.has('pricing') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="max-w-[980px] mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Free. Forever.
          </h2>
          <p className="text-xl text-[#86868B] mb-16 max-w-2xl mx-auto leading-relaxed">
            No subscriptions. No hidden fees. Just pure reading joy.
            Because everyone deserves to find their next favorite book.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <Star className="h-12 w-12 text-[#0071E3] mb-4" />
              <div className="text-4xl font-bold mb-2">Unlimited</div>
              <div className="text-[#86868B]">Recommendations</div>
            </div>
            <div className="flex flex-col items-center">
              <Star className="h-12 w-12 text-[#0071E3] mb-4" />
              <div className="text-4xl font-bold mb-2">Unlimited</div>
              <div className="text-[#86868B]">Books in Library</div>
            </div>
            <div className="flex flex-col items-center">
              <Star className="h-12 w-12 text-[#0071E3] mb-4" />
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-[#86868B]">Free Forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Dark */}
      <section
        data-animate
        id="get-started"
        className={`py-32 px-6 bg-gradient-to-b from-[#000000] to-[#1D1D1F] text-white transition-all duration-1000 delay-500 ${
          visibleSections.has('get-started') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="max-w-[640px] mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-8">
            Start reading
            <br />
            smarter today.
          </h2>

          <Card className="p-8 bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-14 text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#0071E3] hover:bg-[#0077ED] text-white text-lg rounded-xl transition-all hover:scale-105"
              >
                {loading ? 'Loading...' : isSignUp ? 'Sign up for free' : 'Sign in'}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#0071E3] hover:text-[#0077ED] transition-colors text-sm"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F5F5F7] py-16 px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-3 text-sm text-[#86868B]">
                <li><a href="#features" className="hover:text-[#1D1D1F] transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-[#1D1D1F] transition-colors">How it works</a></li>
                <li><a href="#pricing" className="hover:text-[#1D1D1F] transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-3 text-sm text-[#86868B]">
                <li><a href="#" className="hover:text-[#1D1D1F] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[#1D1D1F] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[#1D1D1F] transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Resources</h4>
              <ul className="space-y-3 text-sm text-[#86868B]">
                <li><a href="#" className="hover:text-[#1D1D1F] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#1D1D1F] transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-[#1D1D1F] transition-colors">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Connect</h4>
              <ul className="space-y-3 text-sm text-[#86868B]">
                <li><a href="#" className="hover:text-[#1D1D1F] transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-[#1D1D1F] transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-[#1D1D1F] transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#D2D2D7] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-5 w-5" />
              <span>VibeReader</span>
            </div>
            <p className="text-sm text-[#86868B]">
              Copyright © 2025 VibeReader. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
