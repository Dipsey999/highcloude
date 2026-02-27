import { useState, useCallback } from 'preact/hooks';
import type { DTCGToken, DTCGTokenType } from '../../types/messages';
import { ColorSwatch } from './ColorSwatch';
import { sendToCode } from '../../utils/ui-message-bus';

interface TokenTreeNodeProps {
  name: string;
  path: string;
  token: DTCGToken;
  activeModeId?: string;
  usageCount?: number;
  onRequestUsage?: (variableId: string) => void;
}

export function TokenTreeNode({
  name,
  path,
  token,
  activeModeId,
  usageCount,
  onRequestUsage,
}: TokenTreeNodeProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const variableId = token.$extensions?.figma?.variableId;
  const isColor = token.$type === 'color';
  const displayValue = getDisplayValue(token, activeModeId);

  const handleStartEdit = useCallback(() => {
    setEditValue(String(displayValue));
    setEditing(true);
  }, [displayValue]);

  const handleSave = useCallback(() => {
    if (!variableId || !activeModeId) return;

    let newValue: string | number | boolean = editValue;
    if (token.$type === 'dimension') {
      const num = parseFloat(editValue);
      if (!isNaN(num)) newValue = num;
    } else if (token.$type === 'boolean') {
      newValue = editValue.toLowerCase() === 'true';
    }

    sendToCode({
      type: 'UPDATE_TOKEN_VALUE',
      variableId,
      modeId: activeModeId,
      newValue,
    });
    setEditing(false);
  }, [variableId, activeModeId, editValue, token.$type]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  }, [handleSave]);

  const handleUsageClick = useCallback(() => {
    if (variableId && onRequestUsage) {
      onRequestUsage(variableId);
    }
  }, [variableId, onRequestUsage]);

  return (
    <div class="token-tree-leaf">
      <div class="token-tree-leaf-info">
        <span class="token-tree-leaf-name" title={path}>{name}</span>
        <span class={`token-tree-type-badge token-type-${token.$type}`}>
          {typeLabel(token.$type)}
        </span>
      </div>

      <div class="token-tree-leaf-value">
        {isColor && typeof displayValue === 'string' && displayValue.startsWith('#') ? (
          <ColorSwatch color={displayValue} size={14} />
        ) : null}

        {editing ? (
          <input
            class="token-tree-edit-input"
            type="text"
            value={editValue}
            onInput={(e) => setEditValue((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
          />
        ) : (
          <span
            class="token-tree-leaf-display"
            onClick={variableId && activeModeId ? handleStartEdit : undefined}
            title={variableId ? 'Click to edit' : 'No variable ID — read-only'}
          >
            {String(displayValue)}
          </span>
        )}
      </div>

      {usageCount !== undefined && (
        <span
          class="token-tree-usage"
          onClick={handleUsageClick}
          title="Nodes using this token"
        >
          {usageCount}
        </span>
      )}
    </div>
  );
}

interface TokenTreeGroupProps {
  name: string;
  expanded: boolean;
  onToggle: () => void;
  childCount: number;
  children: preact.ComponentChildren;
}

export function TokenTreeGroup({ name, expanded, onToggle, childCount, children }: TokenTreeGroupProps) {
  return (
    <div class="token-tree-group">
      <div class="token-tree-group-header" onClick={onToggle}>
        <span class="token-tree-expand">{expanded ? '\u25BC' : '\u25B6'}</span>
        <span class="token-tree-group-name">{name}</span>
        <span class="token-tree-group-count">{childCount}</span>
      </div>
      {expanded && (
        <div class="token-tree-group-children">
          {children}
        </div>
      )}
    </div>
  );
}

function getDisplayValue(token: DTCGToken, activeModeId?: string): string | number | boolean {
  // If a specific mode is active and we have mode values, use that
  if (activeModeId && token.$extensions?.figma?.modes) {
    const modeValue = token.$extensions.figma.modes[activeModeId];
    if (modeValue !== undefined) {
      if (typeof modeValue === 'object') return JSON.stringify(modeValue);
      return modeValue;
    }
  }
  // Fall back to $value
  if (typeof token.$value === 'object') return JSON.stringify(token.$value);
  return token.$value;
}

function typeLabel(type: DTCGTokenType): string {
  switch (type) {
    case 'color': return 'C';
    case 'dimension': return 'D';
    case 'string': return 'S';
    case 'boolean': return 'B';
    case 'typography': return 'T';
    case 'shadow': return 'Sh';
    default: return '?';
  }
}
