'use client';

import { useMemo, useState } from 'react';
import type { GeneratedDesignSystem } from '@/lib/ai/types';
import { generateShades } from '@/lib/design-system/color-generation';

interface MockSettingsProps {
  designSystem: GeneratedDesignSystem;
}

export function MockSettings({ designSystem }: MockSettingsProps) {
  const { config } = designSystem;
  const shades = useMemo(() => generateShades(config.color.primaryColor), [config.color.primaryColor]);
  const neutralShades = useMemo(() => generateShades('#64748b'), []);

  const [toggleOn, setToggleOn] = useState(true);

  const bodyFont = config.typography.fontFamily;
  const headingFont = config.typography.headingFontFamily;
  const radius = config.radius;
  const shadows = config.shadows;

  const inputStyle: React.CSSProperties = {
    background: '#ffffff',
    border: `1px solid ${neutralShades['300']}`,
    borderRadius: `${radius.md}px`,
    padding: '8px 12px',
    fontSize: '14px',
    color: neutralShades['900'],
    fontFamily: bodyFont,
    width: '100%',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: neutralShades['700'],
    fontFamily: bodyFont,
    marginBottom: '4px',
    display: 'block',
  };

  return (
    <div className="p-6" style={{ fontFamily: bodyFont }}>
      {/* Page header */}
      <div className="mb-6">
        <h1
          className="text-xl font-semibold mb-1"
          style={{ color: neutralShades['900'], fontFamily: headingFont }}
        >
          Account Settings
        </h1>
        <p className="text-sm" style={{ color: neutralShades['500'] }}>
          Manage your account preferences and profile information.
        </p>
      </div>

      {/* Settings card */}
      <div
        className="mb-6"
        style={{
          background: '#ffffff',
          borderRadius: `${radius.lg}px`,
          boxShadow: shadows.sm,
          border: `1px solid ${neutralShades['200']}`,
          overflow: 'hidden',
        }}
      >
        {/* Section header */}
        <div
          className="px-5 py-3 border-b"
          style={{ borderColor: neutralShades['200'], background: neutralShades['50'] }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: neutralShades['800'], fontFamily: headingFont }}
          >
            Profile Information
          </h2>
        </div>

        <div className="p-5 space-y-5">
          {/* Name fields row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                type="text"
                defaultValue="Alex"
                style={inputStyle}
                readOnly
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                type="text"
                defaultValue="Johnson"
                style={inputStyle}
                readOnly
              />
            </div>
          </div>

          {/* Email field */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              defaultValue="alex@company.com"
              style={inputStyle}
              readOnly
            />
          </div>

          {/* Select dropdown */}
          <div>
            <label style={labelStyle}>Role</label>
            <div
              className="flex items-center justify-between cursor-default"
              style={{
                ...inputStyle,
                width: '100%',
              }}
            >
              <span>Designer</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: neutralShades['400'] }}>
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: neutralShades['800'] }}>
                Email Notifications
              </p>
              <p className="text-xs" style={{ color: neutralShades['500'] }}>
                Receive email updates about account activity
              </p>
            </div>
            <button
              onClick={() => setToggleOn(!toggleOn)}
              className="relative shrink-0 transition-colors duration-200"
              style={{
                width: '44px',
                height: '24px',
                borderRadius: radius.full,
                background: toggleOn ? shades['500'] : neutralShades['300'],
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div
                className="absolute top-0.5 transition-transform duration-200"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: radius.full,
                  background: '#ffffff',
                  boxShadow: shadows.sm,
                  transform: toggleOn ? 'translateX(22px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification preferences card */}
      <div
        className="mb-6"
        style={{
          background: '#ffffff',
          borderRadius: `${radius.lg}px`,
          boxShadow: shadows.sm,
          border: `1px solid ${neutralShades['200']}`,
          overflow: 'hidden',
        }}
      >
        <div
          className="px-5 py-3 border-b"
          style={{ borderColor: neutralShades['200'], background: neutralShades['50'] }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: neutralShades['800'], fontFamily: headingFont }}
          >
            Preferences
          </h2>
        </div>

        <div className="p-5 space-y-4">
          {/* Textarea */}
          <div>
            <label style={labelStyle}>Bio</label>
            <textarea
              defaultValue="Product designer passionate about creating intuitive user experiences."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'none',
              }}
              readOnly
            />
          </div>

          {/* Select */}
          <div>
            <label style={labelStyle}>Language</label>
            <div
              className="flex items-center justify-between cursor-default"
              style={inputStyle}
            >
              <span>English (US)</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: neutralShades['400'] }}>
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label style={labelStyle}>Timezone</label>
            <div
              className="flex items-center justify-between cursor-default"
              style={inputStyle}
            >
              <span>UTC-08:00 Pacific Time</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: neutralShades['400'] }}>
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          className="px-4 py-2 text-sm font-medium transition-colors"
          style={{
            color: neutralShades['700'],
            background: 'transparent',
            border: `1px solid ${neutralShades['300']}`,
            borderRadius: `${radius.md}px`,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          className="px-5 py-2 text-sm font-medium transition-colors"
          style={{
            background: shades['500'],
            color: '#ffffff',
            borderRadius: `${radius.md}px`,
            boxShadow: shadows.sm,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
