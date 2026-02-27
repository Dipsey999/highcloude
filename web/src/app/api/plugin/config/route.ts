import { NextRequest } from 'next/server';
import { verifyPluginToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { corsJson, corsOptions } from '@/lib/cors';
import { normalizeGithubRepo } from '@/lib/parse-repo';

// GET /api/plugin/config — fetch all projects for the plugin user (requires JWT)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return corsJson({ error: 'Missing authorization token' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const userId = await verifyPluginToken(token);
  if (!userId) {
    return corsJson({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      githubRepo: true,
      githubBranch: true,
      githubFilePath: true,
      syncMode: true,
      pushMode: true,
      fileMapping: true,
      defaultDirectory: true,
    },
  });

  // Normalize githubRepo for each project (handles legacy full-URL entries)
  const normalizedProjects = projects.map((p) => ({
    ...p,
    githubRepo: normalizeGithubRepo(p.githubRepo),
  }));

  return corsJson({ projects: normalizedProjects });
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return corsOptions();
}
