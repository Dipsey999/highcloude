import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { TokensComparisonPage } from '@/components/TokensComparisonPage';

export default async function TokensPage() {
  const session = await requireSession();
  const userId = session.user?.id;

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, githubRepo: true },
  });

  return <TokensComparisonPage projects={projects} />;
}
