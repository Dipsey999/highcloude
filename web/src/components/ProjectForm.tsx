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
}

export function ProjectForm({ initialData, mode }: ProjectFormProps) {
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

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Project Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Design System"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
      </div>

      {/* GitHub Repo */}
      <div>
        <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-1">
          GitHub Repository
        </label>
        <input
          id="repo"
          type="text"
          required
          value={githubRepo}
          onChange={(e) => setGithubRepo(e.target.value)}
          placeholder="owner/repo"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">Format: owner/repo-name</p>
      </div>

      {/* Branch + File Path */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
            Branch
          </label>
          <input
            id="branch"
            type="text"
            value={githubBranch}
            onChange={(e) => setGithubBranch(e.target.value)}
            placeholder="main"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <div>
          <label htmlFor="filePath" className="block text-sm font-medium text-gray-700 mb-1">
            Token File Path
          </label>
          <input
            id="filePath"
            type="text"
            value={githubFilePath}
            onChange={(e) => setGithubFilePath(e.target.value)}
            placeholder="tokens.json"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
      </div>

      {/* Sync Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sync Mode</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSyncMode('single')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              syncMode === 'single'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Single File
          </button>
          <button
            type="button"
            onClick={() => setSyncMode('multi')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              syncMode === 'multi'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Multi File
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {syncMode === 'single'
            ? 'All tokens in one file'
            : 'Tokens split by collection into separate files'}
        </p>
      </div>

      {/* Push Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Push Mode</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPushMode('direct')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              pushMode === 'direct'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Direct Commit
          </button>
          <button
            type="button"
            onClick={() => setPushMode('pr')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              pushMode === 'pr'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pull Request
          </button>
        </div>
      </div>

      {/* Default Directory (for multi-file) */}
      {syncMode === 'multi' && (
        <div>
          <label htmlFor="dir" className="block text-sm font-medium text-gray-700 mb-1">
            Default Directory
          </label>
          <input
            id="dir"
            type="text"
            value={defaultDirectory}
            onChange={(e) => setDefaultDirectory(e.target.value)}
            placeholder="tokens/"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
