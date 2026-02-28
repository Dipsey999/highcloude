import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { buildTokenDocument, generateDocumentation } from '@/lib/design-system/token-builder';
import type { DesignSystemConfig } from '@/lib/design-system/token-builder';

// GET /api/design-systems/:id — get full design system
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const designSystem = await prisma.designSystem.findFirst({
    where: { id: params.id, userId },
  });

  if (!designSystem) {
    return NextResponse.json({ error: 'Design system not found' }, { status: 404 });
  }

  return NextResponse.json({ designSystem });
}

// PUT /api/design-systems/:id — update design system
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.designSystem.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Design system not found' }, { status: 404 });
  }

  const body = await req.json();
  const {
    name, domain, companyName, productName,
    colorConfig, typographyConfig, spacingConfig,
    radiusConfig, shadowConfig, componentConfig,
  } = body;

  // Rebuild tokens if any config changed
  const config: DesignSystemConfig = {
    name: name || existing.name,
    domain: domain || existing.domain,
    companyName: companyName ?? (existing.companyName as string | undefined),
    productName: productName ?? (existing.productName as string | undefined),
    color: colorConfig || existing.colorConfig,
    typography: typographyConfig || existing.typographyConfig,
    spacing: spacingConfig || existing.spacingConfig,
    radius: radiusConfig || existing.radiusConfig,
    shadows: shadowConfig || existing.shadowConfig,
    components: (componentConfig || existing.componentConfig as Record<string, unknown>)?.selectedComponents || [],
  };

  const tokensDocument = buildTokenDocument(config);
  const documentation = generateDocumentation(config);

  const designSystem = await prisma.designSystem.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(domain !== undefined && { domain }),
      ...(companyName !== undefined && { companyName }),
      ...(productName !== undefined && { productName }),
      ...(colorConfig !== undefined && { colorConfig }),
      ...(typographyConfig !== undefined && { typographyConfig }),
      ...(spacingConfig !== undefined && { spacingConfig }),
      ...(radiusConfig !== undefined && { radiusConfig }),
      ...(shadowConfig !== undefined && { shadowConfig }),
      ...(componentConfig !== undefined && { componentConfig }),
      tokensDocument: tokensDocument as any,
      documentation: documentation as any,
    },
  });

  return NextResponse.json({ designSystem });
}

// DELETE /api/design-systems/:id — delete design system
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.designSystem.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Design system not found' }, { status: 404 });
  }

  await prisma.designSystem.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
