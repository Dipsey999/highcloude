import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ProjectDetail } from './ProjectDetail';
import { TokenViewer } from '@/components/TokenViewer';

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <p className="mt-1 text-sm text-gray-500">{project.githubRepo}</p>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left column: Config */}
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
        {/* Right column: Tokens from GitHub */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Design Tokens</h2>
          <TokenViewer projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
