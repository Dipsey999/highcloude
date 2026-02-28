'use client';

import { GitHubIcon, CosmiLogo } from '@/components/Icons';

export default function LoginPage() {
  const handleSignIn = async () => {
    // Fetch CSRF token (also sets the matching cookie in the browser)
    const res = await fetch('/api/auth/csrf');
    const { csrfToken } = await res.json();

    // Create and submit a real form — bypasses any Next.js router interception
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/signin/github';

    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'csrfToken';
    tokenInput.value = csrfToken;
    form.appendChild(tokenInput);

    const callbackInput = document.createElement('input');
    callbackInput.type = 'hidden';
    callbackInput.name = 'callbackUrl';
    callbackInput.value = '/dashboard';
    form.appendChild(callbackInput);

    document.body.appendChild(form);
    form.submit();
  };

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
          onClick={handleSignIn}
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
