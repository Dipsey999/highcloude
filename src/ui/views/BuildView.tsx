import type { DesignTokensDocument } from '../../types/messages';
import { GenerateView } from './GenerateView';
import { InspectView } from './InspectView';

interface BuildViewProps {
  apiKey: string;
  tokensDocument: DesignTokensDocument | null;
}

export function BuildView({ apiKey, tokensDocument }: BuildViewProps) {
  return (
    <div class="build-view">
      <div class="build-section">
        <div class="build-section-header">
          <h3>Generate Design</h3>
          <span class="build-section-desc">Create new designs from text prompts using Claude AI</span>
        </div>
        <GenerateView apiKey={apiKey} tokensDocument={tokensDocument} />
      </div>

      <div class="build-divider" />

      <div class="build-section">
        <div class="build-section-header">
          <h3>Inspect & Map</h3>
          <span class="build-section-desc">Export selections, modify with Claude, and auto-map tokens</span>
        </div>
        <InspectView apiKey={apiKey} tokensDocument={tokensDocument} />
      </div>
    </div>
  );
}
