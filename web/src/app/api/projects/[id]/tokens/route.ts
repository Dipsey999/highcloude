import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { normalizeGithubRepo } from '@/lib/parse-repo';

// GET /api/projects/:id/tokens — fetch tokens.json from GitHub
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

  // Get the user's GitHub token
  const apiKeys = await prisma.apiKeys.findUnique({
    where: { userId },
  });

  if (!apiKeys?.githubTokenEnc) {
    return NextResponse.json(
      { error: 'GitHub token not configured. Add it in API Keys settings.' },
      { status: 400 }
    );
  }

  let githubToken: string;
  try {
    githubToken = decrypt(apiKeys.githubTokenEnc);
  } catch {
    return NextResponse.json(
      { error: 'Failed to decrypt GitHub token' },
      { status: 500 }
    );
  }

  // Fetch the file from GitHub API
  const { githubBranch, githubFilePath } = project;
  const githubRepo = normalizeGithubRepo(project.githubRepo);
  const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${githubFilePath}?ref=${githubBranch}`;

  try {
    const ghRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (ghRes.status === 404) {
      // File doesn't exist yet — return empty state
      return NextResponse.json({
        tokens: null,
        message: 'Token file not found in repository. Sync from Figma to create it.',
      });
    }

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      return NextResponse.json(
        { error: `GitHub API error: ${ghRes.status} ${errText}` },
        { status: 502 }
      );
    }

    const ghData = await ghRes.json();

    // Decode the base64 content
    const content = Buffer.from(ghData.content, 'base64').toString('utf-8');
    let tokenDocument: Record<string, unknown>;
    try {
      tokenDocument = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: 'Token file is not valid JSON' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      tokens: tokenDocument,
      sha: ghData.sha,
      lastModified: ghData.commit?.committer?.date || null,
      filePath: githubFilePath,
      repo: githubRepo,
      branch: githubBranch,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch from GitHub: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}
