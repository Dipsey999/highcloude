import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { normalizeGithubRepo } from '@/lib/parse-repo';
import { buildTokenDocument, generateDocumentation } from '@/lib/design-system/token-builder';
import { buildDesignSystemConfigFromInput } from '@/lib/design-system/config-mapper';

// GET /api/projects/:id — get project details
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ project });
}

// PUT /api/projects/:id — update project
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const existing = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await req.json();
  const { name, githubRepo, githubBranch, githubFilePath, syncMode, pushMode, fileMapping, defaultDirectory, designSystem } = body;

  // Normalize repo if provided: "https://github.com/owner/repo.git" → "owner/repo"
  const normalizedRepo = githubRepo !== undefined ? normalizeGithubRepo(githubRepo) : undefined;

  // Build update data for base project fields
  const updateData: Record<string, unknown> = {
    ...(name !== undefined && { name }),
    ...(normalizedRepo !== undefined && { githubRepo: normalizedRepo }),
    ...(githubBranch !== undefined && { githubBranch }),
    ...(githubFilePath !== undefined && { githubFilePath }),
    ...(syncMode !== undefined && { syncMode }),
    ...(pushMode !== undefined && { pushMode }),
    ...(fileMapping !== undefined && { fileMapping }),
    ...(defaultDirectory !== undefined && { defaultDirectory }),
  };

  // Handle optional design system update
  if (designSystem) {
    updateData.designSystemName = designSystem.name || name || existing.name;
    updateData.designSystemSource = designSystem.source;
    updateData.designSystemDomain = designSystem.domain || 'tech';
    updateData.themeConfig = designSystem.themeConfig;
    updateData.typographyConfig = designSystem.typographyConfig;
    updateData.spacingConfig = designSystem.spacingConfig;
    updateData.componentConfig = designSystem.componentConfig;

    if (designSystem.source === 'scratch') {
      const projectName = name || existing.name;
      const dsConfig = buildDesignSystemConfigFromInput(designSystem, projectName);
      const generatedTokens = buildTokenDocument(dsConfig);
      const generatedDocs = generateDocumentation(dsConfig);

      updateData.tokensDocument = generatedTokens;
      updateData.documentation = generatedDocs;
    }
  }

  const project = await prisma.project.update({
    where: { id: params.id },
    data: updateData as Parameters<typeof prisma.project.update>[0]['data'],
  });

  return NextResponse.json({ project });
}

// DELETE /api/projects/:id — delete project
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  await prisma.project.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
