'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { SunIcon, MoonIcon, ArrowLeftIcon, SparklesIcon, CosmiLogo } from '@/components/Icons';

export function Navbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        borderColor: 'var(--border-primary)',
        background: 'var(--bg-glass)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <CosmiLogo className="h-7 w-7 transition-transform duration-300 group-hover:scale-105" showNodes={false} />
            <span
              className="font-semibold text-[15px] tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Cosmikit
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {session?.user ? (
              <>
                {isDashboard ? (
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors duration-200"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Home</span>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="rounded-lg px-3 py-2 text-sm transition-colors duration-200"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Dashboard
                  </Link>
                )}

                <Link
                  href="/create"
                  className="btn-gradient flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Create Design System</span>
                    <span className="sm:hidden">Create</span>
                  </span>
                </Link>

                <button
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-200"
                  style={{
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-secondary)',
                  }}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <SunIcon className="h-4 w-4" style={{ color: 'var(--star-gold)' }} />
                  ) : (
                    <MoonIcon className="h-4 w-4" />
                  )}
                </button>

                <div className="flex items-center gap-2 ml-1">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-7 w-7 rounded-full ring-1 ring-transparent"
                    />
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-sm transition-colors duration-200"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm transition-colors duration-200"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Sign in
                </Link>

                <Link
                  href="/create"
                  className="btn-gradient flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Create Design System</span>
                    <span className="sm:hidden">Create</span>
                  </span>
                </Link>

                <button
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-200"
                  style={{
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-secondary)',
                  }}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <SunIcon className="h-4 w-4" style={{ color: 'var(--star-gold)' }} />
                  ) : (
                    <MoonIcon className="h-4 w-4" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
