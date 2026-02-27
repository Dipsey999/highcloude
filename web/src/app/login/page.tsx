'use client';

import { signIn } from 'next-auth/react';
import { GitHubIcon } from '@/components/Icons';

export default function LoginPage() {
  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center"
      style={{
        background:
          'radial-gradient(circle at 50% 40%, var(--gradient-from) / 0.08, transparent 60%)',
      }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8 shadow-xl backdrop-blur-sm"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)]"
            style={{
              boxShadow: '0 4px 20px color-mix(in srgb, var(--gradient-from) 40%, transparent)',
            }}
          >
            <span className="text-lg font-bold text-white">CB</span>
          </div>
          <h1
            className="mt-4 text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Sign in to Claude Bridge
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
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors hover:opacity-90"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
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
