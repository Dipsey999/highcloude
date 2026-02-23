interface ColorSwatchProps {
  color: string;
  size?: number;
}

export function ColorSwatch({ color, size = 16 }: ColorSwatchProps) {
  const isHex = color.startsWith('#');

  return (
    <span class="color-swatch-wrapper">
      {isHex && (
        <span
          class="color-swatch"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
          }}
        />
      )}
      <span class="color-swatch-label">{color}</span>
    </span>
  );
}
