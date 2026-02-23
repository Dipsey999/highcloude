import type { ConnectionStatus } from '../../types/messages';

interface StatusBadgeProps {
  status: ConnectionStatus;
  label: string;
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  disconnected: 'Not connected',
  validating: 'Validating...',
  connected: 'Connected',
  error: 'Error',
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <div class={`status-badge ${status}`}>
      <span class="dot" />
      <span>{label}: {STATUS_LABELS[status]}</span>
    </div>
  );
}
