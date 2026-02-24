import { validateGitHubToken, type GitHubValidationResult } from './github-client';
import type { ConnectionState, CredentialPayload } from '../types/messages';
import { logger } from '../utils/logger';

export interface AuthValidationResult {
  github: GitHubValidationResult;
  connectionState: ConnectionState;
}

/** Validate credentials (GitHub token only — Claude uses free MCP). */
export async function validateCredentials(
  credentials: CredentialPayload
): Promise<AuthValidationResult> {
  logger.info('Validating credentials...');

  const githubResult = await validateGitHubToken(credentials.githubToken);

  return {
    github: githubResult,
    connectionState: {
      github: githubResult.valid ? 'connected' : 'error',
    },
  };
}

/** Validate a single GitHub token (for step-by-step UI flow). */
export async function validateGitHubOnly(
  token: string
): Promise<GitHubValidationResult> {
  return validateGitHubToken(token);
}
