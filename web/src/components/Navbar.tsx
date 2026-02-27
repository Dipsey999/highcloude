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
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow duration-300">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Claude Bridge
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
                    <SunIcon className="h-[18px] w-[18px] text-amber-400" />
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
                    <SunIcon className="h-[18px] w-[18px] text-amber-400" />
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
