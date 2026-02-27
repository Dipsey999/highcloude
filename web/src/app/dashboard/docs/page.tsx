import { DocsContent } from '@/components/DocsContent';

export default function DocsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Documentation
        </h1>
        <p className="mt-2 text-sm max-w-lg" style={{ color: 'var(--text-secondary)' }}>
          Learn how to use Cosmikit to extract, sync, and generate design tokens.
        </p>
      </div>
      <DocsContent />
    </div>
  );
}
