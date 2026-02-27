import { ClaudeSetup } from '@/components/ClaudeSetup';

export default function ClaudePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Claude AI
        </h1>
        <p className="mt-2 text-sm max-w-lg" style={{ color: 'var(--text-secondary)' }}>
          Configure AI-powered design features. Use Claude MCP for free, or add your own API key for direct access.
        </p>
      </div>
      <ClaudeSetup />
    </div>
  );
}
