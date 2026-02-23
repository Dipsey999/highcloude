import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  name: string;
  githubRepo: string;
  githubBranch: string;
  syncMode: string;
  updatedAt: string;
}

export function ProjectCard({ id, name, githubRepo, githubBranch, syncMode, updatedAt }: ProjectCardProps) {
  return (
    <Link
      href={`/dashboard/projects/${id}`}
      className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-brand-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900 truncate">{name}</h3>
          <p className="mt-1 text-sm text-gray-500 truncate">{githubRepo}</p>
        </div>
        <span className="ml-4 inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {syncMode}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          {githubBranch}
        </span>
        <span>
          Updated {new Date(updatedAt).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}
