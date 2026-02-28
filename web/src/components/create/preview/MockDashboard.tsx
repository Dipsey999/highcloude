'use client';

import { useMemo } from 'react';
import type { GeneratedDesignSystem } from '@/lib/ai/types';
import { generateShades } from '@/lib/design-system/color-generation';

interface MockDashboardProps {
  designSystem: GeneratedDesignSystem;
}

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', active: true },
  { label: 'Analytics', active: false },
  { label: 'Projects', active: false },
  { label: 'Team', active: false },
  { label: 'Settings', active: false },
];

const STAT_CARDS = [
  { label: 'Total Users', value: '12,847', change: '+12.5%' },
  { label: 'Revenue', value: '$48.2k', change: '+8.1%' },
  { label: 'Active Projects', value: '34', change: '+3' },
];

const TABLE_ROWS = [
  { name: 'Website Redesign', status: 'In Progress', assignee: 'AK', date: 'Feb 14' },
  { name: 'Mobile App v2', status: 'Review', assignee: 'JD', date: 'Feb 12' },
  { name: 'API Integration', status: 'Completed', assignee: 'SM', date: 'Feb 10' },
  { name: 'Brand Guidelines', status: 'In Progress', assignee: 'LR', date: 'Feb 8' },
  { name: 'User Research', status: 'Planning', assignee: 'TC', date: 'Feb 6' },
];

export function MockDashboard({ designSystem }: MockDashboardProps) {
  const { config } = designSystem;
  const shades = useMemo(() => generateShades(config.color.primaryColor), [config.color.primaryColor]);

  const neutralShades = useMemo(() => generateShades('#64748b'), []);

  const bodyFont = config.typography.fontFamily;
  const headingFont = config.typography.headingFontFamily;
  const radius = config.radius;
  const shadows = config.shadows;

  const statusColor = (status: string) => {
    switch (status) {
      case 'Completed': return { bg: '#dcfce7', text: '#166534' };
      case 'In Progress': return { bg: `${shades['100']}`, text: shades['700'] };
      case 'Review': return { bg: '#fef3c7', text: '#92400e' };
      default: return { bg: neutralShades['100'], text: neutralShades['700'] };
    }
  };

  return (
    <div className="flex h-full min-h-[480px]" style={{ fontFamily: bodyFont }}>
      {/* Sidebar */}
      <div
        className="w-48 shrink-0 flex flex-col py-4 px-3"
        style={{ background: shades['900'] }}
      >
        {/* Logo area */}
        <div className="flex items-center gap-2 px-2 mb-6">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: shades['500'], color: '#ffffff' }}
          >
            {designSystem.name.charAt(0).toUpperCase()}
          </div>
          <span
            className="text-sm font-semibold truncate"
            style={{ color: shades['100'], fontFamily: headingFont }}
          >
            {designSystem.name}
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1">
          {SIDEBAR_ITEMS.map((item) => (
            <div
              key={item.label}
              className="px-3 py-2 text-sm rounded-md cursor-default transition-colors"
              style={{
                background: item.active ? shades['800'] : 'transparent',
                color: item.active ? shades['100'] : shades['400'],
                borderRadius: `${radius.md}px`,
                fontWeight: item.active ? 500 : 400,
              }}
            >
              {item.label}
            </div>
          ))}
        </nav>

        {/* Bottom spacer */}
        <div className="mt-auto px-3 py-2">
          <div
            className="flex items-center gap-2"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium"
              style={{ background: shades['700'], color: shades['200'] }}
            >
              U
            </div>
            <span className="text-xs" style={{ color: shades['400'] }}>user@email.com</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{ borderColor: neutralShades['200'] }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: neutralShades['400'] }}>
              <span>Home</span>
              <span>/</span>
              <span style={{ color: neutralShades['600'] }}>Dashboard</span>
            </div>
            <h1
              className="text-lg font-semibold"
              style={{ color: neutralShades['900'], fontFamily: headingFont }}
            >
              Dashboard
            </h1>
          </div>
          <button
            className="px-4 py-2 text-sm font-medium"
            style={{
              background: shades['500'],
              color: '#ffffff',
              borderRadius: `${radius.md}px`,
              boxShadow: shadows.sm,
            }}
          >
            + New
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: neutralShades['50'] }}>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {STAT_CARDS.map((card) => (
              <div
                key={card.label}
                className="p-4"
                style={{
                  background: '#ffffff',
                  borderRadius: `${radius.lg}px`,
                  boxShadow: shadows.sm,
                  border: `1px solid ${neutralShades['200']}`,
                }}
              >
                <p className="text-xs mb-1" style={{ color: neutralShades['500'] }}>
                  {card.label}
                </p>
                <p
                  className="text-xl font-semibold mb-1"
                  style={{ color: neutralShades['900'], fontFamily: headingFont }}
                >
                  {card.value}
                </p>
                <p className="text-xs font-medium" style={{ color: '#16a34a' }}>
                  {card.change}
                </p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: `${radius.lg}px`,
              boxShadow: shadows.sm,
              border: `1px solid ${neutralShades['200']}`,
              overflow: 'hidden',
            }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between border-b"
              style={{ borderColor: neutralShades['200'] }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: neutralShades['900'], fontFamily: headingFont }}
              >
                Recent Projects
              </h2>
              <span className="text-xs" style={{ color: shades['500'], cursor: 'pointer' }}>
                View all
              </span>
            </div>

            {/* Table header */}
            <div
              className="grid grid-cols-4 px-4 py-2 text-xs font-medium border-b"
              style={{
                color: neutralShades['500'],
                borderColor: neutralShades['100'],
                background: neutralShades['50'],
              }}
            >
              <span>Project</span>
              <span>Status</span>
              <span>Assignee</span>
              <span>Date</span>
            </div>

            {/* Table rows */}
            {TABLE_ROWS.map((row, i) => (
              <div
                key={row.name}
                className="grid grid-cols-4 px-4 py-2.5 text-sm items-center border-b last:border-b-0"
                style={{
                  borderColor: neutralShades['100'],
                  background: i % 2 === 1 ? neutralShades['50'] : '#ffffff',
                  color: neutralShades['800'],
                }}
              >
                <span className="font-medium text-xs" style={{ color: neutralShades['900'] }}>
                  {row.name}
                </span>
                <span>
                  <span
                    className="inline-block px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: statusColor(row.status).bg,
                      color: statusColor(row.status).text,
                      borderRadius: radius.full,
                    }}
                  >
                    {row.status}
                  </span>
                </span>
                <span>
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 text-[10px] font-medium"
                    style={{
                      background: shades['100'],
                      color: shades['700'],
                      borderRadius: radius.full,
                    }}
                  >
                    {row.assignee}
                  </span>
                </span>
                <span className="text-xs" style={{ color: neutralShades['500'] }}>
                  {row.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
