'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderIcon, KeyIcon, LinkIcon, SparklesIcon } from '@/components/Icons';

const mainLinks = [
  { href: '/dashboard', label: 'Projects', icon: FolderIcon },
  { href: '/dashboard/keys', label: 'API Keys', icon: KeyIcon },
  { href: '/dashboard/plugin-token', label: 'Plugin Token', icon: LinkIcon },
];

const tokenLinks = [
  { href: '/dashboard/tokens', label: 'Tokens', icon: SparklesIcon },
];

function SidebarLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
        isActive ? 'font-medium' : ''
      }`}
      style={{
        color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
        background: isActive ? 'var(--brand-subtle)' : 'transparent',
      }}
    >
      {isActive && (
        <span
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
          style={{
            background: `linear-gradient(to bottom, var(--gradient-from), var(--gradient-to))`,
          }}
        />
      )}
      <Icon className="h-[18px] w-[18px]" />
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/projects');
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 border-r p-4"
        style={{
          borderColor: 'var(--border-primary)',
          background: 'var(--bg-elevated)',
        }}
      >
        <nav className="flex flex-col gap-1">
          {mainLinks.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              isActive={isActive(link.href)}
            />
          ))}

          {/* Separator */}
          <div
            className="my-3 border-t"
            style={{ borderColor: 'var(--border-primary)' }}
          />

          {tokenLinks.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              isActive={isActive(link.href)}
            />
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8" style={{ background: 'var(--bg-primary)' }}>
        {children}
      </main>
    </div>
  );
}
