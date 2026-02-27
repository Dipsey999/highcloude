import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ProjectDetail } from './ProjectDetail';
import { FigmaStatusCard } from '@/components/FigmaStatusCard';
import { TokenStatusCard } from '@/components/TokenStatusCard';
import { PluginStatusBadge } from '@/components/PluginStatusBadge';

interface Props {
  params: { id: string };
}

export default async function ProjectPage({ params }: Props) {
  const session = await requireSession();
  const userId = session.user?.id;

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });

  if (!project) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{project.githubRepo}</p>
      </div>

      {/* Plugin Status Banner */}
      <div className="mb-6">
        <PluginStatusBadge projectId={project.id} />
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Column 1: Project Config */}
        <div>
          <ProjectDetail
            project={{
              id: project.id,
              name: project.name,
              githubRepo: project.githubRepo,
              githubBranch: project.githubBranch,
              githubFilePath: project.githubFilePath,
              syncMode: project.syncMode,
              pushMode: project.pushMode,
              defaultDirectory: project.defaultDirectory,
            }}
          />
        </div>

        {/* Column 2: Status Cards */}
        <div className="space-y-6">
          <FigmaStatusCard projectId={project.id} />
          <TokenStatusCard projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
