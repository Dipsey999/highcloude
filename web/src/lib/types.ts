/**
 * Types mirrored from the Figma plugin's src/types/messages.ts.
 * Keep in sync when plugin types change.
 */

export type SyncMode = 'single' | 'multi';
export type PushMode = 'direct' | 'pr';
export type FileMapping = Record<string, string>;

export interface ProjectConfig {
  name: string;
  githubRepo: string;
  githubBranch: string;
  githubFilePath: string;
  syncMode: SyncMode;
  pushMode: PushMode;
  fileMapping: FileMapping | null;
  defaultDirectory: string;
}

/** Shape returned to the Figma plugin from /api/plugin/config */
export interface PluginProject {
  id: string;
  name: string;
  githubRepo: string;
  githubBranch: string;
  githubFilePath: string;
  syncMode: SyncMode;
  pushMode: PushMode;
  fileMapping: FileMapping | null;
  defaultDirectory: string;
}

/** Shape returned to the Figma plugin from /api/plugin/keys */
export interface PluginKeys {
  claudeApiKey: string;
  githubToken: string;
}
