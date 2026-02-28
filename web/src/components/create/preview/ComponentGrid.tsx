'use client';

import { useMemo } from 'react';
import type { GeneratedDesignSystem } from '@/lib/ai/types';
import { generateShades } from '@/lib/design-system/color-generation';
import { ALL_COMPONENTS, type ComponentType } from '@/lib/design-system/domain-presets';
import { COMPONENT_LABELS } from '@/lib/design-system/component-templates';

interface ComponentGridProps {
  designSystem: GeneratedDesignSystem;
}

export function ComponentGrid({ designSystem }: ComponentGridProps) {
  const { config } = designSystem;
  const shades = useMemo(() => generateShades(config.color.primaryColor), [config.color.primaryColor]);
  const neutralShades = useMemo(() => generateShades('#64748b'), []);

  const bodyFont = config.typography.fontFamily;
  const radius = config.radius;
  const shadows = config.shadows;

  function renderComponent(type: ComponentType) {
    switch (type) {
      case 'button':
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              style={{
                background: shades['500'],
                color: '#ffffff',
                borderRadius: `${radius.md}px`,
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: bodyFont,
                border: 'none',
                boxShadow: shadows.sm,
                cursor: 'pointer',
              }}
            >
              Primary
            </button>
            <button
              style={{
                background: 'transparent',
                color: shades['600'],
                borderRadius: `${radius.md}px`,
                padding: '7px 15px',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: bodyFont,
                border: `1px solid ${shades['300']}`,
                cursor: 'pointer',
              }}
            >
              Secondary
            </button>
          </div>
        );

      case 'input':
        return (
          <div className="w-full space-y-1">
            <label
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: neutralShades['700'],
                fontFamily: bodyFont,
              }}
            >
              Email
            </label>
            <div
              style={{
                background: '#ffffff',
                border: `1px solid ${neutralShades['300']}`,
                borderRadius: `${radius.md}px`,
                padding: '7px 10px',
                fontSize: '13px',
                color: neutralShades['400'],
                fontFamily: bodyFont,
              }}
            >
              you@example.com
            </div>
          </div>
        );

      case 'card':
        return (
          <div
            style={{
              background: '#ffffff',
              border: `1px solid ${neutralShades['200']}`,
              borderRadius: `${radius.lg}px`,
              padding: '12px',
              boxShadow: shadows.sm,
              width: '100%',
            }}
          >
            <p style={{ fontSize: '13px', fontWeight: 600, color: neutralShades['900'], marginBottom: '4px' }}>
              Card Title
            </p>
            <p style={{ fontSize: '11px', color: neutralShades['500'], lineHeight: 1.4 }}>
              A brief description of the card content goes here.
            </p>
          </div>
        );

      case 'badge':
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                background: shades['100'],
                color: shades['700'],
                borderRadius: radius.full,
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              Primary
            </span>
            <span
              style={{
                background: '#dcfce7',
                color: '#166534',
                borderRadius: radius.full,
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              Success
            </span>
            <span
              style={{
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: radius.full,
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              Warning
            </span>
          </div>
        );

      case 'avatar':
        return (
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: radius.full,
                background: shades['100'],
                color: shades['700'],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              AJ
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: radius.full,
                background: shades['200'],
                color: shades['800'],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              KL
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: radius.full,
                background: shades['500'],
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              MR
            </div>
          </div>
        );

      case 'toggle':
        return (
          <div className="flex items-center gap-4">
            {/* On */}
            <div
              style={{
                width: '44px',
                height: '24px',
                borderRadius: radius.full,
                background: shades['500'],
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: radius.full,
                  background: '#ffffff',
                  boxShadow: shadows.sm,
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                }}
              />
            </div>
            {/* Off */}
            <div
              style={{
                width: '44px',
                height: '24px',
                borderRadius: radius.full,
                background: neutralShades['300'],
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: radius.full,
                  background: '#ffffff',
                  boxShadow: shadows.sm,
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                }}
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div
            className="w-full flex items-center justify-between"
            style={{
              background: '#ffffff',
              border: `1px solid ${neutralShades['300']}`,
              borderRadius: `${radius.md}px`,
              padding: '7px 10px',
              fontSize: '13px',
              color: neutralShades['900'],
              fontFamily: bodyFont,
            }}
          >
            <span>Select an option</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: neutralShades['400'] }}>
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );

      case 'alert':
        return (
          <div
            className="w-full flex items-start gap-2"
            style={{
              background: '#eff6ff',
              borderLeft: `3px solid #2563eb`,
              borderRadius: `${radius.md}px`,
              padding: '10px 12px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#2563eb', marginTop: '1px', flexShrink: 0 }}>
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="5" r="0.75" fill="currentColor" />
            </svg>
            <p style={{ fontSize: '12px', color: '#1e40af', lineHeight: 1.5 }}>
              This is an informational alert message.
            </p>
          </div>
        );

      case 'tooltip':
        return (
          <div className="relative inline-block">
            <div
              style={{
                background: neutralShades['900'],
                color: '#ffffff',
                borderRadius: `${radius.sm}px`,
                padding: '4px 10px',
                fontSize: '11px',
                boxShadow: shadows.md,
                whiteSpace: 'nowrap',
              }}
            >
              Tooltip text
            </div>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `5px solid ${neutralShades['900']}`,
                margin: '0 auto',
              }}
            />
            <p className="text-center mt-2" style={{ fontSize: '12px', color: neutralShades['500'] }}>
              Hover target
            </p>
          </div>
        );

      case 'modal':
        return (
          <div
            className="w-full relative"
            style={{
              background: 'rgba(0,0,0,0.15)',
              borderRadius: `${radius.md}px`,
              padding: '16px',
              minHeight: '90px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: `${radius.xl}px`,
                boxShadow: shadows.xl,
                padding: '12px 16px',
                width: '85%',
                maxWidth: '200px',
              }}
            >
              <p style={{ fontSize: '13px', fontWeight: 600, color: neutralShades['900'], marginBottom: '4px' }}>
                Confirm
              </p>
              <p style={{ fontSize: '11px', color: neutralShades['500'], marginBottom: '10px', lineHeight: 1.4 }}>
                Are you sure you want to proceed?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: `${radius.md}px`,
                    border: `1px solid ${neutralShades['300']}`,
                    background: 'transparent',
                    color: neutralShades['700'],
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: `${radius.md}px`,
                    border: 'none',
                    background: shades['500'],
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        );

      case 'tabs':
        return (
          <div className="w-full">
            <div
              className="flex"
              style={{ borderBottom: `2px solid ${neutralShades['200']}` }}
            >
              {['General', 'Profile', 'Security'].map((tab, i) => (
                <div
                  key={tab}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: i === 0 ? shades['600'] : neutralShades['500'],
                    borderBottom: i === 0 ? `2px solid ${shades['500']}` : '2px solid transparent',
                    marginBottom: '-2px',
                    cursor: 'pointer',
                    fontFamily: bodyFont,
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex flex-col gap-3">
            {/* Checked */}
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: `${radius.sm}px`,
                  background: shades['500'],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: '13px', color: neutralShades['800'] }}>Selected option</span>
            </div>
            {/* Unchecked */}
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: `${radius.sm}px`,
                  border: `1.5px solid ${neutralShades['300']}`,
                  background: '#ffffff',
                }}
              />
              <span style={{ fontSize: '13px', color: neutralShades['800'] }}>Unselected option</span>
            </div>
          </div>
        );
    }
  }

  return (
    <div className="p-6" style={{ fontFamily: bodyFont }}>
      <div className="mb-5">
        <h2
          className="text-lg font-semibold mb-1"
          style={{ color: 'var(--text-primary)', fontFamily: config.typography.headingFontFamily }}
        >
          Component Library
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          All 12 components rendered with your design system tokens.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_COMPONENTS.map((type) => {
          const meta = COMPONENT_LABELS[type];
          return (
            <div
              key={type}
              className="flex flex-col"
              style={{
                border: `1px solid ${neutralShades['200']}`,
                borderRadius: `${radius.lg}px`,
                background: '#ffffff',
                overflow: 'hidden',
              }}
            >
              {/* Label header */}
              <div
                className="px-3 py-2 border-b"
                style={{
                  borderColor: neutralShades['100'],
                  background: neutralShades['50'],
                }}
              >
                <p style={{ fontSize: '12px', fontWeight: 600, color: neutralShades['800'] }}>
                  {meta.label}
                </p>
                <p style={{ fontSize: '10px', color: neutralShades['500'], marginTop: '1px' }}>
                  {meta.description}
                </p>
              </div>

              {/* Component rendering area */}
              <div className="p-4 flex items-center justify-center min-h-[80px]">
                {renderComponent(type)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
