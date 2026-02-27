'use client';

import { useEffect, useState, useCallback } from 'react';

interface PluginStatusBadgeProps {
  projectId: string;
}

interface PluginStatus {
  status: 'online' | 'recent' | 'offline';
  lastSeen: string | null;
  figmaFileName: string | null;
  activeProjectId: string | null;
  lastSnapshotAt: string | null;
  snapshotFigmaFileName: string | null;
}

function StatusDot({ status }: { status: PluginStatus['status'] }) {
  return (
    <span className="relative flex h-3 w-3">
      {status === 'online' && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'var(--success)' }} />
      )}
      <span
        className={`relative inline-flex h-3 w-3 rounded-full ${status === 'online' ? 'status-online' : status === 'recent' ? 'status-recent' : ''}`}
        style={{
          background: status === 'online' ? 'var(--success)' : status === 'recent' ? 'var(--warning)' : 'var(--text-tertiary)',
        }}
      />
    </span>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function PluginStatusBadge({ projectId }: PluginStatusBadgeProps) {
  const [pluginStatus, setPluginStatus] = useState<PluginStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/plugin/status?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setPluginStatus(data);
      }
    } catch {
      // Silently ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="card rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Checking plugin status...</span>
        </div>
      </div>
    );
  }

  if (!pluginStatus) {
    return (
      <div className="card rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <StatusDot status="offline" />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Plugin status unavailable</span>
        </div>
      </div>
    );
  }

  const statusLabels = { online: 'Online', recent: 'Recently Active', offline: 'Offline' };

  const borderColorMap = {
    online: 'var(--success)',
    recent: 'var(--warning)',
    offline: 'var(--border-primary)',
  };

  return (
    <div
      className="rounded-2xl border p-4 transition-all duration-200"
      style={{
        borderColor: borderColorMap[pluginStatus.status],
        background: pluginStatus.status === 'online'
          ? 'var(--success-subtle)'
          : pluginStatus.status === 'recent'
          ? 'var(--warning-subtle)'
          : 'var(--bg-elevated)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusDot status={pluginStatus.status} />
          <div>
            <p className="text-sm font-semibold" style={{
              color: pluginStatus.status === 'online'
                ? 'var(--success)'
                : pluginStatus.status === 'recent'
                ? 'var(--warning)'
                : 'var(--text-secondary)',
            }}>
              Figma Plugin {statusLabels[pluginStatus.status]}
            </p>
            {pluginStatus.lastSeen && (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Last seen {formatRelativeTime(pluginStatus.lastSeen)}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          {pluginStatus.figmaFileName && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>File: </span>
              {pluginStatus.figmaFileName}
            </p>
          )}
          {pluginStatus.lastSnapshotAt && (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Last push {formatRelativeTime(pluginStatus.lastSnapshotAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
