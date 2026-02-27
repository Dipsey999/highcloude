import { ProjectForm } from '@/components/ProjectForm';

export default function NewProjectPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>New Project</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Configure how your design tokens sync with GitHub.
        </p>
      </div>
      <div className="max-w-xl">
        <ProjectForm mode="create" />
      </div>
    </div>
  );
}
