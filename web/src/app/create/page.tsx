import { getSessionUserId } from '@/lib/session';
import { CreateFlow } from '@/components/create/CreateFlow';

export const metadata = {
  title: 'Create Your Design System — Cosmikit',
  description: 'Tell us about your product and get a complete, AI-generated design system in minutes.',
};

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ restore?: string }>;
}) {
  const userId = await getSessionUserId();
  const params = await searchParams;

  return (
    <main
      className="hero-mesh min-h-[calc(100vh-3.5rem)]"
      style={{ background: 'var(--bg-primary)' }}
    >
      <CreateFlow
        isAuthenticated={!!userId}
        restoreMode={params.restore === 'true'}
      />
    </main>
  );
}
