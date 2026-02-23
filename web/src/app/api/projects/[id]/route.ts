import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';

// GET /api/projects/:id — get project details
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ project });
}

// PUT /api/projects/:id — update project
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const existing = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await req.json();
  const { name, githubRepo, githubBranch, githubFilePath, syncMode, pushMode, fileMapping, defaultDirectory } = body;

  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(githubRepo !== undefined && { githubRepo }),
      ...(githubBranch !== undefined && { githubBranch }),
      ...(githubFilePath !== undefined && { githubFilePath }),
      ...(syncMode !== undefined && { syncMode }),
      ...(pushMode !== undefined && { pushMode }),
      ...(fileMapping !== undefined && { fileMapping }),
      ...(defaultDirectory !== undefined && { defaultDirectory }),
    },
  });

  return NextResponse.json({ project });
}

// DELETE /api/projects/:id — delete project
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  await prisma.project.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
