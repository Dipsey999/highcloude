import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { sendToCode, onCodeMessage } from '../../utils/message-bus';
import { showToast } from './Toast';

export function BatchActionsMenu() {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Listen for results
  useEffect(() => {
    const unsubscribe = onCodeMessage((msg) => {
      switch (msg.type) {
        case 'BATCH_AUTO_MAP_ALL_RESULT':
          setRunning(null);
          showToast(`Found ${msg.result.totalHardCoded} hard-coded values across all pages`, 'success');
          break;
        case 'DTCG_VALIDATION_RESULT':
          setRunning(null);
          if (msg.result.valid) {
            showToast(`All ${msg.result.totalChecked} tokens valid!`, 'success');
          } else {
            showToast(`${msg.result.errors.length} errors, ${msg.result.warnings.length} warnings`, 'info');
          }
          break;
        case 'UNUSED_TOKENS_RESULT':
          setRunning(null);
          showToast(`Found ${msg.result.unusedTokens.length} unused tokens out of ${msg.result.totalScanned}`, 'success');
          break;
        case 'ORPHANED_VALUES_RESULT':
          setRunning(null);
          showToast(`Found ${msg.result.orphanedValues.length} orphaned values`, 'success');
          break;
      }
    });
    return unsubscribe;
  }, []);

  const runAction = useCallback((action: string) => {
    setOpen(false);
    setRunning(action);
    switch (action) {
      case 'automap':
        sendToCode({ type: 'BATCH_AUTO_MAP_ALL_PAGES' });
        break;
      case 'validate':
        sendToCode({ type: 'VALIDATE_TOKENS_DTCG' });
        break;
      case 'unused':
        sendToCode({ type: 'FIND_UNUSED_TOKENS' });
        break;
      case 'orphaned':
        sendToCode({ type: 'FIND_ORPHANED_VALUES' });
        break;
    }
  }, []);

  return (
    <div class="batch-actions-wrapper" ref={menuRef}>
      <button
        class="btn-filter batch-trigger"
        onClick={() => setOpen(!open)}
        disabled={running !== null}
      >
        {running ? 'Running...' : 'Actions'}
      </button>

      {open && (
        <div class="batch-dropdown">
          <button class="batch-dropdown-item" onClick={() => runAction('automap')}>
            Replace hard-coded colors
          </button>
          <button class="batch-dropdown-item" onClick={() => runAction('validate')}>
            Validate tokens (DTCG)
          </button>
          <button class="batch-dropdown-item" onClick={() => runAction('unused')}>
            Find unused tokens
          </button>
          <button class="batch-dropdown-item" onClick={() => runAction('orphaned')}>
            Find orphaned values
          </button>
        </div>
      )}
    </div>
  );
}
