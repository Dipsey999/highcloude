import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { DesignTokensDocument, DesignSpecNode, ComponentPattern } from '../../types/messages';
import { sendToCode, onCodeMessage } from '../../utils/ui-message-bus';
import {
  flattenTokensForPrompt,
  buildSystemPrompt,
  buildUserMessage,
  buildRefinementPrompt,
  buildRefinementUserMessage,
} from '../../api/prompt-builder';
import { generateDesign } from '../../api/claude-client';
import { validateDesignSpec, type DesignRulesResult } from '../../core/design-rules';
import { showToast } from '../components/Toast';

type GenerateState = 'idle' | 'generating' | 'complete' | 'error';

interface GenerateViewProps {
  apiKey?: string;
  tokensDocument: DesignTokensDocument | null;
  patterns?: ComponentPattern[];
}

export function GenerateView({ apiKey, tokensDocument, patterns }: GenerateViewProps) {
  const [state, setState] = useState<GenerateState>('idle');
  const [prompt, setPrompt] = useState('');
  const [streamOutput, setStreamOutput] = useState('');
  const [parsedSpec, setParsedSpec] = useState<DesignSpecNode | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [creationProgress, setCreationProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [rulesResult, setRulesResult] = useState<DesignRulesResult | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isRefinement, setIsRefinement] = useState(false);

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
    setRulesResult(null);

    // Build prompts
    const tokenLines = tokensDocument ? flattenTokensForPrompt(tokensDocument) : [];

    let systemPrompt: string;
    let userMsg: string;

    if (isRefinement && parsedSpec) {
      // Refinement mode: use previous spec as context
      systemPrompt = buildRefinementPrompt(JSON.stringify(parsedSpec), tokenLines);
      userMsg = buildRefinementUserMessage(prompt.trim());
    } else {
      systemPrompt = buildSystemPrompt(tokenLines, patterns);
      userMsg = buildUserMessage(prompt.trim());
    }

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

            // Run design rules validation
            const rules = validateDesignSpec(parsed.spec, tokenLines);
            setRulesResult(rules);

            // Update conversation history for refinement
            setConversationHistory((prev) => [
              ...prev,
              { role: 'user' as const, content: prompt.trim() },
              { role: 'assistant' as const, content: fullText },
            ]);
            setIsRefinement(true);

            if (rules.errorCount > 0) {
              showToast(`Design spec generated with ${rules.errorCount} issue(s)`, 'info');
            } else {
              showToast('Design spec generated!', 'success');
            }
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
  }, [prompt, apiKey, tokensDocument, patterns, isRefinement, parsedSpec]);

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
    setRulesResult(null);
    setConversationHistory([]);
    setIsRefinement(false);
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

      {/* Design Rules Violations */}
      {rulesResult && rulesResult.violations.length > 0 && (
        <div class="generate-rules" style={{ margin: '8px 0', padding: '8px', borderRadius: '6px', background: 'var(--figma-color-bg-secondary, #f5f5f5)', fontSize: '11px' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--figma-color-text, #333)' }}>
            Design Check: {rulesResult.errorCount > 0 ? `${rulesResult.errorCount} error(s), ` : ''}{rulesResult.warningCount} warning(s), {rulesResult.infoCount} info
          </div>
          <div style={{ maxHeight: '120px', overflow: 'auto' }}>
            {rulesResult.violations.slice(0, 10).map((v, i) => (
              <div key={i} style={{ padding: '2px 0', color: v.severity === 'error' ? '#e53e3e' : v.severity === 'warning' ? '#d69e2e' : '#718096' }}>
                <span style={{ fontWeight: 500 }}>[{v.severity}]</span> {v.message}
                {v.suggestion && <span style={{ opacity: 0.7 }}> — {v.suggestion}</span>}
              </div>
            ))}
            {rulesResult.violations.length > 10 && (
              <div style={{ opacity: 0.6, paddingTop: '4px' }}>...and {rulesResult.violations.length - 10} more</div>
            )}
          </div>
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

      {/* Refinement input (after first generation) */}
      {isRefinement && state === 'complete' && !isApplying && (
        <div class="generate-input-group" style={{ marginTop: '8px' }}>
          <textarea
            class="generate-textarea"
            placeholder="Refine: e.g. 'Make the button wider' or 'Add a subtitle text'"
            value={prompt}
            onInput={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
            rows={2}
          />
          <button
            class="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={handleGenerate}
            disabled={!prompt.trim()}
          >
            Refine Design
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
 * Strips markdown code fences, fixes common JSON issues, and handles partial output.
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
    }
  }

  // Find the matching closing brace (handles text after JSON too)
  if (cleaned.startsWith('{')) {
    let depth = 0;
    let end = -1;
    let inString = false;
    let escape = false;
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end >= 0) {
      cleaned = cleaned.slice(0, end + 1);
    }
  }

  // Attempt 1: Direct parse
  const result = attemptParse(cleaned);
  if (result.spec) return result;

  // Attempt 2: Fix trailing commas (common Claude output issue)
  const fixedTrailing = cleaned
    .replace(/,\s*([}\]])/g, '$1');
  const result2 = attemptParse(fixedTrailing);
  if (result2.spec) return result2;

  // Attempt 3: Fix missing closing braces (truncated output)
  let fixedBraces = fixedTrailing;
  let openBraces = 0;
  let openBrackets = 0;
  let inStr = false;
  let esc = false;
  for (const ch of fixedBraces) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') openBraces++;
    if (ch === '}') openBraces--;
    if (ch === '[') openBrackets++;
    if (ch === ']') openBrackets--;
  }
  // Remove trailing comma before adding closing chars
  fixedBraces = fixedBraces.replace(/,\s*$/, '');
  for (let i = 0; i < openBrackets; i++) fixedBraces += ']';
  for (let i = 0; i < openBraces; i++) fixedBraces += '}';
  const result3 = attemptParse(fixedBraces);
  if (result3.spec) return result3;

  return {
    spec: null,
    error: `JSON parse error: ${result.error}`,
  };
}

function attemptParse(text: string): { spec: DesignSpecNode | null; error: string | null } {
  try {
    const parsed = JSON.parse(text) as DesignSpecNode;

    // Basic validation
    if (!parsed.type) {
      return { spec: null, error: 'Missing required "type" field in design spec' };
    }

    return { spec: parsed, error: null };
  } catch (err) {
    return {
      spec: null,
      error: err instanceof Error ? err.message : 'Invalid JSON',
    };
  }
}
