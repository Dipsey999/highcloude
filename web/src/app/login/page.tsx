'use client';

import { signIn } from 'next-auth/react';
import { GitHubIcon } from '@/components/Icons';
import { StarField } from '@/components/StarField';

export default function LoginPage() {
  return (
    <div
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Cosmic background */}
      <StarField starCount={60} showNebula />

      {/* Nebula glow behind card */}
      <div
        className="pointer-events-none absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, var(--gradient-from) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.15,
        }}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-sm rounded-2xl p-8 shadow-xl backdrop-blur-xl"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div className="text-center">
          {/* Cosmic logo */}
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow"
            style={{
              background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
            }}
          >
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.09 6.26L20.18 9l-4.64 4.14L16.82 20 12 16.77 7.18 20l1.28-6.86L3.82 9l6.09-.74L12 2z" />
            </svg>
          </div>
          <h1
            className="mt-5 text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Sign in to <span className="gradient-text">Cosmikit</span>
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Connect with your GitHub account to begin your mission.
          </p>
        </div>

        <button
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 hover:shadow-glow"
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
