'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { BookOpen, Library, Sparkles, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
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
    <nav className="border-b bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/library" className="flex items-center gap-2 font-bold text-2xl text-primary">
            <BookOpen className="h-7 w-7" />
            VibeReader
          </Link>

          <div className="flex items-center gap-6">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                  pathname === href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
