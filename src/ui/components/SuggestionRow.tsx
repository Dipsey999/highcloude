import { useState } from 'preact/hooks';
import type { AutoMapNodeResult, TokenSuggestion } from '../../types/messages';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ColorSwatch } from './ColorSwatch';

interface SuggestionRowProps {
  mapping: AutoMapNodeResult;
  selectedBindings: Map<string, string>; // key: `${nodeId}:${property}` → variableId
  onToggleBinding: (nodeId: string, property: string, variableId: string) => void;
}

export function SuggestionRow({ mapping, selectedBindings, onToggleBinding }: SuggestionRowProps) {
  const [expanded, setExpanded] = useState(false);

  const bindingKey = `${mapping.nodeId}:${mapping.property}`;
  const selectedVariableId = selectedBindings.get(bindingKey);
  const topSuggestion = mapping.suggestions[0];
  const isColor = mapping.property === 'fill' || mapping.property === 'stroke';

  return (
    <div class="automap-node">
      <div class="automap-node-header" onClick={() => setExpanded(!expanded)}>
        <span class="automap-expand">{expanded ? '\u25BC' : '\u25B6'}</span>
        <div class="automap-node-info">
          <span class="automap-node-name" title={mapping.nodeName}>
            {mapping.nodeName}
          </span>
          <span class="automap-property-badge">{mapping.property}</span>
        </div>
        <div class="automap-current-value">
          {isColor && typeof mapping.currentValue === 'string' ? (
            <ColorSwatch color={mapping.currentValue} />
          ) : (
            <span class="automap-value-text">{String(mapping.currentValue)}</span>
          )}
        </div>
        {topSuggestion && (
          <ConfidenceBadge
            confidence={topSuggestion.confidence}
            matchType={topSuggestion.matchType}
          />
        )}
      </div>

      {expanded && (
        <div class="automap-suggestions-list">
          {mapping.suggestions.map((suggestion: TokenSuggestion) => {
            const isSelected = selectedVariableId === suggestion.variableId;
            return (
              <div
                key={suggestion.variableId}
                class={`automap-suggestion ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleBinding(mapping.nodeId, mapping.property, suggestion.variableId)}
              >
                <input
                  type="radio"
                  name={bindingKey}
                  checked={isSelected}
                  onChange={() => onToggleBinding(mapping.nodeId, mapping.property, suggestion.variableId)}
                />
                <div class="automap-suggestion-info">
                  <span class="automap-suggestion-name">{suggestion.variableName}</span>
                  <span class="automap-suggestion-collection">{suggestion.collectionName}</span>
                </div>
                <div class="automap-suggestion-value">
                  {isColor && typeof suggestion.tokenValue === 'string' ? (
                    <ColorSwatch color={suggestion.tokenValue} size={12} />
                  ) : (
                    <span>{String(suggestion.tokenValue)}</span>
                  )}
                </div>
                <ConfidenceBadge
                  confidence={suggestion.confidence}
                  matchType={suggestion.matchType}
                />
                {suggestion.deltaE !== undefined && (
                  <span class="automap-delta-e" title="Color distance (Delta E)">
                    dE {suggestion.deltaE.toFixed(1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
