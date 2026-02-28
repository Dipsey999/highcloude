'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectFormProps {
  initialData?: {
    id?: string;
    name: string;
    githubRepo: string;
    githubBranch: string;
    githubFilePath: string;
    syncMode: string;
    pushMode: string;
    defaultDirectory: string;
  };
  mode: 'create' | 'edit';
  /** Called after successful project creation (step 1 of 2-step flow) */
  onProjectCreated?: (project: { id: string; name: string }) => void;
  /** Skip router.push('/dashboard') after save — used in 2-step flow */
  skipRedirect?: boolean;
}

export function ProjectForm({ initialData, mode, onProjectCreated, skipRedirect }: ProjectFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? '');
  const [githubRepo, setGithubRepo] = useState(initialData?.githubRepo ?? '');
  const [githubBranch, setGithubBranch] = useState(initialData?.githubBranch ?? 'main');
  const [githubFilePath, setGithubFilePath] = useState(initialData?.githubFilePath ?? 'tokens.json');
  const [syncMode, setSyncMode] = useState(initialData?.syncMode ?? 'single');
  const [pushMode, setPushMode] = useState(initialData?.pushMode ?? 'direct');
  const [defaultDirectory, setDefaultDirectory] = useState(initialData?.defaultDirectory ?? 'tokens/');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { name, githubRepo, githubBranch, githubFilePath, syncMode, pushMode, defaultDirectory };

    try {
      const url = mode === 'create' ? '/api/projects' : `/api/projects/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save project');
      }

      const result = await res.json();

      // In 2-step create flow, call onProjectCreated instead of redirecting
      if (mode === 'create' && onProjectCreated && result.project) {
        onProjectCreated({ id: result.project.id, name: result.project.name });
        return;
      }

      if (!skipRedirect) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border p-6"
      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
    >
      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Project Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Design System"
          className="input w-full rounded-xl px-3.5 py-2.5 text-sm"
        />
      </div>

      {/* GitHub Repo */}
      <div>
        <label htmlFor="repo" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          GitHub Repository
        </label>
        <input
          id="repo"
          type="text"
          required
          value={githubRepo}
          onChange={(e) => setGithubRepo(e.target.value)}
          placeholder="owner/repo"
          className="input w-full rounded-xl px-3.5 py-2.5 text-sm font-mono"
        />
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>Format: owner/repo-name</p>
      </div>

      {/* Branch + File Path */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="branch" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Branch
          </label>
          <input
            id="branch"
            type="text"
            value={githubBranch}
            onChange={(e) => setGithubBranch(e.target.value)}
            placeholder="main"
            className="input w-full rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="filePath" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Token File Path
          </label>
          <input
            id="filePath"
            type="text"
            value={githubFilePath}
            onChange={(e) => setGithubFilePath(e.target.value)}
            placeholder="tokens.json"
            className="input w-full rounded-xl px-3.5 py-2.5 text-sm font-mono"
          />
        </div>
      </div>

      {/* Sync Mode */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Sync Mode</label>
        <div className="flex gap-3">
          {(['single', 'multi'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSyncMode(m)}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                syncMode === m ? 'text-white' : ''
              }`}
              style={syncMode === m ? {
                background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                borderColor: 'transparent',
              } : {
                borderColor: 'var(--border-primary)',
                color: 'var(--text-secondary)',
                background: 'var(--bg-tertiary)',
              }}
            >
              {m === 'single' ? 'Single File' : 'Multi File'}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {syncMode === 'single' ? 'All tokens in one file' : 'Tokens split by collection into separate files'}
        </p>
      </div>

      {/* Push Mode */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Push Mode</label>
        <div className="flex gap-3">
          {(['direct', 'pr'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPushMode(m)}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                pushMode === m ? 'text-white' : ''
              }`}
              style={pushMode === m ? {
                background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                borderColor: 'transparent',
              } : {
                borderColor: 'var(--border-primary)',
                color: 'var(--text-secondary)',
                background: 'var(--bg-tertiary)',
              }}
            >
              {m === 'direct' ? 'Direct Commit' : 'Pull Request'}
            </button>
          ))}
        </div>
      </div>

      {/* Default Directory (for multi-file) */}
      {syncMode === 'multi' && (
        <div>
          <label htmlFor="dir" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Default Directory
          </label>
          <input
            id="dir"
            type="text"
            value={defaultDirectory}
            onChange={(e) => setDefaultDirectory(e.target.value)}
            placeholder="tokens/"
            className="input w-full rounded-xl px-3.5 py-2.5 text-sm font-mono"
          />
        </div>
      )}

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm border-l-4"
          style={{ background: 'var(--error-subtle)', color: 'var(--error)', borderLeftColor: 'var(--error)' }}
        >
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn-gradient flex-1 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : mode === 'create' ? (onProjectCreated ? 'Continue' : 'Create Project') : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost rounded-xl px-4 py-2.5 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
