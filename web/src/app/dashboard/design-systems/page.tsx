import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { DesignSystemCard } from '@/components/DesignSystemCard';
import { EmptyState } from '@/components/EmptyState';
import { PlusIcon, PaletteIcon } from '@/components/Icons';

export default async function DesignSystemsPage() {
  const session = await requireSession();
  const userId = session.user?.id;

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
      updatedAt: true,
    },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Design Systems
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Create and manage complete design systems with tokens, components, and documentation.
          </p>
        </div>
        {designSystems.length > 0 && (
          <a
            href="/dashboard/design-systems/new"
            className="btn-gradient flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            New Design System
          </a>
        )}
      </div>

      {designSystems.length === 0 ? (
        <EmptyState
          icon={<PaletteIcon className="h-6 w-6" />}
          title="No design systems yet"
          description="Create your first design system with intelligent color, typography, and component suggestions."
          actionLabel="Create Design System"
          actionHref="/dashboard/design-systems/new"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designSystems.map((ds) => (
            <DesignSystemCard
              key={ds.id}
              id={ds.id}
              name={ds.name}
              domain={ds.domain}
              companyName={ds.companyName}
              colorConfig={ds.colorConfig as { primaryColor?: string }}
              componentConfig={ds.componentConfig as { selectedComponents?: string[] }}
              updatedAt={ds.updatedAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
