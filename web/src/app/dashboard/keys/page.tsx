import { KeysForm } from '@/components/KeysForm';

export default function KeysPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
        <p className="mt-2 text-sm text-gray-500 max-w-lg">
          Connect your Claude and GitHub accounts to enable AI features and repository sync.
          Follow the guides below to get your keys — it only takes a minute.
        </p>
      </div>
      <div className="max-w-xl">
        <KeysForm />
      </div>
    </div>
  );
}
