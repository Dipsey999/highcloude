import type { Metadata } from 'next';
import { SessionProvider } from '@/components/SessionProvider';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Claude Bridge — Design System Sync for Figma',
  description: 'Sync design tokens between Figma and GitHub with AI-powered assistance.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
