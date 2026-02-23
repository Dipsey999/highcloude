'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarLinks = [
  { href: '/dashboard', label: 'Projects', icon: '📁' },
  { href: '/dashboard/keys', label: 'API Keys', icon: '🔑' },
  { href: '/dashboard/plugin-token', label: 'Plugin Token', icon: '🔗' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-4">
        <nav className="flex flex-col gap-1">
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === '/dashboard'
                ? pathname === '/dashboard' || pathname.startsWith('/dashboard/projects')
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
