import { NextRequest } from 'next/server';
import { verifyPluginToken } from '@/lib/jwt';
import { corsJson, corsOptions } from '@/lib/cors';

const ALLOWED_GITHUB_PREFIX = 'https://api.github.com/';

/**
 * POST /api/plugin/github-proxy
 *
 * Proxies GitHub API requests from the Figma plugin iframe,
 * which cannot directly fetch api.github.com due to CSP restrictions.
 *
 * Body: { url, method, headers, body? }
 * Auth: Bearer <bridgeToken>
 */
export async function POST(req: NextRequest) {
  // Authenticate via bridge token
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return corsJson({ error: 'Missing authorization token' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const userId = await verifyPluginToken(token);
  if (!userId) {
    return corsJson({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Parse the proxy request
  let body: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return corsJson({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { url, method, headers: ghHeaders, body: ghBody } = body;

  // Security: only allow requests to api.github.com
  if (!url || !url.startsWith(ALLOWED_GITHUB_PREFIX)) {
    return corsJson(
      { error: 'Only requests to https://api.github.com/ are allowed' },
      { status: 403 }
    );
  }

  try {
    // Forward the request to GitHub
    const ghRes = await fetch(url, {
      method: method || 'GET',
      headers: {
        ...ghHeaders,
        // Ensure JSON content type for requests with bodies
        ...(ghBody ? { 'Content-Type': 'application/json' } : {}),
      },
      body: ghBody ? JSON.stringify(ghBody) : undefined,
    });

    // Read the response
    const responseText = await ghRes.text();

    // Return with CORS headers and original status code
    return corsJson(
      { status: ghRes.status, data: responseText },
      { status: 200 }
    );
  } catch (err) {
    return corsJson(
      { error: `GitHub proxy error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return corsOptions();
}
