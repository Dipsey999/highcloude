'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DOMAIN_PRESETS, TYPE_SCALE_RATIOS, FONT_OPTIONS, ALL_COMPONENTS } from '@/lib/design-system/domain-presets';
import type { DomainType, TypeScale, ComponentType } from '@/lib/design-system/domain-presets';
import type { PaletteMode } from '@/lib/design-system/color-generation';
import { generateFullPalette, generateShades } from '@/lib/design-system/color-generation';
import { ColorPalettePreview, SemanticColorDots } from './ColorPalettePreview';
import { COMPONENT_LABELS } from '@/lib/design-system/component-templates';

const STEPS = [
  'Domain & Identity',
  'Colors',
  'Typography',
  'Spacing & Shape',
  'Components',
  'Review & Create',
];

const PALETTE_MODES: { value: PaletteMode; label: string; description: string }[] = [
  { value: 'complementary', label: 'Complementary', description: 'Opposite hues for high contrast' },
  { value: 'analogous', label: 'Analogous', description: 'Adjacent hues for harmony' },
  { value: 'triadic', label: 'Triadic', description: 'Three evenly spaced hues' },
  { value: 'split-complementary', label: 'Split Comp.', description: 'Softer contrast, more variety' },
];

const RADIUS_PRESETS = [
  { label: 'Sharp', values: { none: 0, sm: 2, md: 4, lg: 6, xl: 8, full: '9999px' } },
  { label: 'Rounded', values: { none: 0, sm: 6, md: 10, lg: 14, xl: 20, full: '9999px' } },
  { label: 'Pill', values: { none: 0, sm: 8, md: 16, lg: 24, xl: 32, full: '9999px' } },
] as const;

const SHADOW_PRESETS = [
  {
    label: 'Subtle',
    values: {
      sm: '0 1px 2px rgba(0,0,0,0.04)',
      md: '0 2px 6px rgba(0,0,0,0.06)',
      lg: '0 6px 16px rgba(0,0,0,0.08)',
      xl: '0 12px 28px rgba(0,0,0,0.1)',
    },
  },
  {
    label: 'Medium',
    values: {
      sm: '0 1px 3px rgba(0,0,0,0.06)',
      md: '0 4px 12px rgba(0,0,0,0.08)',
      lg: '0 12px 28px rgba(0,0,0,0.1)',
      xl: '0 20px 44px rgba(0,0,0,0.12)',
    },
  },
  {
    label: 'Bold',
    values: {
      sm: '0 2px 4px rgba(0,0,0,0.08)',
      md: '0 6px 16px rgba(0,0,0,0.12)',
      lg: '0 16px 40px rgba(0,0,0,0.16)',
      xl: '0 28px 56px rgba(0,0,0,0.18)',
    },
  },
] as const;

