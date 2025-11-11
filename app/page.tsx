'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Sparkles, TrendingUp, Zap, Heart, Search, ShoppingBag, Menu, X, ChevronRight, Star, Book, Library, Play, ChevronDown } from 'lucide-react';
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
  const [booksRecommended, setBooksRecommended] = useState(127543);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const bookCovers = useMemo(() => [
    'https://images.pexels.com/photos/1166657/pexels-photo-1166657.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/415071/pexels-photo-415071.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1301585/pexels-photo-1301585.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg?auto=compress&cs=tinysrgb&w=300',
  ], []);

  useEffect(() => {
    checkUser();

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const interval = setInterval(() => {
      setBooksRecommended(prev => prev + Math.floor(Math.random() * 10) + 1);
    }, 3000);

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
      clearInterval(interval);
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
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 animate-gradient-shift" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 via-purple-600/30 to-pink-600/30 animate-pulse" />

        {/* Floating Book Covers */}
        {bookCovers.map((cover, i) => (
          <div
            key={i}
            className="absolute hidden lg:block"
            style={{
              left: `${15 + i * 20}%`,
              top: `${20 + (i % 2) * 50}%`,
              transform: `translate(${mousePosition.x * 0.02 * (i + 1)}px, ${mousePosition.y * 0.02 * (i + 1)}px) rotate(${-10 + i * 5}deg)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <div className="relative animate-float" style={{ animationDelay: `${i * 0.2}s` }}>
              <img
                src={cover}
                alt="Book cover"
                className="w-24 h-36 rounded-lg shadow-2xl border-4 border-white/50 backdrop-blur-sm"
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping" />
            </div>
          </div>
        ))}

        {/* Sparkle Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              <Sparkles className="h-4 w-4 text-yellow-300" />
            </div>
          ))}
        </div>

        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-left space-y-8 animate-in fade-in slide-in-from-left duration-1000">
              <div className="inline-block">
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-white/50 text-white font-bold text-sm animate-bounce">
                  🔥 Trending Now: AI Book Matching
                </div>
              </div>

              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight">
                <span className="text-white drop-shadow-2xl">Stop Wasting</span>
                <br />
                <span className="text-white drop-shadow-2xl">Time on</span>
                <br />
                <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent drop-shadow-2xl font-extrabold">Bad Books</span>
              </h1>

              <p className="text-xl md:text-2xl text-white/95 font-bold leading-relaxed drop-shadow-lg max-w-xl">
                Get personalized book recommendations in 2 minutes. No more endless scrolling. Just books you'll actually love! ✨
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="group relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white px-10 py-8 text-xl font-black rounded-2xl shadow-2xl transition-all hover:scale-105 hover:shadow-purple-500/50 border-4 border-white overflow-hidden"
                  onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}
                  onMouseEnter={() => setShowConfetti(true)}
                  onMouseLeave={() => setShowConfetti(false)}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Sparkles className="h-6 w-6" />
                    Get My Reading List
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                  {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(15)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-confetti"
                          style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 0.5}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm border-4 border-white/50 text-white hover:bg-white/20 px-10 py-8 text-xl font-black rounded-2xl shadow-xl transition-all hover:scale-105"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="h-6 w-6 mr-3 fill-white" />
                  Watch Demo (30s)
                </Button>
              </div>

              {/* Animated Counter */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30 inline-block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pulse">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white tabular-nums">
                      {booksRecommended.toLocaleString()}
                    </div>
                    <div className="text-sm text-white/80 font-bold">books recommended this week</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Animated Mockup */}
            <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-200">
              <div className="relative">
                {/* Phone Mockup */}
                <div className="relative mx-auto w-[320px] h-[650px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl border-8 border-gray-800 overflow-hidden animate-float">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-800 rounded-b-3xl z-20" />

                  {/* Screen Content */}
                  <div className="absolute inset-2 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-[2.5rem] overflow-hidden">
                    <div className="p-6 space-y-4">
                      <div className="text-center mb-4">
                        <div className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                          VibeReader
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-4 shadow-lg animate-slide-up">
                        <div className="flex gap-3">
                          <div className="w-16 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg" />
                          <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded-full w-3/4 mb-2" />
                            <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-4 shadow-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="flex gap-3">
                          <div className="w-16 h-24 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg" />
                          <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded-full w-3/4 mb-2" />
                            <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-4 shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex gap-3">
                          <div className="w-16 h-24 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg" />
                          <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded-full w-3/4 mb-2" />
                            <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-30 blur-3xl -z-10 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="text-white text-center">
              <ChevronDown className="h-8 w-8 mx-auto mb-2" />
              <div className="text-sm font-bold">Scroll to explore</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1 */}
      <section
        id="features"
        data-animate
        className={`py-32 px-6 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 text-white transition-all duration-1000 ${
          visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="max-w-[1100px] mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <img
                src="https://images.pexels.com/photos/4855419/pexels-photo-4855419.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Kids reading"
                className="rounded-3xl shadow-2xl border-8 border-white"
              />
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight">
                Books Picked
                <br />
                Just For YOU!
              </h2>
              <p className="text-2xl leading-relaxed font-bold">
                Our smart AI finds books that match what YOU like! No more boring lists or confusing searches.
              </p>
              <ul className="space-y-4 text-xl font-bold">
                <li className="flex items-center gap-3 bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <Sparkles className="h-8 w-8" />
                  <span>AI picks books you'll LOVE</span>
                </li>
                <li className="flex items-center gap-3 bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <TrendingUp className="h-8 w-8" />
                  <span>Find books for any mood</span>
                </li>
                <li className="flex items-center gap-3 bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <Zap className="h-8 w-8" />
                  <span>Get answers in 2 minutes!</span>
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
        className={`py-32 px-6 bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 transition-all duration-1000 delay-200 ${
          visibleSections.has('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="max-w-[1100px] mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="text-6xl">⚡</div>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight text-gray-800">
                Stop Wasting
                <br />
                Time Online!
              </h2>
              <p className="text-2xl text-gray-700 leading-relaxed font-bold">
                Spend less time scrolling social media. More time reading amazing adventures!
              </p>
              <div className="grid grid-cols-3 gap-6 pt-6">
                <div className="text-center bg-white rounded-3xl p-6 shadow-lg border-4 border-purple-200">
                  <div className="text-5xl font-black text-purple-600 mb-2">2x</div>
                  <div className="text-base font-bold text-gray-700">Read more<br />books!</div>
                </div>
                <div className="text-center bg-white rounded-3xl p-6 shadow-lg border-4 border-pink-200">
                  <div className="text-5xl font-black text-pink-600 mb-2">95%</div>
                  <div className="text-base font-bold text-gray-700">Books you'll<br />love!</div>
                </div>
                <div className="text-center bg-white rounded-3xl p-6 shadow-lg border-4 border-blue-200">
                  <div className="text-5xl font-black text-blue-600 mb-2">∞</div>
                  <div className="text-base font-bold text-gray-700">Always<br />new books!</div>
                </div>
              </div>
            </div>
            <div>
              <img
                src="https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Kids with books"
                className="rounded-3xl shadow-2xl border-8 border-white"
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
