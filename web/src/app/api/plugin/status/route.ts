import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';

// GET /api/plugin/status?projectId=xxx — check plugin online status for a project
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId query param required' }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: {
      pluginLastSeen: true,
      pluginFigmaFileName: true,
      pluginProjectId: true,
      figmaSnapshotAt: true,
      figmaFileName: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Determine online status: "online" if heartbeat within 2 minutes
  const TWO_MINUTES = 2 * 60 * 1000;
  const TEN_MINUTES = 10 * 60 * 1000;
  const now = Date.now();
  const lastSeen = project.pluginLastSeen ? project.pluginLastSeen.getTime() : 0;
  const elapsed = now - lastSeen;

  let status: 'online' | 'recent' | 'offline';
  if (elapsed < TWO_MINUTES) {
    status = 'online';
  } else if (elapsed < TEN_MINUTES) {
    status = 'recent';
  } else {
    status = 'offline';
  }

  return NextResponse.json({
    status,
    lastSeen: project.pluginLastSeen?.toISOString() ?? null,
    figmaFileName: project.pluginFigmaFileName ?? null,
    activeProjectId: project.pluginProjectId ?? null,
    lastSnapshotAt: project.figmaSnapshotAt?.toISOString() ?? null,
    snapshotFigmaFileName: project.figmaFileName ?? null,
  });
}
