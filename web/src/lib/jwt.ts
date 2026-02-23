import { SignJWT, jwtVerify } from 'jose';

const ISSUER = 'claude-bridge';
const AUDIENCE = 'figma-plugin';
const EXPIRY = '24h';

function getSecret(): Uint8Array {
  const secret = process.env.PLUGIN_JWT_SECRET;
  if (!secret) {
    throw new Error('PLUGIN_JWT_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT for the Figma plugin.
 * Contains userId as subject, expires in 24 hours.
 */
export async function signPluginToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

/**
 * Verify a plugin JWT and return the userId.
 * Returns null if invalid or expired.
 */
export async function verifyPluginToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (!payload.sub) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}
