interface ConfidenceBadgeProps {
  confidence: number;
  matchType: 'exact' | 'close' | 'approximate';
}

export function ConfidenceBadge({ confidence, matchType }: ConfidenceBadgeProps) {
  const percent = Math.round(confidence * 100);

  let level: string;
  if (confidence >= 0.9) {
    level = 'high';
  } else if (confidence >= 0.7) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return (
    <span class={`confidence-badge confidence-${level}`} title={`${matchType} match`}>
      {percent}%
    </span>
  );
}
