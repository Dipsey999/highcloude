import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { buildTokenDocument, generateDocumentation } from '@/lib/design-system/token-builder';
import { buildDesignSystemConfigFromInput } from '@/lib/design-system/config-mapper';

// POST /api/projects/:id/design-system — create/attach a design system to a project
export async function POST(
  req: NextRequest,
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

  const designSystem = await req.json();

  if (!designSystem.source) {
    return NextResponse.json({ error: 'Design system source is required' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    designSystemName: designSystem.name || project.name,
    designSystemSource: designSystem.source,
    designSystemDomain: designSystem.domain || 'tech',
    themeConfig: designSystem.themeConfig,
    typographyConfig: designSystem.typographyConfig,
    spacingConfig: designSystem.spacingConfig,
    componentConfig: designSystem.componentConfig,
  };

  if (designSystem.source === 'scratch') {
    const dsConfig = buildDesignSystemConfigFromInput(designSystem, project.name);
    const generatedTokens = buildTokenDocument(dsConfig);
    const generatedDocs = generateDocumentation(dsConfig);

    updateData.tokensDocument = generatedTokens;
    updateData.documentation = generatedDocs;
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: updateData as Parameters<typeof prisma.project.update>[0]['data'],
  });

  return NextResponse.json({ project: updated }, { status: 201 });
}

// PUT /api/projects/:id/design-system — update design system config and regenerate tokens
export async function PUT(
  req: NextRequest,
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

  const partialDesignSystem = await req.json();

  // Merge incoming partial config with existing project values
  const existingThemeConfig = (project as Record<string, unknown>).themeConfig as Record<string, unknown> | null;
  const existingTypographyConfig = (project as Record<string, unknown>).typographyConfig as Record<string, unknown> | null;
  const existingSpacingConfig = (project as Record<string, unknown>).spacingConfig as Record<string, unknown> | null;
  const existingComponentConfig = (project as Record<string, unknown>).componentConfig as Record<string, unknown> | null;

  const mergedDesignSystem = {
    name: partialDesignSystem.name || (project as Record<string, unknown>).designSystemName || project.name,
    source: partialDesignSystem.source || (project as Record<string, unknown>).designSystemSource || 'scratch',
    domain: partialDesignSystem.domain || (project as Record<string, unknown>).designSystemDomain || 'tech',
    themeConfig: {
      ...(existingThemeConfig || {}),
      ...(partialDesignSystem.themeConfig || {}),
    },
    typographyConfig: {
      ...(existingTypographyConfig || {}),
      ...(partialDesignSystem.typographyConfig || {}),
    },
    spacingConfig: {
      ...(existingSpacingConfig || {}),
      ...(partialDesignSystem.spacingConfig || {}),
    },
    componentConfig: {
      ...(existingComponentConfig || {}),
      ...(partialDesignSystem.componentConfig || {}),
    },
  };

  const updateData: Record<string, unknown> = {
    designSystemName: mergedDesignSystem.name,
    designSystemSource: mergedDesignSystem.source,
    designSystemDomain: mergedDesignSystem.domain,
    themeConfig: mergedDesignSystem.themeConfig,
    typographyConfig: mergedDesignSystem.typographyConfig,
    spacingConfig: mergedDesignSystem.spacingConfig,
    componentConfig: mergedDesignSystem.componentConfig,
  };

  // Regenerate tokens if source is scratch
  if (mergedDesignSystem.source === 'scratch') {
    const dsConfig = buildDesignSystemConfigFromInput(
      mergedDesignSystem as Parameters<typeof buildDesignSystemConfigFromInput>[0],
      mergedDesignSystem.name as string,
    );
    const generatedTokens = buildTokenDocument(dsConfig);
    const generatedDocs = generateDocumentation(dsConfig);

    updateData.tokensDocument = generatedTokens;
    updateData.documentation = generatedDocs;
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: updateData as Parameters<typeof prisma.project.update>[0]['data'],
  });

  return NextResponse.json({ project: updated });
}

// DELETE /api/projects/:id/design-system — remove design system from project
export async function DELETE(
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

  await prisma.project.update({
    where: { id: params.id },
    data: {
      designSystemName: null,
      designSystemSource: null,
      designSystemDomain: null,
      themeConfig: Prisma.DbNull,
      typographyConfig: Prisma.DbNull,
      spacingConfig: Prisma.DbNull,
      componentConfig: Prisma.DbNull,
      tokensDocument: Prisma.DbNull,
      documentation: Prisma.DbNull,
    },
  });

  return NextResponse.json({ success: true });
}
