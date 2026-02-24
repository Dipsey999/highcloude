import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { DesignTokensDocument, DesignSpecNode } from '../../types/messages';
import { sendToCode, onCodeMessage } from '../../utils/message-bus';
import { flattenTokensForPrompt, buildSystemPrompt, buildUserMessage } from '../../api/prompt-builder';
import { generateDesign } from '../../api/claude-client';
import { showToast } from '../components/Toast';

type GenerateState = 'idle' | 'generating' | 'complete' | 'error';

interface GenerateViewProps {
  apiKey?: string;
  tokensDocument: DesignTokensDocument | null;
}

export function GenerateView({ apiKey, tokensDocument }: GenerateViewProps) {
  const [state, setState] = useState<GenerateState>('idle');
  const [prompt, setPrompt] = useState('');
  const [streamOutput, setStreamOutput] = useState('');
  const [parsedSpec, setParsedSpec] = useState<DesignSpecNode | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [creationProgress, setCreationProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLPreElement>(null);

  // Count available tokens
  const tokenCount = tokensDocument
    ? flattenTokensForPrompt(tokensDocument).length
    : 0;

  // Listen for design creation messages from code.ts
  useEffect(() => {
    const unsubscribe = onCodeMessage((msg) => {
      if (msg.type === 'DESIGN_CREATED') {
        setIsApplying(false);
        setCreationProgress(null);
        const { result } = msg;
        if (result.errors.length > 0) {
          showToast(
            `Design created with ${result.errors.length} warning(s)`,
            'info',
          );
        } else {
          showToast(
            `Design "${result.nodeName}" created (${result.childCount} children)`,
            'success',
          );
        }
      }
      if (msg.type === 'DESIGN_CREATION_PROGRESS') {
        setCreationProgress({ stage: msg.stage, percent: msg.percent });
      }
    });
    return unsubscribe;
  }, []);

  // Auto-scroll output during streaming
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamOutput]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      showToast('Enter a design prompt', 'info');
      return;
    }
    if (!apiKey) {
      showToast('No Claude API key. Use Claude MCP for free AI design.', 'info');
      return;
    }

    // Reset state
    setState('generating');
    setStreamOutput('');
    setParsedSpec(null);
    setParseError(null);
    setCreationProgress(null);

    // Build prompts
    const tokenLines = tokensDocument ? flattenTokensForPrompt(tokensDocument) : [];
    const systemPrompt = buildSystemPrompt(tokenLines);
    const userMsg = buildUserMessage(prompt.trim());

    // Create abort controller for cancellation
    const abort = new AbortController();
    abortRef.current = abort;

    generateDesign(
      apiKey,
      systemPrompt,
      userMsg,
      {
        onChunk: (text) => {
          setStreamOutput((prev) => prev + text);
        },
        onComplete: (fullText) => {
          abortRef.current = null;
          // Try to parse the JSON
          const parsed = tryParseDesignSpec(fullText);
          if (parsed.spec) {
            setParsedSpec(parsed.spec);
            setState('complete');
            showToast('Design spec generated!', 'success');
          } else {
            setParseError(parsed.error ?? 'Unknown parse error');
            setState('error');
            showToast('Could not parse design spec', 'error');
          }
        },
        onError: (error) => {
          abortRef.current = null;
          setParseError(error);
          setState('error');
          showToast(`Generation failed: ${error}`, 'error');
        },
      },
      abort.signal,
    );
  }, [prompt, apiKey, tokensDocument]);

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setState('idle');
    showToast('Generation cancelled', 'info');
  }, []);

  const handleApply = useCallback(() => {
    if (!parsedSpec) return;

    setIsApplying(true);
    setCreationProgress(null);
    sendToCode({ type: 'CREATE_DESIGN', spec: parsedSpec });
  }, [parsedSpec]);

  const handleReset = useCallback(() => {
    setState('idle');
    setStreamOutput('');
    setParsedSpec(null);
    setParseError(null);
    setCreationProgress(null);
    setIsApplying(false);
  }, []);

  return (
    <div class="generate-view">
      {/* Prompt Input */}
      <div class="generate-input-group">
        <textarea
          class="generate-textarea"
          placeholder="Describe a UI component... e.g. 'A card with a profile avatar, name, and email'"
          value={prompt}
          onInput={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
          disabled={state === 'generating'}
          rows={3}
        />

        {/* Token context badge */}
        <div class="generate-context-badge">
          {tokenCount > 0
            ? `${tokenCount} tokens available`
            : 'No tokens loaded'}
        </div>
      </div>

      {/* Actions */}
      <div class="generate-actions">
        {state === 'generating' ? (
          <button class="btn btn-danger" style={{ width: '100%' }} onClick={handleCancel}>
            Cancel
          </button>
        ) : (
          <button
            class="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleGenerate}
            disabled={!prompt.trim() || isApplying}
          >
            Generate Design
          </button>
        )}
      </div>

      {/* Streaming Output */}
      {(streamOutput || state === 'generating') && (
        <div class="generate-output">
          <div class="generate-output-header">
            <span>Claude Output</span>
            {state === 'generating' && <span class="generate-streaming-dot" />}
          </div>
          <pre class="generate-output-content" ref={outputRef}>
            {streamOutput || 'Waiting for response...'}
          </pre>
        </div>
      )}

      {/* Parse Error */}
      {parseError && state === 'error' && (
        <div class="generate-error">
          <strong>Error:</strong> {parseError}
        </div>
      )}

      {/* Apply to Canvas */}
      {parsedSpec && !isApplying && (
        <div class="generate-actions">
          <button
            class="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleApply}
          >
            Apply to Canvas
          </button>
          <button
            class="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={handleReset}
          >
            Start Over
          </button>
        </div>
      )}

      {/* Creation Progress */}
      {isApplying && creationProgress && (
        <div class="extraction-progress">
          <div class="progress-bar">
            <div class="progress-fill" style={{ width: `${creationProgress.percent}%` }} />
          </div>
          <span class="progress-label">{creationProgress.stage}</span>
        </div>
      )}

      {/* Applying state (without progress data) */}
      {isApplying && !creationProgress && (
        <button class="btn btn-primary" style={{ width: '100%' }} disabled>
          Creating design...
        </button>
      )}
    </div>
  );
}

/**
 * Try to parse the Claude output as a DesignSpecNode.
 * Strips markdown code fences if present.
 */
function tryParseDesignSpec(text: string): { spec: DesignSpecNode | null; error: string | null } {
  let cleaned = text.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Also handle case where there's text before the JSON
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart >= 0) {
      cleaned = cleaned.slice(jsonStart);
      // Find the matching closing brace
      let depth = 0;
      let end = -1;
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '{') depth++;
        if (cleaned[i] === '}') {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      if (end >= 0) {
        cleaned = cleaned.slice(0, end + 1);
      }
    }
  }

  try {
    const parsed = JSON.parse(cleaned) as DesignSpecNode;

    // Basic validation
    if (!parsed.type) {
      return { spec: null, error: 'Missing required "type" field in design spec' };
    }

    return { spec: parsed, error: null };
  } catch (err) {
    return {
      spec: null,
      error: `JSON parse error: ${err instanceof Error ? err.message : 'Invalid JSON'}`,
    };
  }
}
