import { KeysForm } from '@/components/KeysForm';

export default function KeysPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your keys are encrypted and only accessible by you and your Figma plugin.
        </p>
      </div>
      <div className="max-w-xl">
        <KeysForm />
      </div>
    </div>
  );
}
