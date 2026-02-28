import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import type { GeneratedDesignSystem } from '@/lib/ai/types';

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in first.' }, { status: 401 });
  }

  let body: {
    designSystem?: GeneratedDesignSystem;
    productDescription?: string;
    productVibe?: string;
    brandReferences?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { designSystem, productDescription, productVibe, brandReferences } = body;

  if (!designSystem || !designSystem.tokensDocument) {
    return NextResponse.json(
      { error: 'A valid design system is required.' },
      { status: 400 },
    );
  }

  try {
    const project = await prisma.project.create({
      data: {
        userId,
        name: designSystem.name || 'My Design System',
        githubRepo: '',
        githubBranch: 'main',
        githubFilePath: 'tokens.json',
        syncMode: 'single',
        pushMode: 'direct',
        defaultDirectory: 'tokens/',
        designSystemName: designSystem.name,
        designSystemSource: 'ai-generated',
        designSystemDomain: designSystem.config.domain,
        themeConfig: {
          accentColor: designSystem.config.color.primaryColor,
          paletteMode: designSystem.config.color.paletteMode,
          radius: 'medium',
        },
        typographyConfig: designSystem.config.typography,
        spacingConfig: designSystem.config.spacing,
        componentConfig: { selectedComponents: designSystem.config.components },
        tokensDocument: designSystem.tokensDocument as unknown as Record<string, never>,
        documentation: designSystem.documentation as unknown as Record<string, never>,
        productDescription: productDescription || null,
        productDomain: designSystem.config.domain,
        productVibe: productVibe || null,
        brandReferences: brandReferences || null,
        designPhilosophy: designSystem.philosophy,
        designPrinciples: designSystem.principles,
        layoutConfig: designSystem.layoutConfig,
        version: 1,
      },
    });

    return NextResponse.json({ project: { id: project.id, name: project.name } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to save design system:', message);
    return NextResponse.json(
      { error: 'Failed to save design system. Please try again.' },
      { status: 500 },
    );
  }
}
