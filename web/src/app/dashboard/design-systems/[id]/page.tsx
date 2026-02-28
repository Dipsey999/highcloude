import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { DesignSystemDetail } from '@/components/DesignSystemDetail';

export default async function DesignSystemDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireSession();
  const userId = session.user?.id;

  const designSystem = await prisma.designSystem.findFirst({
    where: { id: params.id, userId },
  });

  if (!designSystem) {
    notFound();
  }

  // Serialize dates and JSON for client component
  const data = {
    ...designSystem,
    createdAt: designSystem.createdAt.toISOString(),
    updatedAt: designSystem.updatedAt.toISOString(),
    colorConfig: designSystem.colorConfig as Record<string, unknown>,
    typographyConfig: designSystem.typographyConfig as Record<string, unknown>,
    spacingConfig: designSystem.spacingConfig as Record<string, unknown>,
    radiusConfig: designSystem.radiusConfig as Record<string, unknown>,
    shadowConfig: designSystem.shadowConfig as Record<string, unknown>,
    componentConfig: designSystem.componentConfig as Record<string, unknown>,
    tokensDocument: (designSystem.tokensDocument || {}) as Record<string, unknown>,
    documentation: (designSystem.documentation || {}) as Record<string, unknown>,
  };

  return <DesignSystemDetail data={data as any} />;
}
