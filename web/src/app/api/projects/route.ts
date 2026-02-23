import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';

// GET /api/projects — list user's projects
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ projects });
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, githubRepo, githubBranch, githubFilePath, syncMode, pushMode, fileMapping, defaultDirectory } = body;

  if (!name || !githubRepo) {
    return NextResponse.json({ error: 'Name and GitHub repo are required' }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      userId,
      name,
      githubRepo,
      githubBranch: githubBranch || 'main',
      githubFilePath: githubFilePath || 'tokens.json',
      syncMode: syncMode || 'single',
      pushMode: pushMode || 'direct',
      fileMapping: fileMapping || {},
      defaultDirectory: defaultDirectory || 'tokens/',
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
