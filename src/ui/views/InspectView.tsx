import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type {
  DesignTokensDocument,
  DesignSpecNode,
  SelectionExportResult,
  AutoMapResult,
  AutoMapPropertyType,
  TokenBindingInstruction,
} from '../../types/messages';
import { sendToCode, onCodeMessage } from '../../utils/message-bus';
import {
  flattenTokensForPrompt,
  buildReverseSyncSystemPrompt,
  buildReverseSyncUserMessage,
} from '../../api/prompt-builder';
import { generateDesign } from '../../api/claude-client';
import { SuggestionRow } from '../components/SuggestionRow';
import { showToast } from '../components/Toast';

type ExportState = 'idle' | 'exporting' | 'exported' | 'error';
type ScanState = 'idle' | 'scanning' | 'scanned' | 'error';
type ModifyState = 'idle' | 'generating' | 'complete' | 'error';

interface InspectViewProps {
  apiKey?: string;
  tokensDocument: DesignTokensDocument | null;
}

export function InspectView({ apiKey, tokensDocument }: InspectViewProps) {
  // === Section A: Reverse Sync ===
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [exportResult, setExportResult] = useState<SelectionExportResult | null>(null);
  const [exportProgress, setExportProgress] = useState<{ stage: string; percent: number } | null>(null);

  const [modifyState, setModifyState] = useState<ModifyState>('idle');
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [streamOutput, setStreamOutput] = useState('');
  const [parsedSpec, setParsedSpec] = useState<DesignSpecNode | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [creationProgress, setCreationProgress] = useState<{ stage: string; percent: number } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLPreElement>(null);

  // === Section B: Auto-Mapping ===
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanResult, setScanResult] = useState<AutoMapResult | null>(null);
  const [scanProgress, setScanProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [selectedBindings, setSelectedBindings] = useState<Map<string, string>>(new Map());
  const [isBinding, setIsBinding] = useState(false);

  // Listen for messages from code.ts
  useEffect(() => {
    const unsubscribe = onCodeMessage((msg) => {
      switch (msg.type) {
        case 'SELECTION_EXPORTED':
          setExportState('exported');
          setExportResult(msg.result);
          setExportProgress(null);
          showToast(`Exported ${msg.result.nodeCount} nodes`, 'success');
          break;

        case 'EXPORT_PROGRESS':
          setExportProgress({ stage: msg.stage, percent: msg.percent });
          break;

        case 'AUTO_MAP_RESULT':
          setScanState('scanned');
          setScanResult(msg.result);
          setScanProgress(null);
          // Auto-select top suggestions with confidence >= 0.85
          autoSelectTopSuggestions(msg.result);
          showToast(
            `Found ${msg.result.totalHardCoded} hard-coded values, ${msg.result.totalSuggestions} suggestions`,
            'success',
          );
          break;

        case 'AUTO_MAP_PROGRESS':
          setScanProgress({ stage: msg.stage, percent: msg.percent });
          break;

        case 'BINDINGS_APPLIED': {
          setIsBinding(false);
          const { result } = msg;
          if (result.errors.length > 0) {
            showToast(`Applied ${result.boundCount} bindings with ${result.errors.length} error(s)`, 'info');
          } else {
            showToast(`Applied ${result.boundCount} bindings successfully`, 'success');
          }
          break;
        }

        case 'DESIGN_CREATED': {
          setIsApplying(false);
          setCreationProgress(null);
          const { result } = msg;
          if (result.errors.length > 0) {
            showToast(`Modified design created with ${result.errors.length} warning(s)`, 'info');
          } else {
            showToast(`Modified design "${result.nodeName}" created (${result.childCount} children)`, 'success');
          }
          break;
        }

        case 'DESIGN_CREATION_PROGRESS':
          setCreationProgress({ stage: msg.stage, percent: msg.percent });
          break;

        case 'ERROR':
          if (exportState === 'exporting') setExportState('error');
          if (scanState === 'scanning') setScanState('error');
          setExportProgress(null);
          setScanProgress(null);
          setIsBinding(false);
          break;
      }
    });
    return unsubscribe;
  }, [exportState, scanState]);

  // Auto-scroll streaming output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamOutput]);

  // Auto-select top suggestions with high confidence
  const autoSelectTopSuggestions = useCallback((result: AutoMapResult) => {
    const newBindings = new Map<string, string>();
    for (const mapping of result.mappings) {
      const top = mapping.suggestions[0];
      if (top && top.confidence >= 0.85) {
        newBindings.set(`${mapping.nodeId}:${mapping.property}`, top.variableId);
      }
    }
    setSelectedBindings(newBindings);
  }, []);

  // === Section A Handlers ===
  const handleExport = useCallback(() => {
    setExportState('exporting');
    setExportResult(null);
    setExportProgress(null);
    setModifyState('idle');
    setStreamOutput('');
    setParsedSpec(null);
    setParseError(null);
    sendToCode({ type: 'EXPORT_SELECTION' });
  }, []);

  const handleModify = useCallback(() => {
    if (!modifyPrompt.trim() || !exportResult) {
      showToast('Enter a modification prompt', 'info');
      return;
    }
    if (!apiKey) {
      showToast('No Claude API key. Use Claude MCP for free AI modifications.', 'info');
      return;
    }

    setModifyState('generating');
    setStreamOutput('');
    setParsedSpec(null);
    setParseError(null);

    const tokenLines = tokensDocument ? flattenTokensForPrompt(tokensDocument) : [];
    const exportedJson = JSON.stringify(exportResult.root, null, 2);
    const systemPrompt = buildReverseSyncSystemPrompt(exportedJson, tokenLines);
    const userMsg = buildReverseSyncUserMessage(modifyPrompt.trim());

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
          const parsed = tryParseSpec(fullText);
          if (parsed.spec) {
            setParsedSpec(parsed.spec);
            setModifyState('complete');
            showToast('Modification spec generated!', 'success');
          } else {
            setParseError(parsed.error ?? 'Unknown parse error');
            setModifyState('error');
            showToast('Could not parse modified spec', 'error');
          }
        },
        onError: (error) => {
          abortRef.current = null;
          setParseError(error);
          setModifyState('error');
          showToast(`Modification failed: ${error}`, 'error');
        },
      },
      abort.signal,
    );
  }, [modifyPrompt, exportResult, apiKey, tokensDocument]);

  const handleCancelModify = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setModifyState('idle');
    showToast('Modification cancelled', 'info');
  }, []);

  const handleApplyModified = useCallback(() => {
    if (!parsedSpec) return;
    setIsApplying(true);
    setCreationProgress(null);
    sendToCode({ type: 'CREATE_DESIGN', spec: parsedSpec });
  }, [parsedSpec]);

  // === Section B Handlers ===
  const handleScan = useCallback(() => {
    setScanState('scanning');
    setScanResult(null);
    setScanProgress(null);
    setSelectedBindings(new Map());
    sendToCode({ type: 'AUTO_MAP_TOKENS' });
  }, []);

  const handleToggleBinding = useCallback((nodeId: string, property: string, variableId: string) => {
    setSelectedBindings((prev) => {
      const next = new Map(prev);
      const key = `${nodeId}:${property}`;
      if (next.get(key) === variableId) {
        next.delete(key);
      } else {
        next.set(key, variableId);
      }
      return next;
    });
  }, []);

  const handleApplyBindings = useCallback(() => {
    if (selectedBindings.size === 0) {
      showToast('No bindings selected', 'info');
      return;
    }

    const bindings: TokenBindingInstruction[] = [];
    for (const [key, variableId] of selectedBindings.entries()) {
      const [nodeId, property] = key.split(':');
      bindings.push({
        nodeId,
        property: property as AutoMapPropertyType,
        variableId,
      });
    }

    setIsBinding(true);
    sendToCode({ type: 'APPLY_TOKEN_BINDINGS', bindings });
  }, [selectedBindings]);

  const handleSelectAll = useCallback(() => {
    if (!scanResult) return;
    const newBindings = new Map<string, string>();
    for (const mapping of scanResult.mappings) {
      const top = mapping.suggestions[0];
      if (top) {
        newBindings.set(`${mapping.nodeId}:${mapping.property}`, top.variableId);
      }
    }
    setSelectedBindings(newBindings);
  }, [scanResult]);

  const handleDeselectAll = useCallback(() => {
    setSelectedBindings(new Map());
  }, []);

  const hasApiKey = !!apiKey;

  return (
    <div class="inspect-view">
      {/* Section A — Reverse Sync (only with API key) */}
      {hasApiKey && (
      <div class="inspect-section">
        <div class="inspect-section-header">
          <h3>Reverse Sync</h3>
          <span class="inspect-section-desc">Export a selection, modify with Claude, and apply back</span>
        </div>

        <button
          class="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handleExport}
          disabled={exportState === 'exporting'}
        >
          {exportState === 'exporting' ? 'Exporting...' : 'Export Selection'}
        </button>

        {/* Export Progress */}
        {exportProgress && (
          <div class="extraction-progress">
            <div class="progress-bar">
              <div class="progress-fill" style={{ width: `${exportProgress.percent}%` }} />
            </div>
            <span class="progress-label">{exportProgress.stage}</span>
          </div>
        )}

        {/* Export Result */}
        {exportResult && (
          <div class="export-result">
            <div class="export-stats">
              <span>{exportResult.nodeCount} nodes</span>
              <span>{exportResult.boundVariableCount} bound variables</span>
              {exportResult.warnings.length > 0 && (
                <span class="export-stat-warning">{exportResult.warnings.length} warnings</span>
              )}
            </div>
            <div class="export-preview">
              <pre class="token-json-preview">
                {JSON.stringify(exportResult.root, null, 2).slice(0, 2000)}
                {JSON.stringify(exportResult.root, null, 2).length > 2000 ? '\n...(truncated)' : ''}
              </pre>
            </div>

            {/* Modification prompt */}
            <div class="generate-input-group">
              <textarea
                class="generate-textarea"
                placeholder="Describe modifications... e.g. 'Change the button color to blue and increase padding'"
                value={modifyPrompt}
                onInput={(e) => setModifyPrompt((e.target as HTMLTextAreaElement).value)}
                disabled={modifyState === 'generating'}
                rows={3}
              />
            </div>

            <div class="generate-actions">
              {modifyState === 'generating' ? (
                <button class="btn btn-danger" style={{ width: '100%' }} onClick={handleCancelModify}>
                  Cancel
                </button>
              ) : (
                <button
                  class="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleModify}
                  disabled={!modifyPrompt.trim() || isApplying}
                >
                  Send to Claude
                </button>
              )}
            </div>

            {/* Streaming Output */}
            {(streamOutput || modifyState === 'generating') && (
              <div class="generate-output">
                <div class="generate-output-header">
                  <span>Claude Output</span>
                  {modifyState === 'generating' && <span class="generate-streaming-dot" />}
                </div>
                <pre class="generate-output-content" ref={outputRef}>
                  {streamOutput || 'Waiting for response...'}
                </pre>
              </div>
            )}

            {/* Parse Error */}
            {parseError && modifyState === 'error' && (
              <div class="generate-error">
                <strong>Error:</strong> {parseError}
              </div>
            )}

            {/* Apply Modified Design */}
            {parsedSpec && !isApplying && (
              <div class="generate-actions">
                <button class="btn btn-primary" style={{ width: '100%' }} onClick={handleApplyModified}>
                  Apply Modified Design
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

            {isApplying && !creationProgress && (
              <button class="btn btn-primary" style={{ width: '100%' }} disabled>
                Creating design...
              </button>
            )}
          </div>
        )}
      </div>
      )}

      {/* Section B — Auto-Mapping */}
      <div class="inspect-section">
        <div class="inspect-section-header">
          <h3>Token Auto-Mapping</h3>
          <span class="inspect-section-desc">Scan for hard-coded values and suggest matching tokens</span>
        </div>

        <button
          class="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={handleScan}
          disabled={scanState === 'scanning'}
        >
          {scanState === 'scanning' ? 'Scanning...' : 'Scan for Hard-Coded Values'}
        </button>

        {/* Scan Progress */}
        {scanProgress && (
          <div class="extraction-progress">
            <div class="progress-bar">
              <div class="progress-fill" style={{ width: `${scanProgress.percent}%` }} />
            </div>
            <span class="progress-label">{scanProgress.stage}</span>
          </div>
        )}

        {/* Scan Results */}
        {scanResult && (
          <div class="automap-results">
            <div class="automap-stats">
              <span>{scanResult.totalHardCoded} hard-coded values</span>
              <span>{scanResult.totalSuggestions} suggestions</span>
              <span>{scanResult.scanDuration}ms scan time</span>
            </div>

            {scanResult.mappings.length === 0 ? (
              <div class="automap-empty">
                No hard-coded values found, or no matching tokens available.
              </div>
            ) : (
              <>
                {/* Bulk actions */}
                <div class="automap-bulk-actions">
                  <button class="btn-filter" onClick={handleSelectAll}>
                    Select All Top
                  </button>
                  <button class="btn-filter" onClick={handleDeselectAll}>
                    Deselect All
                  </button>
                  <span class="automap-selected-count">
                    {selectedBindings.size} selected
                  </span>
                </div>

                {/* Suggestion list */}
                <div class="automap-list">
                  {scanResult.mappings.map((mapping) => (
                    <SuggestionRow
                      key={`${mapping.nodeId}:${mapping.property}`}
                      mapping={mapping}
                      selectedBindings={selectedBindings}
                      onToggleBinding={handleToggleBinding}
                    />
                  ))}
                </div>

                {/* Apply Bindings */}
                <button
                  class="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleApplyBindings}
                  disabled={selectedBindings.size === 0 || isBinding}
                >
                  {isBinding
                    ? 'Applying...'
                    : `Apply ${selectedBindings.size} Binding${selectedBindings.size !== 1 ? 's' : ''}`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Try to parse Claude output as a DesignSpecNode.
 * Strips markdown code fences if present.
 */
function tryParseSpec(text: string): { spec: DesignSpecNode | null; error: string | null } {
  let cleaned = text.trim();

  // Strip markdown code fences
  const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Extract JSON object if there's extra text
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart >= 0) {
      cleaned = cleaned.slice(jsonStart);
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
