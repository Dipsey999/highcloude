'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <span className="font-semibold text-gray-900">Claude Bridge</span>
          </Link>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
