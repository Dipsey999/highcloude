'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderIcon, KeyIcon, LinkIcon } from '@/components/Icons';

const sidebarLinks = [
  { href: '/dashboard', label: 'Projects', icon: FolderIcon },
  { href: '/dashboard/keys', label: 'API Keys', icon: KeyIcon },
  { href: '/dashboard/plugin-token', label: 'Plugin Token', icon: LinkIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === '/dashboard'
                ? pathname === '/dashboard' || pathname.startsWith('/dashboard/projects')
                : pathname.startsWith(link.href);

            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
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
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8" style={{ background: 'var(--bg-primary)' }}>
        {children}
      </main>
    </div>
  );
}