export function DesignSystemWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 0: Domain & Identity
  const [domain, setDomain] = useState<DomainType>('tech');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [productName, setProductName] = useState('');

  // Step 1: Colors
  const [primaryColor, setPrimaryColor] = useState(DOMAIN_PRESETS.tech.primaryColor);
  const [paletteMode, setPaletteMode] = useState<PaletteMode>(DOMAIN_PRESETS.tech.paletteMode);

  // Step 2: Typography
  const [fontFamily, setFontFamily] = useState(DOMAIN_PRESETS.tech.typography.fontFamily);
  const [headingFontFamily, setHeadingFontFamily] = useState(DOMAIN_PRESETS.tech.typography.headingFontFamily);
  const [baseSize, setBaseSize] = useState(DOMAIN_PRESETS.tech.typography.baseSize);
  const [typeScale, setTypeScale] = useState<TypeScale>(DOMAIN_PRESETS.tech.typography.scale);
  const [weights, setWeights] = useState<number[]>(DOMAIN_PRESETS.tech.typography.weights);

  // Step 3: Spacing & Shape
  const [baseUnit, setBaseUnit] = useState(DOMAIN_PRESETS.tech.spacing.baseUnit);
  const [radiusPreset, setRadiusPreset] = useState(1); // index into RADIUS_PRESETS
  const [shadowPreset, setShadowPreset] = useState(1);

  // Step 4: Components
  const [selectedComponents, setSelectedComponents] = useState<ComponentType[]>([...ALL_COMPONENTS]);

  function applyDomainPreset(d: DomainType) {
    const preset = DOMAIN_PRESETS[d];
    setDomain(d);
    setPrimaryColor(preset.primaryColor);
    setPaletteMode(preset.paletteMode);
    setFontFamily(preset.typography.fontFamily);
    setHeadingFontFamily(preset.typography.headingFontFamily);
    setBaseSize(preset.typography.baseSize);
    setTypeScale(preset.typography.scale);
    setWeights([...preset.typography.weights]);
    setBaseUnit(preset.spacing.baseUnit);
    setSelectedComponents([...preset.suggestedComponents]);
  }

  function toggleComponent(c: ComponentType) {
    setSelectedComponents((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function toggleAllComponents() {
    if (selectedComponents.length === ALL_COMPONENTS.length) {
      setSelectedComponents([]);
    } else {
      setSelectedComponents([...ALL_COMPONENTS]);
    }
  }

  function toggleWeight(w: number) {
    setWeights((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort((a, b) => a - b)
    );
  }

  const palette = generateFullPalette(primaryColor, paletteMode);
  const primaryShades = generateShades(primaryColor);

  async function handleCreate() {
    if (!name.trim()) {
      setError('Please enter a design system name');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      domain,
      companyName: companyName.trim() || null,
      productName: productName.trim() || null,
      colorConfig: { primaryColor, paletteMode },
      typographyConfig: {
        fontFamily,
        headingFontFamily,
        baseSize,
        scale: typeScale,
        weights,
      },
      spacingConfig: {
        baseUnit,
        scale: DOMAIN_PRESETS[domain].spacing.scale,
      },
      radiusConfig: RADIUS_PRESETS[radiusPreset].values,
      shadowConfig: SHADOW_PRESETS[shadowPreset].values,
      componentConfig: { selectedComponents },
    };

    try {
      const res = await fetch('/api/design-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create design system');
      }

      router.push('/dashboard/design-systems');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  function canProceed() {
    if (step === 0) return name.trim().length > 0;
    if (step === 4) return selectedComponents.length > 0;
    return true;
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
                style={
                  i <= step
                    ? {
                        background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                        color: '#fff',
                      }
                    : {
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-tertiary)',
                        border: '1px solid var(--border-primary)',
                      }
                }
              >
                {i + 1}
              </div>
              <span
                className="hidden lg:inline text-xs font-medium"
                style={{ color: i <= step ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className="hidden lg:block h-px w-6"
                  style={{
                    background: i < step
                      ? 'linear-gradient(90deg, var(--gradient-from), var(--gradient-to))'
                      : 'var(--border-primary)',
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm font-medium lg:hidden" style={{ color: 'var(--text-secondary)' }}>
          Step {step + 1}: {STEPS[step]}
        </p>
      </div>

      {/* Step Content */}
      <div
        className="rounded-2xl border p-8 mb-6"
        style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
      >
        {step === 0 && (
          <StepDomainIdentity
            domain={domain}
            onDomainChange={applyDomainPreset}
            name={name}
            onNameChange={setName}
            companyName={companyName}
            onCompanyNameChange={setCompanyName}
            productName={productName}
            onProductNameChange={setProductName}
          />
        )}

        {step === 1 && (
          <StepColors
            primaryColor={primaryColor}
            onPrimaryColorChange={setPrimaryColor}
            paletteMode={paletteMode}
            onPaletteModeChange={setPaletteMode}
            palette={palette}
            primaryShades={primaryShades}
            domain={domain}
          />
        )}

        {step === 2 && (
          <StepTypography
            fontFamily={fontFamily}
            onFontFamilyChange={setFontFamily}
            headingFontFamily={headingFontFamily}
            onHeadingFontFamilyChange={setHeadingFontFamily}
            baseSize={baseSize}
            onBaseSizeChange={setBaseSize}
            typeScale={typeScale}
            onTypeScaleChange={setTypeScale}
            weights={weights}
            onToggleWeight={toggleWeight}
          />
        )}

        {step === 3 && (
          <StepSpacingShape
            baseUnit={baseUnit}
            onBaseUnitChange={setBaseUnit}
            radiusPreset={radiusPreset}
            onRadiusPresetChange={setRadiusPreset}
            shadowPreset={shadowPreset}
            onShadowPresetChange={setShadowPreset}
          />
        )}

        {step === 4 && (
          <StepComponents
            selectedComponents={selectedComponents}
            onToggleComponent={toggleComponent}
            onToggleAll={toggleAllComponents}
          />
        )}

        {step === 5 && (
          <StepReview
            name={name}
            domain={domain}
            companyName={companyName}
            productName={productName}
            primaryColor={primaryColor}
            paletteMode={paletteMode}
            fontFamily={fontFamily}
            headingFontFamily={headingFontFamily}
            baseSize={baseSize}
            typeScale={typeScale}
            baseUnit={baseUnit}
            radiusPreset={radiusPreset}
            shadowPreset={shadowPreset}
            selectedComponents={selectedComponents}
            palette={palette}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm mb-6 border-l-4"
          style={{ background: 'var(--error-subtle)', color: 'var(--error)', borderLeftColor: 'var(--error)' }}
        >
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="btn-ghost rounded-xl px-6 py-2.5 text-sm font-medium"
          >
            Back
          </button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="btn-gradient rounded-xl px-6 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">Next</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !canProceed()}
            className="btn-gradient rounded-xl px-8 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">
              {saving ? 'Creating...' : 'Create Design System'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step 0: Domain & Identity ──

function StepDomainIdentity({
  domain,
  onDomainChange,
  name,
  onNameChange,
  companyName,
  onCompanyNameChange,
  productName,
  onProductNameChange,
}: {
  domain: DomainType;
  onDomainChange: (d: DomainType) => void;
  name: string;
  onNameChange: (v: string) => void;
  companyName: string;
  onCompanyNameChange: (v: string) => void;
  productName: string;
  onProductNameChange: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Choose Your Domain
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Select your industry to get curated defaults for colors, typography, and spacing.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.values(DOMAIN_PRESETS)).map((preset) => (
            <button
              key={preset.domain}
              type="button"
              onClick={() => onDomainChange(preset.domain)}
              className="rounded-xl border p-4 text-left transition-all duration-200"
              style={
                domain === preset.domain
                  ? {
                      background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                      borderColor: 'transparent',
                      color: '#fff',
                    }
                  : {
                      borderColor: 'var(--border-primary)',
                      background: 'var(--bg-tertiary)',
                    }
              }
            >
              <span className="text-xl">{preset.emoji}</span>
              <div
                className="mt-1 text-sm font-semibold"
                style={domain !== preset.domain ? { color: 'var(--text-primary)' } : undefined}
              >
                {preset.label}
              </div>
              <div
                className="mt-0.5 text-xs leading-tight"
                style={domain !== preset.domain ? { color: 'var(--text-tertiary)' } : { opacity: 0.8 }}
              >
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Design System Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Acme Design System"
            className="input w-full rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="Acme Inc."
            className="input w-full rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Product Name
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => onProductNameChange(e.target.value)}
            placeholder="AcmeCloud"
            className="input w-full rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Colors ──

function StepColors({
  primaryColor,
  onPrimaryColorChange,
  paletteMode,
  onPaletteModeChange,
  palette,
  primaryShades,
  domain,
}: {
  primaryColor: string;
  onPrimaryColorChange: (v: string) => void;
  paletteMode: PaletteMode;
  onPaletteModeChange: (v: PaletteMode) => void;
  palette: ReturnType<typeof generateFullPalette>;
  primaryShades: Record<string, string>;
  domain: DomainType;
}) {
  const domainSwatches = Object.values(DOMAIN_PRESETS).map((p) => p.primaryColor);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Primary Color
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Choose your brand color. All other colors will be generated from it.
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="h-12 w-12 cursor-pointer rounded-xl border-2"
              style={{ borderColor: 'var(--border-primary)' }}
            />
          </div>
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => {
              if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                onPrimaryColorChange(e.target.value);
              }
            }}
            className="input w-32 rounded-xl px-3.5 py-2.5 text-sm font-mono"
            maxLength={7}
          />
          <div className="flex gap-1.5">
            {domainSwatches.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onPrimaryColorChange(hex)}
                className="h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: hex,
                  borderColor: hex === primaryColor ? 'var(--text-primary)' : 'transparent',
                }}
                title={hex}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Palette Mode
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PALETTE_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => onPaletteModeChange(mode.value)}
              className="rounded-xl border p-3 text-left transition-all duration-200"
              style={
                paletteMode === mode.value
                  ? {
                      background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                      borderColor: 'transparent',
                      color: '#fff',
                    }
                  : {
                      borderColor: 'var(--border-primary)',
                      background: 'var(--bg-tertiary)',
                    }
              }
            >
              <div
                className="text-sm font-semibold"
                style={paletteMode !== mode.value ? { color: 'var(--text-primary)' } : undefined}
              >
                {mode.label}
              </div>
              <div
                className="text-xs mt-0.5"
                style={paletteMode !== mode.value ? { color: 'var(--text-tertiary)' } : { opacity: 0.8 }}
              >
                {mode.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Palette preview */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
          Generated Palette Preview
        </label>
        <div className="space-y-3">
          <ColorPalettePreview shades={palette.primary} label="Primary" />
          <ColorPalettePreview shades={palette.secondary} label="Secondary" />
          <ColorPalettePreview shades={palette.accent} label="Accent" />
          <ColorPalettePreview shades={palette.neutral} label="Neutral" compact />
        </div>
        <div className="mt-4">
          <SemanticColorDots colors={palette} />
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Typography ──

function StepTypography({
  fontFamily,
  onFontFamilyChange,
  headingFontFamily,
  onHeadingFontFamilyChange,
  baseSize,
  onBaseSizeChange,
  typeScale,
  onTypeScaleChange,
  weights,
  onToggleWeight,
}: {
  fontFamily: string;
  onFontFamilyChange: (v: string) => void;
  headingFontFamily: string;
  onHeadingFontFamilyChange: (v: string) => void;
  baseSize: number;
  onBaseSizeChange: (v: number) => void;
  typeScale: TypeScale;
  onTypeScaleChange: (v: TypeScale) => void;
  weights: number[];
  onToggleWeight: (w: number) => void;
}) {
  const ratio = TYPE_SCALE_RATIOS[typeScale];
  const typeSteps = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        Typography
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Body Font
          </label>
          <select
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            className="input w-full rounded-xl px-3.5 py-2.5 text-sm"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Heading Font
          </label>
          <select
            value={headingFontFamily}
            onChange={(e) => onHeadingFontFamilyChange(e.target.value)}
            className="input w-full rounded-xl px-3.5 py-2.5 text-sm"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Base Size: {baseSize}px
        </label>
        <input
          type="range"
          min={14}
          max={20}
          value={baseSize}
          onChange={(e) => onBaseSizeChange(Number(e.target.value))}
          className="w-full accent-[var(--brand)]"
        />
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>14px</span>
          <span>20px</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Type Scale
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(TYPE_SCALE_RATIOS) as [TypeScale, number][]).map(([scale, r]) => (
            <button
              key={scale}
              type="button"
              onClick={() => onTypeScaleChange(scale)}
              className="rounded-xl border p-3 text-left transition-all duration-200"
              style={
                typeScale === scale
                  ? {
                      background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                      borderColor: 'transparent',
                      color: '#fff',
                    }
                  : {
                      borderColor: 'var(--border-primary)',
                      background: 'var(--bg-tertiary)',
                    }
              }
            >
              <div
                className="text-sm font-semibold capitalize"
                style={typeScale !== scale ? { color: 'var(--text-primary)' } : undefined}
              >
                {scale.replace('-', ' ')}
              </div>
              <div
                className="text-xs mt-0.5 font-mono"
                style={typeScale !== scale ? { color: 'var(--text-tertiary)' } : { opacity: 0.8 }}
              >
                {r}:1
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Font Weights
        </label>
        <div className="flex flex-wrap gap-2">
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onToggleWeight(w)}
              className="rounded-lg border px-3 py-1.5 text-sm transition-all duration-200"
              style={
                weights.includes(w)
                  ? {
                      background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                      borderColor: 'transparent',
                      color: '#fff',
                    }
                  : {
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-tertiary)',
                    }
              }
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Type scale preview */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
          Scale Preview
        </label>
        <div
          className="rounded-xl border p-4 space-y-1"
          style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
        >
          {typeSteps.map((stepName, i) => {
            const scale = Math.pow(ratio, i - 2);
            const px = Math.round(baseSize * scale * 100) / 100;
            return (
              <div key={stepName} className="flex items-baseline gap-3">
                <span className="w-10 text-right text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {stepName}
                </span>
                <span
                  className="truncate"
                  style={{ fontSize: `${Math.min(px, 36)}px`, color: 'var(--text-primary)' }}
                >
                  {px}px
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Spacing & Shape ──

function StepSpacingShape({
  baseUnit,
  onBaseUnitChange,
  radiusPreset,
  onRadiusPresetChange,
  shadowPreset,
  onShadowPresetChange,
}: {
  baseUnit: number;
  onBaseUnitChange: (v: number) => void;
  radiusPreset: number;
  onRadiusPresetChange: (v: number) => void;
  shadowPreset: number;
  onShadowPresetChange: (v: number) => void;
}) {
  const spacingScale = [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        Spacing & Shape
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Base Unit: {baseUnit}px
        </label>
        <input
          type="range"
          min={2}
          max={8}
          value={baseUnit}
          onChange={(e) => onBaseUnitChange(Number(e.target.value))}
          className="w-full accent-[var(--brand)]"
        />
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>2px</span>
          <span>8px</span>
        </div>
        <div className="mt-3 flex gap-1 items-end">
          {spacingScale.map((mult, i) => {
            const px = baseUnit * mult;
            return (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="rounded-sm"
                  style={{
                    width: `${Math.max(4, Math.min(px, 64))}px`,
                    height: `${Math.max(4, Math.min(px, 64))}px`,
                    background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                    opacity: 0.6,
                  }}
                />
                <span className="mt-1 text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {px}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Border Radius
        </label>
        <div className="grid grid-cols-3 gap-3">
          {RADIUS_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onRadiusPresetChange(i)}
              className="rounded-xl border p-4 text-center transition-all duration-200"
              style={
                radiusPreset === i
                  ? {
                      background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                      borderColor: 'transparent',
                      color: '#fff',
                    }
                  : {
                      borderColor: 'var(--border-primary)',
                      background: 'var(--bg-tertiary)',
                    }
              }
            >
              <div
                className="mx-auto mb-2 h-10 w-16 border-2"
                style={{
                  borderRadius: `${preset.values.md}px`,
                  borderColor: radiusPreset === i ? 'rgba(255,255,255,0.5)' : 'var(--border-primary)',
                }}
              />
              <div
                className="text-sm font-semibold"
                style={radiusPreset !== i ? { color: 'var(--text-primary)' } : undefined}
              >
                {preset.label}
              </div>
              <div
                className="text-xs mt-0.5"
                style={radiusPreset !== i ? { color: 'var(--text-tertiary)' } : { opacity: 0.8 }}
              >
                md: {preset.values.md}px
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Shadow Depth
        </label>
        <div className="grid grid-cols-3 gap-3">
          {SHADOW_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onShadowPresetChange(i)}
              className="rounded-xl border p-4 text-center transition-all duration-200"
              style={
                shadowPreset === i
                  ? {
                      background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                      borderColor: 'transparent',
                      color: '#fff',
                    }
                  : {
                      borderColor: 'var(--border-primary)',
                      background: 'var(--bg-tertiary)',
                    }
              }
            >
              <div
                className="mx-auto mb-2 h-10 w-16 rounded-lg"
                style={{
                  background: shadowPreset === i ? 'rgba(255,255,255,0.2)' : 'var(--bg-elevated)',
                  boxShadow: preset.values.md,
                }}
              />
              <div
                className="text-sm font-semibold"
                style={shadowPreset !== i ? { color: 'var(--text-primary)' } : undefined}
              >
                {preset.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Components ──

function StepComponents({
  selectedComponents,
  onToggleComponent,
  onToggleAll,
}: {
  selectedComponents: ComponentType[];
  onToggleComponent: (c: ComponentType) => void;
  onToggleAll: () => void;
}) {
  const allSelected = selectedComponents.length === ALL_COMPONENTS.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Components
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Select which component token sets to include.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleAll}
          className="text-sm font-medium transition-colors"
          style={{ color: 'var(--brand)' }}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALL_COMPONENTS.map((comp) => {
          const meta = COMPONENT_LABELS[comp];
          const selected = selectedComponents.includes(comp);
          return (
            <button
              key={comp}
              type="button"
              onClick={() => onToggleComponent(comp)}
              className="rounded-xl border p-4 text-left transition-all duration-200"
              style={
                selected
                  ? {
                      background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                      borderColor: 'transparent',
                      color: '#fff',
                    }
                  : {
                      borderColor: 'var(--border-primary)',
                      background: 'var(--bg-tertiary)',
                    }
              }
            >
              <div
                className="text-sm font-semibold"
                style={!selected ? { color: 'var(--text-primary)' } : undefined}
              >
                {meta.label}
              </div>
              <div
                className="text-xs mt-0.5 leading-tight"
                style={!selected ? { color: 'var(--text-tertiary)' } : { opacity: 0.8 }}
              >
                {meta.description}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        {selectedComponents.length} of {ALL_COMPONENTS.length} components selected
      </p>
    </div>
  );
}

// ── Step 5: Review ──

function StepReview({
  name,
  domain,
  companyName,
  productName,
  primaryColor,
  paletteMode,
  fontFamily,
  headingFontFamily,
  baseSize,
  typeScale,
  baseUnit,
  radiusPreset,
  shadowPreset,
  selectedComponents,
  palette,
}: {
  name: string;
  domain: DomainType;
  companyName: string;
  productName: string;
  primaryColor: string;
  paletteMode: PaletteMode;
  fontFamily: string;
  headingFontFamily: string;
  baseSize: number;
  typeScale: TypeScale;
  baseUnit: number;
  radiusPreset: number;
  shadowPreset: number;
  selectedComponents: ComponentType[];
  palette: ReturnType<typeof generateFullPalette>;
}) {
  const domainLabel = DOMAIN_PRESETS[domain].label;

  const summaryRows = [
    { label: 'Name', value: name },
    { label: 'Domain', value: domainLabel },
    { label: 'Company', value: companyName || '—' },
    { label: 'Product', value: productName || '—' },
    { label: 'Primary Color', value: primaryColor },
    { label: 'Palette Mode', value: paletteMode },
    { label: 'Body Font', value: fontFamily },
    { label: 'Heading Font', value: headingFontFamily },
    { label: 'Base Size', value: `${baseSize}px` },
    { label: 'Type Scale', value: typeScale },
    { label: 'Base Unit', value: `${baseUnit}px` },
    { label: 'Border Radius', value: RADIUS_PRESETS[radiusPreset].label },
    { label: 'Shadow Depth', value: SHADOW_PRESETS[shadowPreset].label },
    { label: 'Components', value: `${selectedComponents.length} selected` },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        Review Your Design System
      </h3>

      <div
        className="rounded-xl border divide-y"
        style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
      >
        {summaryRows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {row.label}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {row.label === 'Primary Color' ? (
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full inline-block"
                    style={{ backgroundColor: primaryColor }}
                  />
                  {primaryColor}
                </span>
              ) : (
                row.value
              )}
            </span>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
          Color Preview
        </label>
        <div className="space-y-2">
          <ColorPalettePreview shades={palette.primary} label="Primary" compact />
          <ColorPalettePreview shades={palette.secondary} label="Secondary" compact />
          <ColorPalettePreview shades={palette.accent} label="Accent" compact />
        </div>
      </div>
    </div>
  );
}
