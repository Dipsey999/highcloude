import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { tokensToCSSVariables, tokensToSCSSVariables } from '@/lib/design-system/token-builder';

// GET /api/design-systems/:id/export?format=dtcg|css|scss
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const designSystem = await prisma.designSystem.findFirst({
    where: { id: params.id, userId },
    select: { name: true, tokensDocument: true },
  });

  if (!designSystem) {
    return NextResponse.json({ error: 'Design system not found' }, { status: 404 });
  }

  if (!designSystem.tokensDocument) {
    return NextResponse.json({ error: 'No tokens generated yet' }, { status: 400 });
  }

  const format = req.nextUrl.searchParams.get('format') || 'dtcg';
  const tokenDoc = designSystem.tokensDocument as Record<string, unknown>;
  const safeName = designSystem.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  switch (format) {
    case 'css': {
      const css = tokensToCSSVariables(tokenDoc);
      return new NextResponse(css, {
        headers: {
          'Content-Type': 'text/css',
          'Content-Disposition': `attachment; filename="${safeName}-tokens.css"`,
        },
      });
    }

    case 'scss': {
      const scss = tokensToSCSSVariables(tokenDoc);
      return new NextResponse(scss, {
        headers: {
          'Content-Type': 'text/x-scss',
          'Content-Disposition': `attachment; filename="${safeName}-tokens.scss"`,
        },
      });
    }

    case 'dtcg':
    default: {
      const json = JSON.stringify(tokenDoc, null, 2);
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${safeName}-tokens.json"`,
        },
      });
    }
  }
}
