'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectForm } from '@/components/ProjectForm';

interface ProjectDetailProps {
  project: {
    id: string;
    name: string;
    githubRepo: string;
    githubBranch: string;
    githubFilePath: string;
    syncMode: string;
    pushMode: string;
    defaultDirectory: string;
  };
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/dashboard');
      router.refresh();
    } catch {
      alert('Failed to delete project');
      setDeleting(false);
    }
  }

  if (editing) {
    return <ProjectForm mode="edit" initialData={project} />;
  }

  return (
    <div className="space-y-6">
      {/* Project Info Card */}
      <div
        className="rounded-xl border p-6"
        style={{
          borderColor: 'var(--border-primary)',
          backgroundColor: 'var(--bg-elevated)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Configuration
          </h3>
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--brand)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--brand)')}
          >
            Edit
          </button>
        </div>

        <dl className="space-y-4">
          <div className="flex justify-between">
            <dt className="text-sm" style={{ color: 'var(--text-secondary)' }}>Repository</dt>
            <dd className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{project.githubRepo}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm" style={{ color: 'var(--text-secondary)' }}>Branch</dt>
            <dd className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{project.githubBranch}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm" style={{ color: 'var(--text-secondary)' }}>File Path</dt>
            <dd className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{project.githubFilePath}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sync Mode</dt>
            <dd className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{project.syncMode}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm" style={{ color: 'var(--text-secondary)' }}>Push Mode</dt>
            <dd className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{project.pushMode}</dd>
          </div>
          {project.syncMode === 'multi' && (
            <div className="flex justify-between">
              <dt className="text-sm" style={{ color: 'var(--text-secondary)' }}>Directory</dt>
              <dd className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{project.defaultDirectory}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Danger Zone */}
      <div
        className="rounded-xl border p-6"
        style={{
          borderColor: 'var(--border-primary)',
          backgroundColor: 'color-mix(in srgb, var(--bg-elevated) 95%, #ef4444 5%)',
        }}
      >
        <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Deleting a project removes its configuration. Your GitHub repository will not be affected.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50 transition-colors"
          style={{
            borderColor: 'color-mix(in srgb, var(--border-primary) 60%, #ef4444 40%)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--bg-elevated) 85%, #ef4444 15%)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {deleting ? 'Deleting...' : 'Delete Project'}
        </button>
      </div>
    </div>
  );
}
