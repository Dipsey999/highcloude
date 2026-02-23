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
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-900">Configuration</h3>
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Edit
          </button>
        </div>

        <dl className="space-y-4">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Repository</dt>
            <dd className="text-sm font-medium text-gray-900">{project.githubRepo}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Branch</dt>
            <dd className="text-sm font-medium text-gray-900">{project.githubBranch}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">File Path</dt>
            <dd className="text-sm font-mono text-gray-900">{project.githubFilePath}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Sync Mode</dt>
            <dd className="text-sm font-medium text-gray-900 capitalize">{project.syncMode}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Push Mode</dt>
            <dd className="text-sm font-medium text-gray-900 capitalize">{project.pushMode}</dd>
          </div>
          {project.syncMode === 'multi' && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Directory</dt>
              <dd className="text-sm font-mono text-gray-900">{project.defaultDirectory}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-500 mb-4">
          Deleting a project removes its configuration. Your GitHub repository will not be affected.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {deleting ? 'Deleting...' : 'Delete Project'}
        </button>
      </div>
    </div>
  );
}
