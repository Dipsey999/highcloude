import { NextRequest } from 'next/server';
import { verifyPluginToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { corsJson, corsOptions } from '@/lib/cors';

// POST /api/plugin/heartbeat — plugin sends a heartbeat to report status
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return corsJson({ error: 'Missing authorization token' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const userId = await verifyPluginToken(token);
  if (!userId) {
    return corsJson({ error: 'Invalid or expired token' }, { status: 401 });
  }

  let body: { projectId?: string; figmaFileName?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is OK — heartbeat can be bare
  }

  const { projectId, figmaFileName } = body;
  const now = new Date();

  if (projectId) {
    // Verify the project belongs to this user before updating
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (project) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          pluginLastSeen: now,
          pluginFigmaFileName: figmaFileName ?? null,
          pluginProjectId: projectId,
        },
      });
    }
  }

  return corsJson({ ok: true, timestamp: now.toISOString() });
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return corsOptions();
}
