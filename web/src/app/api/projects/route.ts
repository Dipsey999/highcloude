import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { normalizeGithubRepo } from '@/lib/parse-repo';
import { buildTokenDocument, generateDocumentation } from '@/lib/design-system/token-builder';
import { buildDesignSystemConfigFromInput } from '@/lib/design-system/config-mapper';

// GET /api/projects — list user's projects
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ projects });
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, githubRepo, githubBranch, githubFilePath, syncMode, pushMode, fileMapping, defaultDirectory, designSystem } = body;

  if (!name || !githubRepo) {
    return NextResponse.json({ error: 'Name and GitHub repo are required' }, { status: 400 });
  }

  // Normalize repo: "https://github.com/owner/repo.git" → "owner/repo"
  const normalizedRepo = normalizeGithubRepo(githubRepo);

  // Build base project data
  const projectData: Record<string, unknown> = {
    userId,
    name,
    githubRepo: normalizedRepo,
    githubBranch: githubBranch || 'main',
    githubFilePath: githubFilePath || 'tokens.json',
    syncMode: syncMode || 'single',
    pushMode: pushMode || 'direct',
    fileMapping: fileMapping || {},
    defaultDirectory: defaultDirectory || 'tokens/',
  };

  // Handle optional design system
  if (designSystem) {
    projectData.designSystemName = designSystem.name || name;
    projectData.designSystemSource = designSystem.source;
    projectData.designSystemDomain = designSystem.domain || 'tech';
    projectData.themeConfig = designSystem.themeConfig;
    projectData.typographyConfig = designSystem.typographyConfig;
    projectData.spacingConfig = designSystem.spacingConfig;
    projectData.componentConfig = designSystem.componentConfig;

    if (designSystem.source === 'scratch') {
      const dsConfig = buildDesignSystemConfigFromInput(designSystem, name);
      const generatedTokens = buildTokenDocument(dsConfig);
      const generatedDocs = generateDocumentation(dsConfig);

      projectData.tokensDocument = generatedTokens;
      projectData.documentation = generatedDocs;
    }
  }

  const project = await prisma.project.create({
    data: projectData as Parameters<typeof prisma.project.create>[0]['data'],
  });

  return NextResponse.json({ project }, { status: 201 });
}
