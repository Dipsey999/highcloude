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
  const colors = {
    online: 'bg-green-500',
    recent: 'bg-amber-500',
    offline: 'bg-gray-400',
  };

  return (
    <span className="relative flex h-3 w-3">
      {status === 'online' && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
      )}
      <span className={`relative inline-flex h-3 w-3 rounded-full ${colors[status]}`} />
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

    // Poll every 15 seconds
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
          <span className="text-sm text-gray-400">Checking plugin status...</span>
        </div>
      </div>
    );
  }

  if (!pluginStatus) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <StatusDot status="offline" />
          <span className="text-sm text-gray-500">Plugin status unavailable</span>
        </div>
      </div>
    );
  }

  const statusLabels = {
    online: 'Online',
    recent: 'Recently Active',
    offline: 'Offline',
  };

  const statusTextColors = {
    online: 'text-green-700',
    recent: 'text-amber-700',
    offline: 'text-gray-500',
  };

  const statusBgColors = {
    online: 'bg-green-50 border-green-200',
    recent: 'bg-amber-50 border-amber-200',
    offline: 'bg-white border-gray-200',
  };

  return (
    <div className={`rounded-xl border p-4 ${statusBgColors[pluginStatus.status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusDot status={pluginStatus.status} />
          <div>
            <p className={`text-sm font-semibold ${statusTextColors[pluginStatus.status]}`}>
              Figma Plugin {statusLabels[pluginStatus.status]}
            </p>
            {pluginStatus.lastSeen && (
              <p className="text-xs text-gray-400">
                Last seen {formatRelativeTime(pluginStatus.lastSeen)}
              </p>
            )}
          </div>
        </div>

        {/* Right side info */}
        <div className="text-right">
          {pluginStatus.figmaFileName && (
            <p className="text-xs text-gray-500">
              <span className="text-gray-400">File: </span>
              {pluginStatus.figmaFileName}
            </p>
          )}
          {pluginStatus.lastSnapshotAt && (
            <p className="text-xs text-gray-400">
              Last push {formatRelativeTime(pluginStatus.lastSnapshotAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
