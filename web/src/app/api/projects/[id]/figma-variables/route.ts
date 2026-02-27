import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { verifyPluginToken } from '@/lib/jwt';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { corsJson, corsOptions } from '@/lib/cors';

// POST /api/projects/:id/figma-variables — plugin pushes Figma variable snapshot
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth: Plugin JWT
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return corsJson({ error: 'Missing authorization token' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const userId = await verifyPluginToken(token);
  if (!userId) {
    return corsJson({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Verify project belongs to user
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });

  if (!project) {
    return corsJson({ error: 'Project not found' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return corsJson({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Expect RawExtractionResult shape: { variables, textStyles, effectStyles, figmaFileName }
  const { figmaFileName, ...snapshot } = body;

  await prisma.project.update({
    where: { id: params.id },
    data: {
      figmaSnapshot: snapshot as Prisma.InputJsonValue,
      figmaSnapshotAt: new Date(),
      figmaFileName: typeof figmaFileName === 'string' ? figmaFileName : null,
    },
  });

  return corsJson({
    ok: true,
    snapshotAt: new Date().toISOString(),
  });
}

// GET /api/projects/:id/figma-variables — dashboard fetches stored snapshot
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth: Session (web dashboard)
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
    select: {
      figmaSnapshot: true,
      figmaSnapshotAt: true,
      figmaFileName: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (!project.figmaSnapshot) {
    return NextResponse.json({
      snapshot: null,
      snapshotAt: null,
      figmaFileName: null,
      message: 'No Figma variables snapshot yet. Use the plugin to push variables.',
    });
  }

  return NextResponse.json({
    snapshot: project.figmaSnapshot,
    snapshotAt: project.figmaSnapshotAt?.toISOString() ?? null,
    figmaFileName: project.figmaFileName ?? null,
  });
}

// OPTIONS — CORS preflight (for plugin POST)
export async function OPTIONS() {
  return corsOptions();
}
