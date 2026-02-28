import { requireSession } from '@/lib/session';
import { DesignSystemWizard } from '@/components/DesignSystemWizard';

export default async function NewDesignSystemPage() {
  await requireSession();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Create Design System
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Build a complete design system with colors, typography, spacing, and component tokens.
        </p>
      </div>

      <DesignSystemWizard />
    </div>
  );
}
