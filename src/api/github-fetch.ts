/**
 * GitHub fetch proxy.
 *
 * Figma plugin UI runs inside an iframe whose CSP blocks direct requests to
 * api.github.com. When a bridge connection is active, this module routes
 * GitHub API calls through the dashboard's /api/plugin/github-proxy endpoint,
 * which is accessible from the iframe.
 *
 * Usage:
 *   import { githubFetch, setGitHubProxy } from './github-fetch';
 *   // After bridge connects:
 *   setGitHubProxy('https://web-pied-iota-65.vercel.app', bridgeToken);
 *   // Then use githubFetch anywhere instead of fetch:
 *   const res = await githubFetch('https://api.github.com/repos/...', { headers: {...} });
 */

import { logger } from '../utils/logger';

let proxyConfig: { bridgeUrl: string; bridgeToken: string } | null = null;

/**
 * Configure the GitHub proxy. Call this when the bridge connection is established.
 */
export function setGitHubProxy(bridgeUrl: string, bridgeToken: string): void {
  proxyConfig = { bridgeUrl, bridgeToken };
  logger.info('GitHub proxy configured via bridge');
}

/**
 * Clear the GitHub proxy. Call this when the bridge connection is lost.
 */
export function clearGitHubProxy(): void {
  proxyConfig = null;
  logger.info('GitHub proxy cleared');
}

/**
 * Check if the proxy is active.
 */
export function isGitHubProxyActive(): boolean {
  return proxyConfig !== null;
}

/**
 * A drop-in replacement for fetch() that routes GitHub API calls through the
 * dashboard proxy when available.
 *
 * The returned object mimics the native Response interface so existing code
 * (`.ok`, `.status`, `.json()`, `.text()`) works unchanged.
 */
export async function githubFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  // If not a GitHub URL, always use direct fetch
  if (!url.startsWith('https://api.github.com/')) {
    return fetch(url, init);
  }

  // If no proxy configured, try direct fetch but catch CSP failures
  if (!proxyConfig) {
    try {
      return await fetch(url, init);
    } catch (err) {
      throw new Error(
        'GitHub API not reachable. Connect via Claude Bridge to enable GitHub sync.'
      );
    }
  }

  const proxyUrl = `${proxyConfig.bridgeUrl}/api/plugin/github-proxy`;

  // Extract headers as plain object
  const headersObj: Record<string, string> = {};
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((v, k) => { headersObj[k] = v; });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([k, v]) => { headersObj[k] = v; });
    } else {
      Object.assign(headersObj, init.headers);
    }
  }

  // Parse the body if it's a string (JSON)
  let bodyData: unknown = undefined;
  if (init?.body && typeof init.body === 'string') {
    try {
      bodyData = JSON.parse(init.body);
    } catch {
      bodyData = init.body;
    }
  }

  // Call the proxy
  const proxyRes = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${proxyConfig.bridgeToken}`,
    },
    body: JSON.stringify({
      url,
      method: init?.method || 'GET',
      headers: headersObj,
      body: bodyData,
    }),
  });

  if (!proxyRes.ok) {
    // Proxy itself failed (auth error, etc.)
    let errDetail = '';
    try {
      const errBody = await proxyRes.json();
      errDetail = errBody.error || '';
    } catch { /* ignore */ }
    throw new Error(`GitHub proxy error (${proxyRes.status}): ${errDetail || 'Request failed'}`);
  }

  // The proxy returns { status, data } where data is the raw response text
  const proxyData = (await proxyRes.json()) as { status: number; data: string; error?: string };

  if (proxyData.error) {
    throw new Error(proxyData.error);
  }

  // Construct a Response-like object that matches the original GitHub response
  const ghStatus = proxyData.status;
  const ghBody = proxyData.data;

  return new Response(ghBody, {
    status: ghStatus,
    headers: { 'Content-Type': 'application/json' },
  });
}
