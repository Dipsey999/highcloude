import { KeysForm } from '@/components/KeysForm';

export default function KeysPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Setup</h1>
        <p className="mt-2 text-sm max-w-lg" style={{ color: 'var(--text-secondary)' }}>
          Connect your GitHub account to enable repository sync. AI features are free through
          Figma&apos;s built-in Claude integration.
        </p>
      </div>
      <div className="max-w-xl">
        <KeysForm />
      </div>
    </div>
  );
}
