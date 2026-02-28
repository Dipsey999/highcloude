import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ProjectTabs } from './ProjectTabs';

interface Props {
  params: { id: string };
  searchParams: { tab?: string; setup?: string };
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const session = await requireSession();
  const userId = session.user?.id;

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });

  if (!project) {
    notFound();
  }

  // Serialize the project data for the client component
  const serializedProject = {
    id: project.id,
    name: project.name,
    githubRepo: project.githubRepo,
    githubBranch: project.githubBranch,
    githubFilePath: project.githubFilePath,
    syncMode: project.syncMode,
    pushMode: project.pushMode,
    defaultDirectory: project.defaultDirectory,
    updatedAt: project.updatedAt.toISOString(),
    createdAt: project.createdAt.toISOString(),
    // Design system fields
    designSystemName: project.designSystemName,
    designSystemSource: project.designSystemSource,
    designSystemDomain: project.designSystemDomain,
    themeConfig: project.themeConfig as Record<string, any> | null,
    typographyConfig: project.typographyConfig as Record<string, any> | null,
    spacingConfig: project.spacingConfig as Record<string, any> | null,
    componentConfig: project.componentConfig as Record<string, any> | null,
    tokensDocument: project.tokensDocument as Record<string, any> | null,
    documentation: project.documentation as Record<string, any> | null,
    // Figma
    figmaSnapshot: project.figmaSnapshot ? true : false,
    figmaSnapshotAt: project.figmaSnapshotAt?.toISOString() ?? null,
    figmaFileName: project.figmaFileName,
  };

  return (
    <ProjectTabs
      project={serializedProject}
      initialTab={searchParams.tab || 'overview'}
      setup={searchParams.setup}
    />
  );
}
