import { validateClaudeKey, type ClaudeValidationResult } from './claude-client';
import { validateGitHubToken, type GitHubValidationResult } from './github-client';
import type { ConnectionState, CredentialPayload } from '../types/messages';
import { logger } from '../utils/logger';

export interface AuthValidationResult {
  claude: ClaudeValidationResult;
  github: GitHubValidationResult;
  connectionState: ConnectionState;
}

/** Validate both API credentials in parallel. */
export async function validateCredentials(
  credentials: CredentialPayload
): Promise<AuthValidationResult> {
  logger.info('Validating credentials...');

  const [claudeResult, githubResult] = await Promise.all([
    validateClaudeKey(credentials.claudeApiKey),
    validateGitHubToken(credentials.githubToken),
  ]);

  return {
    claude: claudeResult,
    github: githubResult,
    connectionState: {
      claude: claudeResult.valid ? 'connected' : 'error',
      github: githubResult.valid ? 'connected' : 'error',
    },
  };
}

/** Validate a single Claude key (for step-by-step UI flow). */
export async function validateClaudeOnly(
  apiKey: string
): Promise<ClaudeValidationResult> {
  return validateClaudeKey(apiKey);
}

/** Validate a single GitHub token (for step-by-step UI flow). */
export async function validateGitHubOnly(
  token: string
): Promise<GitHubValidationResult> {
  return validateGitHubToken(token);
}
