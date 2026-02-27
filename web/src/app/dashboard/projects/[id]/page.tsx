import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ProjectDetail } from './ProjectDetail';
import { TokenViewer } from '@/components/TokenViewer';
import { FigmaVariablesViewer } from '@/components/FigmaVariablesViewer';
import { PluginStatusBadge } from '@/components/PluginStatusBadge';
import { PaletteIcon, DatabaseIcon } from '@/components/Icons';

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

      {/* Plugin Status Banner — full width */}
      <div className="mb-6">
        <PluginStatusBadge projectId={project.id} />
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Column 1: Project Config */}
        <div className="lg:col-span-1">
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

        {/* Column 2: Figma Local Variables */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-md"
              style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-hover))' }}
            >
              <PaletteIcon className="h-3.5 w-3.5 text-white" />
            </span>
            Figma Variables
          </h2>
          <FigmaVariablesViewer projectId={project.id} />
        </div>

        {/* Column 3: GitHub Design Tokens */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-md"
              style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-hover))' }}
            >
              <DatabaseIcon className="h-3.5 w-3.5 text-white" />
            </span>
            GitHub Design Tokens
          </h2>
          <TokenViewer projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
