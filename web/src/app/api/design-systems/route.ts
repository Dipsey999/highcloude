import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { buildTokenDocument, generateDocumentation } from '@/lib/design-system/token-builder';
import type { DesignSystemConfig } from '@/lib/design-system/token-builder';

// GET /api/design-systems — list user's design systems
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const designSystems = await prisma.designSystem.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      domain: true,
      companyName: true,
      productName: true,
      colorConfig: true,
      componentConfig: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ designSystems });
}

// POST /api/design-systems — create a new design system
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    name, domain, companyName, productName,
    colorConfig, typographyConfig, spacingConfig,
    radiusConfig, shadowConfig, componentConfig,
  } = body;

  if (!name || !domain || !colorConfig) {
    return NextResponse.json({ error: 'Name, domain, and color config are required' }, { status: 400 });
  }

  // Build the full DTCG token document
  const config: DesignSystemConfig = {
    name,
    domain,
    companyName,
    productName,
    color: colorConfig,
    typography: typographyConfig,
    spacing: spacingConfig,
    radius: radiusConfig,
    shadows: shadowConfig,
    components: componentConfig.selectedComponents || [],
  };

  const tokensDocument = buildTokenDocument(config);
  const documentation = generateDocumentation(config);

  const designSystem = await prisma.designSystem.create({
    data: {
      userId,
      name,
      domain,
      companyName: companyName || null,
      productName: productName || null,
      colorConfig,
      typographyConfig,
      spacingConfig,
      radiusConfig,
      shadowConfig,
      componentConfig,
      tokensDocument: tokensDocument as any,
      documentation: documentation as any,
    },
  });

  return NextResponse.json({ designSystem }, { status: 201 });
}
