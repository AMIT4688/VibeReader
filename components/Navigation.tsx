'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { BookOpen, Library, Sparkles, LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/');
  }

  if (!isAuthenticated) return null;

  const links = [
    { href: '/library', label: 'Library', icon: Library },
    { href: '/recommendations', label: 'Recommendations', icon: Sparkles },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200' : 'bg-white border-b border-gray-200'
    }`}>
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/library" className="flex items-center gap-2 font-semibold text-xl text-[#1D1D1F]">
          <BookOpen className="h-6 w-6" />
          <span>VibeReader</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                pathname === href
                  ? 'text-[#0071E3]'
                  : 'text-[#1D1D1F] hover:text-[#0071E3]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}

          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <button
          className="md:hidden text-[#1D1D1F]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4 px-6 space-y-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 text-base font-medium ${
                pathname === href ? 'text-[#0071E3]' : 'text-[#1D1D1F]'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
          <button
            onClick={() => {
              handleSignOut();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 text-base font-medium text-[#86868B] w-full"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
