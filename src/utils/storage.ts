import type { CredentialPayload } from '../types/messages';
import { logger } from './logger';

const STORAGE_KEYS = {
  CREDENTIALS: 'claude-bridge:credentials',
} as const;

/** Save credentials to figma.clientStorage (per-user, persistent). */
export async function saveCredentials(
  credentials: CredentialPayload
): Promise<void> {
  try {
    await figma.clientStorage.setAsync(STORAGE_KEYS.CREDENTIALS, credentials);
    logger.info('Credentials saved to client storage');
  } catch (err) {
    logger.error('Failed to save credentials:', err);
    throw new Error('Failed to save credentials to storage');
  }
}

/** Load credentials from figma.clientStorage. Returns null if none stored. */
export async function loadCredentials(): Promise<CredentialPayload | null> {
  try {
    const data = await figma.clientStorage.getAsync(STORAGE_KEYS.CREDENTIALS);
    if (data && typeof data === 'object' && 'claudeApiKey' in data) {
      logger.info('Credentials loaded from client storage');
      return data as CredentialPayload;
    }
    logger.info('No credentials found in client storage');
    return null;
  } catch (err) {
    logger.error('Failed to load credentials:', err);
    return null;
  }
}

/** Remove stored credentials. */
export async function clearCredentials(): Promise<void> {
  try {
    await figma.clientStorage.deleteAsync(STORAGE_KEYS.CREDENTIALS);
    logger.info('Credentials cleared from client storage');
  } catch (err) {
    logger.error('Failed to clear credentials:', err);
    throw new Error('Failed to clear credentials from storage');
  }
}
