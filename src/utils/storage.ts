import type { CredentialPayload, SyncConfig } from '../types/messages';
import { logger } from './logger';

const STORAGE_KEYS = {
  CREDENTIALS: 'claude-bridge:credentials',
  SYNC_CONFIG: 'claude-bridge:sync-config',
  BRIDGE_TOKEN: 'claude-bridge:bridge-token',
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
    if (data && typeof data === 'object' && ('githubToken' in data || 'claudeApiKey' in data)) {
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

// ========================================
// Sync Config Storage (Phase 7)
// ========================================

/** Save sync config to figma.clientStorage. */
export async function saveSyncConfig(config: SyncConfig): Promise<void> {
  try {
    await figma.clientStorage.setAsync(STORAGE_KEYS.SYNC_CONFIG, config);
    logger.info('Sync config saved to client storage');
  } catch (err) {
    logger.error('Failed to save sync config:', err);
    throw new Error('Failed to save sync config to storage');
  }
}

/** Load sync config from figma.clientStorage. Returns null if none stored. */
export async function loadSyncConfig(): Promise<SyncConfig | null> {
  try {
    const data = await figma.clientStorage.getAsync(STORAGE_KEYS.SYNC_CONFIG);
    if (data && typeof data === 'object' && 'syncMode' in data) {
      logger.info('Sync config loaded from client storage');
      return data as SyncConfig;
    }
    logger.info('No sync config found in client storage');
    return null;
  } catch (err) {
    logger.error('Failed to load sync config:', err);
    return null;
  }
}

// ========================================
// Bridge Token Storage (Phase 8: Web Bridge)
// ========================================

/** Save bridge JWT token to figma.clientStorage. */
export async function saveBridgeToken(token: string): Promise<void> {
  try {
    await figma.clientStorage.setAsync(STORAGE_KEYS.BRIDGE_TOKEN, token);
    logger.info('Bridge token saved to client storage');
  } catch (err) {
    logger.error('Failed to save bridge token:', err);
    throw new Error('Failed to save bridge token to storage');
  }
}

/** Load bridge JWT token from figma.clientStorage. Returns null if none stored. */
export async function loadBridgeToken(): Promise<string | null> {
  try {
    const data = await figma.clientStorage.getAsync(STORAGE_KEYS.BRIDGE_TOKEN);
    if (data && typeof data === 'string') {
      logger.info('Bridge token loaded from client storage');
      return data;
    }
    logger.info('No bridge token found in client storage');
    return null;
  } catch (err) {
    logger.error('Failed to load bridge token:', err);
    return null;
  }
}

/** Remove stored bridge token. */
export async function clearBridgeToken(): Promise<void> {
  try {
    await figma.clientStorage.deleteAsync(STORAGE_KEYS.BRIDGE_TOKEN);
    logger.info('Bridge token cleared from client storage');
  } catch (err) {
    logger.error('Failed to clear bridge token:', err);
    throw new Error('Failed to clear bridge token from storage');
  }
}
