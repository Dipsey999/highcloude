import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { tokensToCSSVariables, tokensToSCSSVariables } from '@/lib/design-system/token-builder';

// GET /api/projects/:id/export — export design system tokens in various formats
export async function GET(
  req: NextRequest,
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
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!project.tokensDocument) {
    return NextResponse.json({ error: 'No design system' }, { status: 404 });
  }

  const format = req.nextUrl.searchParams.get('format') || 'json';
  const tokens = project.tokensDocument as Record<string, unknown>;

  switch (format) {
    case 'css': {
      const css = tokensToCSSVariables(tokens);
      return new NextResponse(css, {
        headers: {
          'Content-Type': 'text/css',
          'Content-Disposition': 'attachment; filename="tokens.css"',
        },
      });
    }
    case 'scss': {
      const scss = tokensToSCSSVariables(tokens);
      return new NextResponse(scss, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="tokens.scss"',
        },
      });
    }
    default: {
      return new NextResponse(JSON.stringify(tokens, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="tokens.json"',
        },
      });
    }
  }
}
