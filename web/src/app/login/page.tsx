'use client';

import { signIn } from 'next-auth/react';
import { GitHubIcon, CosmiLogo } from '@/components/Icons';

export default function LoginPage() {
  return (
    <div
      className="hero-mesh relative flex min-h-[calc(100vh-4rem)] items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-8 shadow-lg"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div className="text-center">
          {/* Logo */}
          <div className="mx-auto mb-6 flex justify-center">
            <CosmiLogo className="h-12 w-12" />
          </div>

          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Sign in to <span className="gradient-text">Cosmikit</span>
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Connect with your GitHub account to get started.
          </p>
        </div>

        <button
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <GitHubIcon className="h-5 w-5" />
          Continue with GitHub
        </button>

        <p
          className="mt-6 text-center text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          We only request access to your public profile.
        </p>
      </div>
    </div>
  );
}
