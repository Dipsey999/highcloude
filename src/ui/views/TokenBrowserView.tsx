import { useState, useEffect, useCallback } from 'preact/hooks';
import type { CredentialPayload, RawExtractionResult, DesignTokensDocument, RawFigmaVariable } from '../../types/messages';
import { sendToCode, onCodeMessage } from '../../utils/message-bus';
import { SearchInput } from '../components/SearchInput';
import { TokenTree } from '../components/TokenTree';
import { BatchActionsMenu } from '../components/BatchActionsMenu';
import { SyncView } from './SyncView';
import { showToast } from '../components/Toast';

interface TokenBrowserViewProps {
  rawData: RawExtractionResult | null;
  tokensDocument: DesignTokensDocument | null;
  credentials: CredentialPayload;
  extractionProgress: { stage: string; percent: number } | null;
}

export function TokenBrowserView({
  rawData,
  tokensDocument,
  credentials,
  extractionProgress,
}: TokenBrowserViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModeId, setActiveModeId] = useState<string | undefined>(undefined);
  const [modes, setModes] = useState<Array<{ modeId: string; modeName: string }>>([]);
  const [usageCounts, setUsageCounts] = useState<Map<string, number>>(new Map());
  const [showSync, setShowSync] = useState(false);

  // Load modes when raw data changes
  useEffect(() => {
    if (rawData && rawData.variables.length > 0) {
      // Get unique collection IDs
      const collectionIds = new Set(rawData.variables.map((v: RawFigmaVariable) => v.collectionId));
      // Request modes for the first collection
      const firstCollectionId = Array.from(collectionIds)[0];
      if (firstCollectionId) {
        sendToCode({ type: 'GET_VARIABLE_MODES', collectionId: firstCollectionId });
      }
    }
  }, [rawData]);

  // Listen for messages
  useEffect(() => {
    const unsubscribe = onCodeMessage((msg) => {
      if (msg.type === 'VARIABLE_MODES_RESULT') {
        setModes(msg.modes);
        if (msg.modes.length > 0 && !activeModeId) {
          setActiveModeId(msg.modes[0].modeId);
        }
      }
      if (msg.type === 'TOKEN_USAGE_RESULT') {
        setUsageCounts((prev) => {
          const next = new Map(prev);
          next.set(msg.variableId, msg.count);
          return next;
        });
      }
      if (msg.type === 'TOKEN_VALUE_UPDATED') {
        if (msg.success) {
          showToast('Token value updated', 'success');
          // Re-extract tokens to refresh the display
          sendToCode({ type: 'EXTRACT_TOKENS' });
        } else {
          showToast(msg.error ?? 'Failed to update token', 'error');
        }
      }
    });
    return unsubscribe;
  }, [activeModeId]);

  const handleRequestUsage = useCallback((variableId: string) => {
    sendToCode({ type: 'GET_TOKEN_USAGE', variableId });
  }, []);

  const handleModeChange = useCallback((e: Event) => {
    setActiveModeId((e.target as HTMLSelectElement).value);
  }, []);

  // Token count
  const tokenCount = rawData ? rawData.variables.length : 0;

  return (
    <div class="token-browser-view">
      {/* Header with batch actions */}
      <div class="token-browser-header">
        <div class="token-browser-title">
          <span>{tokenCount} tokens</span>
          {modes.length > 1 && (
            <select
              class="token-mode-select"
              value={activeModeId ?? ''}
              onChange={handleModeChange}
            >
              {modes.map((m) => (
                <option key={m.modeId} value={m.modeId}>{m.modeName}</option>
              ))}
            </select>
          )}
        </div>
        <BatchActionsMenu />
      </div>

      {/* Search */}
      <SearchInput
        onSearch={setSearchQuery}
        placeholder="Search tokens by name or value..."
      />

      {/* Token Tree */}
      {tokensDocument ? (
        <TokenTree
          document={tokensDocument}
          searchQuery={searchQuery}
          activeModeId={activeModeId}
          usageCounts={usageCounts}
          onRequestUsage={handleRequestUsage}
        />
      ) : (
        <div class="token-browser-empty">
          <p>No tokens extracted yet.</p>
          <button
            class="btn btn-primary"
            onClick={() => sendToCode({ type: 'EXTRACT_TOKENS' })}
          >
            Extract Tokens
          </button>
        </div>
      )}

      {/* Extraction Progress */}
      {extractionProgress && (
        <div class="extraction-progress">
          <div class="progress-bar">
            <div class="progress-fill" style={{ width: `${extractionProgress.percent}%` }} />
          </div>
          <span class="progress-label">{extractionProgress.stage}</span>
        </div>
      )}

      {/* Toggle Sync Section */}
      <div class="token-browser-sync-toggle">
        <button
          class="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={() => setShowSync(!showSync)}
        >
          {showSync ? 'Hide Sync' : 'Show Sync Options'}
        </button>
      </div>

      {showSync && (
        <SyncView
          credentials={credentials}
          rawData={rawData}
          extractionProgress={extractionProgress}
        />
      )}
    </div>
  );
}
