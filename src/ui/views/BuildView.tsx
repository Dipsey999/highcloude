import type { DesignTokensDocument } from '../../types/messages';
import { GenerateView } from './GenerateView';
import { InspectView } from './InspectView';

interface BuildViewProps {
  apiKey?: string;
  tokensDocument: DesignTokensDocument | null;
}

function McpBanner() {
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      background: 'linear-gradient(135deg, #f3e8ff, #faf5ff)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 'var(--spacing-lg)',
      border: '1px solid #e9d5ff',
    }}>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '16px' }}>&#10024;</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: '#6b21a8', marginBottom: '4px' }}>
            AI Design — Use Claude MCP (Free)
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: '#7c3aed', lineHeight: '1.5' }}>
            Generate designs and modify components using Claude's free Figma MCP integration.
            Connect Claude to Figma via MCP and ask it to design directly on your canvas.
          </div>
        </div>
      </div>
    </div>
  );
}

export function BuildView({ apiKey, tokensDocument }: BuildViewProps) {
  const hasApiKey = !!apiKey;

  return (
    <div class="build-view">
      {!hasApiKey && <McpBanner />}

      {hasApiKey && (
        <div class="build-section">
          <div class="build-section-header">
            <h3>Generate Design</h3>
            <span class="build-section-desc">Create new designs from text prompts using Claude AI</span>
          </div>
          <GenerateView apiKey={apiKey} tokensDocument={tokensDocument} />
        </div>
      )}

      {hasApiKey && <div class="build-divider" />}

      <div class="build-section">
        <div class="build-section-header">
          <h3>Inspect & Map</h3>
          <span class="build-section-desc">Export selections and auto-map tokens to your design</span>
        </div>
        <InspectView apiKey={apiKey} tokensDocument={tokensDocument} />
      </div>
    </div>
  );
}
