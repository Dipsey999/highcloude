import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { ProjectCard } from '@/components/ProjectCard';
import { EmptyState } from '@/components/EmptyState';

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = session.user?.id;

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your design token sync configurations.
          </p>
        </div>
        {projects.length > 0 && (
          <a
            href="/dashboard/projects/new"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            New Project
          </a>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects yet"
          description="Create your first project to start syncing design tokens between Figma and GitHub."
          actionLabel="Create Project"
          actionHref="/dashboard/projects/new"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              githubRepo={project.githubRepo}
              githubBranch={project.githubBranch}
              syncMode={project.syncMode}
              updatedAt={project.updatedAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
