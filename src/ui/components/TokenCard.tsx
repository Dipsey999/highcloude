interface TokenCardProps {
  label: string;
  count: number;
  icon: string;
}

export function TokenCard({ label, count, icon }: TokenCardProps) {
  return (
    <div class="token-card">
      <span class="token-card-icon">{icon}</span>
      <div class="token-card-info">
        <span class="token-card-count">{count}</span>
        <span class="token-card-label">{label}</span>
      </div>
    </div>
  );
}
