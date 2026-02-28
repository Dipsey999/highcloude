'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaletteIcon, LinkIcon, ArrowRightIcon } from '@/components/Icons';

interface DesignSystemSourcePickerProps {
  projectId: string;
  projectName: string;
}

export function DesignSystemSourcePicker({ projectId, projectName }: DesignSystemSourcePickerProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<'scratch' | 'figma' | 'skip' | null>(null);

  function handleContinue() {
    if (selected === 'scratch') {
      // Navigate to the project detail page with the design system tab active
      router.push(`/dashboard/projects/${projectId}?tab=design-system&setup=scratch`);
    } else if (selected === 'figma') {
      router.push(`/dashboard/projects/${projectId}?tab=design-system&setup=figma`);
    } else {
      // Skip — go to project detail
      router.push(`/dashboard/projects/${projectId}`);
    }
  }

  const options = [
    {
      id: 'scratch' as const,
      icon: <PaletteIcon className="h-6 w-6" />,
      title: 'Create from scratch',
      description: 'Build a custom design system with our Radix-inspired theme builder. Pick colors, typography, and components.',
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    },
    {
      id: 'figma' as const,
      icon: <LinkIcon className="h-6 w-6" />,
      title: 'Import from Figma',
      description: 'Use the Cosmikit Figma plugin to extract variables and styles from your existing Figma file.',
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    },
    {
      id: 'skip' as const,
      icon: <ArrowRightIcon className="h-6 w-6" />,
      title: 'Skip for now',
      description: 'Create the project without a design system. You can always add one later from the project settings.',
      gradient: 'linear-gradient(135deg, var(--text-tertiary), var(--text-secondary))',
    },
  ];

  return (
    <div className="max-w-2xl">
      <div className="grid gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelected(option.id)}
            className="group relative flex items-start gap-5 rounded-2xl border p-6 text-left transition-all duration-200 hover:-translate-y-0.5"
            style={{
              borderColor: selected === option.id ? 'var(--brand)' : 'var(--border-primary)',
              background: selected === option.id ? 'var(--brand-subtle)' : 'var(--bg-elevated)',
              boxShadow: selected === option.id ? '0 0 0 1px var(--brand)' : 'none',
            }}
          >
            {/* Icon */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: option.gradient }}
            >
              {option.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {option.title}
              </h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {option.description}
              </p>
            </div>

            {/* Radio indicator */}
            <div
              className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200"
              style={{
                borderColor: selected === option.id ? 'var(--brand)' : 'var(--border-primary)',
              }}
            >
              {selected === option.id && (
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: 'var(--brand)' }}
                />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="btn-gradient flex-1 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selected === 'skip' ? 'Go to Project' : selected ? 'Continue' : 'Choose an option'}
        </button>
      </div>
    </div>
  );
}
