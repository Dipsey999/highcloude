import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { ProjectCard } from '@/components/ProjectCard';
import { EmptyState } from '@/components/EmptyState';
import { PlusIcon, FolderIcon } from '@/components/Icons';

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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Projects</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage your projects and design systems.
          </p>
        </div>
        {projects.length > 0 && (
          <a
            href="/dashboard/projects/new"
            className="btn-gradient flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            New Project
          </a>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="h-6 w-6" />}
          title="No projects yet"
          description="Create your first project to start syncing design tokens between Figma and GitHub."
          actionLabel="Create Project"
          actionHref="/dashboard/projects/new"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const themeConfig = project.themeConfig as Record<string, any> | null;
            return (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                githubRepo={project.githubRepo}
                githubBranch={project.githubBranch}
                syncMode={project.syncMode}
                updatedAt={project.updatedAt.toISOString()}
                hasDesignSystem={!!project.designSystemSource}
                accentColor={themeConfig?.accentColor ?? null}
                designSystemName={project.designSystemName}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
