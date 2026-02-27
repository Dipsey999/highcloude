'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { SunIcon, MoonIcon, DownloadIcon, ArrowLeftIcon } from '@/components/Icons';

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
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-glow transition-all duration-500 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}
            >
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.2), transparent)',
                  animation: 'nebulaSpin 3s linear infinite',
                }}
              />
              <svg className="relative h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.09 6.26L20.18 9l-4.64 4.14L16.82 20 12 16.77 7.18 20l1.28-6.86L3.82 9l6.09-.74L12 2z" />
              </svg>
            </div>
            <span className="font-bold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Cosmikit
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href="/download"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all duration-200"
              style={{ color: 'var(--text-secondary)' }}
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Link>

            {session?.user ? (
              <>
                {isDashboard ? (
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all duration-200"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Home</span>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="rounded-lg px-3 py-2 text-sm transition-all duration-200"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Dashboard
                  </Link>
                )}

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200"
                  style={{
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-secondary)',
                  }}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <SunIcon className="h-[18px] w-[18px]" style={{ color: 'var(--star-gold)' }} />
                  ) : (
                    <MoonIcon className="h-[18px] w-[18px]" />
                  )}
                </button>

                <div className="flex items-center gap-2 ml-1">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 rounded-full ring-2 ring-transparent transition-all duration-200"
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
                <button
                  onClick={toggleTheme}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200"
                  style={{
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-secondary)',
                  }}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <SunIcon className="h-[18px] w-[18px]" style={{ color: 'var(--star-gold)' }} />
                  ) : (
                    <MoonIcon className="h-[18px] w-[18px]" />
                  )}
                </button>

                <Link
                  href="/login"
                  className="btn-gradient rounded-lg px-4 py-2 text-sm font-medium"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
