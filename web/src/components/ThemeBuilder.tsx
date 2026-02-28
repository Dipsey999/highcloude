'use client';

import { useState, useMemo } from 'react';
import { generateFullPalette, generateShades } from '@/lib/design-system/color-generation';
import type { PaletteMode } from '@/lib/design-system/color-generation';
import { DOMAIN_PRESETS, FONT_OPTIONS, TYPE_SCALE_RATIOS, ALL_COMPONENTS } from '@/lib/design-system/domain-presets';
import type { TypeScale, ComponentType, DomainType } from '@/lib/design-system/domain-presets';
import { COMPONENT_LABELS } from '@/lib/design-system/component-templates';
import { ColorPalettePreview, SemanticColorDots } from '@/components/ColorPalettePreview';
import { ChevronDownIcon } from '@/components/Icons';

// ── Constants ──

const DOMAIN_COLORS: { domain: DomainType; color: string; label: string }[] = [
  { domain: 'tech', color: '#6366f1', label: 'Tech' },
  { domain: 'healthcare', color: '#0891b2', label: 'Health' },
  { domain: 'finance', color: '#1e40af', label: 'Finance' },
  { domain: 'education', color: '#7c3aed', label: 'Education' },
  { domain: 'ecommerce', color: '#ea580c', label: 'Commerce' },
  { domain: 'creative', color: '#db2777', label: 'Creative' },
  { domain: 'enterprise', color: '#475569', label: 'Enterprise' },
];

const GRAY_OPTIONS = ['Auto', 'Slate', 'Gray', 'Zinc', 'Neutral', 'Stone'] as const;
type GrayOption = (typeof GRAY_OPTIONS)[number];

const PALETTE_MODES: { value: PaletteMode; label: string }[] = [
  { value: 'complementary', label: 'Complementary' },
  { value: 'analogous', label: 'Analogous' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'split-complementary', label: 'Split Comp.' },
];

const RADIUS_OPTIONS: { label: string; value: number; display: string }[] = [
  { label: 'None', value: 0, display: '0' },
  { label: 'Small', value: 4, display: '4' },
  { label: 'Medium', value: 8, display: '8' },
  { label: 'Large', value: 12, display: '12' },
  { label: 'Full', value: 9999, display: '9999' },
];

const TYPE_SCALE_OPTIONS: { value: TypeScale; label: string; ratio: number }[] = [
  { value: 'minor-third', label: 'Minor Third', ratio: 1.2 },
  { value: 'major-third', label: 'Major Third', ratio: 1.25 },
  { value: 'perfect-fourth', label: 'Perfect Fourth', ratio: 1.333 },
  { value: 'augmented-fourth', label: 'Augmented Fourth', ratio: 1.414 },
];

// ── Props ──

interface ThemeBuilderProps {
  projectId: string;
  initialConfig?: {
    themeConfig?: any;
    typographyConfig?: any;
    spacingConfig?: any;
    componentConfig?: any;
    designSystemName?: string;
    designSystemDomain?: string;
  };
  onSave?: (config: any) => void;
  mode?: 'create' | 'edit';
}

// ── Accordion Section ──

function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="text-sm font-semibold">{title}</span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-tertiary)' }}
        />
      </button>
      {isOpen && (
        <div
          className="border-t px-5 pb-5 pt-4"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Segmented Control ──

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg p-0.5 gap-0.5"
      style={{ background: 'var(--bg-tertiary)' }}
    >
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className="rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200"
          style={
            value === opt.value
              ? {
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }
              : {
                  background: 'transparent',
                  color: 'var(--text-tertiary)',
                }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Main Component ──

export function ThemeBuilder({ projectId, initialConfig, onSave, mode = 'create' }: ThemeBuilderProps) {
  // Accordion state
  const [openSection, setOpenSection] = useState<string>('accent');

  function toggleSection(section: string) {
    setOpenSection((prev) => (prev === section ? '' : section));
  }

  // Theme state
  const [accentColor, setAccentColor] = useState(
    initialConfig?.themeConfig?.accentColor ?? '#6366f1'
  );
  const [grayScale, setGrayScale] = useState<GrayOption>(
    initialConfig?.themeConfig?.grayColor ?? 'Auto'
  );
  const [paletteMode, setPaletteMode] = useState<PaletteMode>(
    initialConfig?.themeConfig?.paletteMode ?? 'analogous'
  );
  const [radius, setRadius] = useState<number>(
    initialConfig?.themeConfig?.radius ?? 8
  );
  const [scaling, setScaling] = useState(
    initialConfig?.themeConfig?.scaling ?? 100
  );

  // Typography state
  const [bodyFont, setBodyFont] = useState(
    initialConfig?.typographyConfig?.fontFamily ?? 'Inter'
  );
  const [headingFont, setHeadingFont] = useState(
    initialConfig?.typographyConfig?.headingFont ?? 'Inter'
  );
  const [typeScale, setTypeScale] = useState<TypeScale>(
    initialConfig?.typographyConfig?.scale ?? 'major-third'
  );
  const [baseSize, setBaseSize] = useState(
    initialConfig?.typographyConfig?.baseSize ?? 16
  );

  // Components state
  const [selectedComponents, setSelectedComponents] = useState<ComponentType[]>(
    initialConfig?.componentConfig?.selectedComponents ?? [...ALL_COMPONENTS]
  );

  // Design system identity
  const [designSystemName, setDesignSystemName] = useState(
    initialConfig?.designSystemName ?? ''
  );
  const [designSystemDomain, setDesignSystemDomain] = useState<string>(
    initialConfig?.designSystemDomain ?? 'tech'
  );

  // Hex input for manual entry
  const [hexInput, setHexInput] = useState(accentColor);

  // ── Derived values ──

  const palette = useMemo(
    () => generateFullPalette(accentColor, paletteMode),
    [accentColor, paletteMode]
  );

  const primaryShades = useMemo(
    () => generateShades(accentColor),
    [accentColor]
  );

  const typeRatio = TYPE_SCALE_RATIOS[typeScale];

  const typeSizes = useMemo(() => {
    const steps = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'];
    return steps.map((name, i) => {
      const scale = Math.pow(typeRatio, i - 2);
      const px = Math.round(baseSize * scale * 100) / 100;
      return { name, px };
    });
  }, [baseSize, typeRatio]);

  const radiusPx = radius >= 9999 ? '9999px' : `${radius}px`;

  // ── Handlers ──

  function handleAccentColorChange(color: string) {
    setAccentColor(color);
    setHexInput(color);
  }

  function handleHexInputChange(value: string) {
    setHexInput(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      setAccentColor(value);
    }
  }

  function toggleComponent(c: ComponentType) {
    setSelectedComponents((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function handleSave() {
    const config = {
      designSystemName,
      designSystemSource: 'scratch',
      designSystemDomain,
      themeConfig: {
        accentColor,
        grayColor: grayScale,
        paletteMode,
        radius,
        scaling,
      },
      typographyConfig: {
        fontFamily: bodyFont,
        headingFont,
        baseSize,
        scale: typeScale,
        weights: [400, 500, 600, 700],
      },
      spacingConfig: {
        baseUnit: 4,
        scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16],
      },
      componentConfig: {
        selectedComponents,
      },
    };
    onSave?.(config);
  }

  // ── Render ──

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0">
      {/* Left Column — Configuration Controls */}
      <div className="w-full lg:w-[40%] flex-shrink-0 space-y-3 overflow-y-auto">
        {/* Accent Color */}
        <AccordionSection
          title="Accent Color"
          isOpen={openSection === 'accent'}
          onToggle={() => toggleSection('accent')}
        >
          <div className="space-y-4">
            {/* Domain preset swatches */}
            <div>
              <label className="block text-xs font-medium mb-2.5" style={{ color: 'var(--text-secondary)' }}>
                Presets
              </label>
              <div className="flex flex-wrap gap-3">
                {DOMAIN_COLORS.map((d) => (
                  <button
                    key={d.domain}
                    type="button"
                    onClick={() => {
                      handleAccentColorChange(d.color);
                      setDesignSystemDomain(d.domain);
                    }}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className="h-9 w-9 rounded-full transition-transform duration-150 group-hover:scale-110"
                      style={{
                        backgroundColor: d.color,
                        boxShadow: accentColor === d.color
                          ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${d.color}`
                          : 'none',
                      }}
                    />
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: accentColor === d.color ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                    >
                      {d.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom color input */}
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => handleAccentColorChange(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border-2 p-0.5"
                style={{ borderColor: 'var(--border-primary)' }}
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexInputChange(e.target.value)}
                placeholder="#6366f1"
                maxLength={7}
                className="input flex-1 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
        </AccordionSection>

        {/* Gray Scale */}
        <AccordionSection
          title="Gray Scale"
          isOpen={openSection === 'gray'}
          onToggle={() => toggleSection('gray')}
        >
          <div>
            <label className="block text-xs font-medium mb-2.5" style={{ color: 'var(--text-secondary)' }}>
              Neutral palette base
            </label>
            <SegmentedControl
              options={GRAY_OPTIONS.map((g) => ({ value: g, label: g }))}
              value={grayScale}
              onChange={setGrayScale}
            />
            <p className="mt-2.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {grayScale === 'Auto'
                ? 'Automatically matched to your accent hue for cohesive neutrals.'
                : `Using the ${grayScale} gray scale.`}
            </p>
          </div>
        </AccordionSection>

        {/* Palette Mode */}
        <AccordionSection
          title="Palette Mode"
          isOpen={openSection === 'palette'}
          onToggle={() => toggleSection('palette')}
        >
          <div>
            <label className="block text-xs font-medium mb-2.5" style={{ color: 'var(--text-secondary)' }}>
              Color harmony
            </label>
            <SegmentedControl
              options={PALETTE_MODES.map((m) => ({ value: m.value, label: m.label }))}
              value={paletteMode}
              onChange={setPaletteMode}
            />
          </div>
        </AccordionSection>

        {/* Radius */}
        <AccordionSection
          title="Radius"
          isOpen={openSection === 'radius'}
          onToggle={() => toggleSection('radius')}
        >
          <div className="space-y-3">
            <SegmentedControl
              options={RADIUS_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
              value={radius}
              onChange={setRadius}
            />
            {/* Visual radius preview */}
            <div className="flex gap-2 pt-1">
              {RADIUS_OPTIONS.map((r) => (
                <div key={r.value} className="flex flex-col items-center gap-1">
                  <div
                    className="h-10 w-10 border-2 transition-all duration-200"
                    style={{
                      borderColor: radius === r.value ? accentColor : 'var(--border-primary)',
                      borderRadius: r.value >= 9999 ? '9999px' : `${r.value}px`,
                      background: radius === r.value ? `${accentColor}18` : 'transparent',
                    }}
                  />
                  <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    {r.display}px
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AccordionSection>

        {/* Typography */}
        <AccordionSection
          title="Typography"
          isOpen={openSection === 'typography'}
          onToggle={() => toggleSection('typography')}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Body Font
                </label>
                <select
                  value={bodyFont}
                  onChange={(e) => setBodyFont(e.target.value)}
                  className="input w-full rounded-lg px-3 py-2 text-sm"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Heading Font
                </label>
                <select
                  value={headingFont}
                  onChange={(e) => setHeadingFont(e.target.value)}
                  className="input w-full rounded-lg px-3 py-2 text-sm"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Type Scale
              </label>
              <select
                value={typeScale}
                onChange={(e) => setTypeScale(e.target.value as TypeScale)}
                className="input w-full rounded-lg px-3 py-2 text-sm"
              >
                {TYPE_SCALE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label} ({s.ratio})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Base Size: {baseSize}px
              </label>
              <input
                type="range"
                min={14}
                max={20}
                value={baseSize}
                onChange={(e) => setBaseSize(Number(e.target.value))}
                className="w-full accent-[var(--brand)]"
              />
              <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                <span>14px</span>
                <span>20px</span>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Components */}
        <AccordionSection
          title="Components"
          isOpen={openSection === 'components'}
          onToggle={() => toggleSection('components')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {selectedComponents.length} of {ALL_COMPONENTS.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedComponents([...ALL_COMPONENTS])}
                  className="text-xs font-medium transition-colors"
                  style={{ color: 'var(--brand)' }}
                >
                  Select All
                </button>
                <span style={{ color: 'var(--text-tertiary)' }}>/</span>
                <button
                  type="button"
                  onClick={() => setSelectedComponents([])}
                  className="text-xs font-medium transition-colors"
                  style={{ color: 'var(--brand)' }}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {ALL_COMPONENTS.map((comp) => {
                const meta = COMPONENT_LABELS[comp];
                const selected = selectedComponents.includes(comp);
                return (
                  <label
                    key={comp}
                    className="flex items-center gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition-all duration-150"
                    style={
                      selected
                        ? {
                            borderColor: accentColor,
                            background: `${accentColor}10`,
                          }
                        : {
                            borderColor: 'var(--border-primary)',
                            background: 'var(--bg-tertiary)',
                          }
                    }
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleComponent(comp)}
                      className="accent-[var(--brand)] h-3.5 w-3.5"
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {meta.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </AccordionSection>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="btn-gradient w-full rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">
              {mode === 'edit' ? 'Save Changes' : 'Create Design System'}
            </span>
          </button>
        </div>
      </div>

      {/* Right Column — Live Preview */}
      <div className="w-full lg:w-[60%] overflow-y-auto">
        <div
          className="rounded-2xl border p-6 space-y-6 sticky top-0"
          style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Live Preview
            </h3>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
            >
              {accentColor}
            </span>
          </div>

          {/* Color Palette */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Color Palette
            </h4>
            <ColorPalettePreview shades={palette.primary} label="Primary" />
            <ColorPalettePreview shades={palette.secondary} label="Secondary" />
            <ColorPalettePreview shades={palette.accent} label="Accent" />
            <ColorPalettePreview shades={palette.neutral} label="Neutral" compact />
            <div className="pt-1">
              <SemanticColorDots colors={palette} />
            </div>
          </div>

          {/* Sample UI Components */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Components
            </h4>

            {/* Buttons */}
            <div
              className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Buttons
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: accentColor,
                    borderRadius: radiusPx,
                  }}
                >
                  Primary
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium border transition-colors"
                  style={{
                    backgroundColor: palette.neutral['100'],
                    color: palette.neutral['800'],
                    borderColor: palette.neutral['300'],
                    borderRadius: radiusPx,
                  }}
                >
                  Secondary
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium border-2 bg-transparent transition-colors"
                  style={{
                    color: accentColor,
                    borderColor: accentColor,
                    borderRadius: radiusPx,
                  }}
                >
                  Outline
                </button>
              </div>
            </div>

            {/* Input */}
            <div
              className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Input
              </span>
              <input
                type="text"
                placeholder="Type something..."
                readOnly
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: palette.neutral['300'],
                  backgroundColor: palette.neutral['50'],
                  color: palette.neutral['900'],
                  borderRadius: radiusPx,
                  fontFamily: bodyFont,
                }}
              />
            </div>

            {/* Card */}
            <div
              className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Card
              </span>
              <div
                className="border p-4"
                style={{
                  borderColor: palette.neutral['200'],
                  backgroundColor: '#ffffff',
                  borderRadius: radius >= 9999 ? '24px' : `${Math.min(radius + 4, 24)}px`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  className="text-sm font-semibold mb-1"
                  style={{ color: palette.neutral['900'], fontFamily: headingFont }}
                >
                  Card Title
                </div>
                <div
                  className="text-xs"
                  style={{ color: palette.neutral['500'], fontFamily: bodyFont }}
                >
                  This is a sample card component with your theme applied.
                </div>
              </div>
            </div>

            {/* Badge & Toggle */}
            <div
              className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Badge & Toggle
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Badges */}
                <span
                  className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    color: accentColor,
                    borderRadius: '9999px',
                  }}
                >
                  Default
                </span>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    borderRadius: '9999px',
                  }}
                >
                  Success
                </span>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '9999px',
                  }}
                >
                  Error
                </span>

                {/* Toggle */}
                <div className="ml-auto flex items-center gap-2">
                  <div
                    className="relative h-6 w-11 rounded-full cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    <div
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                      style={{
                        transform: 'translateX(22px)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>On</span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div
              className="rounded-xl border p-4 space-y-2"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Alerts
              </span>
              {[
                { label: 'Info', bg: '#eff6ff', border: palette.info, text: '#1e40af' },
                { label: 'Success', bg: '#f0fdf4', border: palette.success, text: '#166534' },
                { label: 'Warning', bg: '#fffbeb', border: palette.warning, text: '#92400e' },
                { label: 'Error', bg: '#fef2f2', border: palette.error, text: '#991b1b' },
              ].map((alert) => (
                <div
                  key={alert.label}
                  className="border-l-4 px-3 py-2 text-xs font-medium"
                  style={{
                    backgroundColor: alert.bg,
                    borderLeftColor: alert.border,
                    color: alert.text,
                    borderRadius: radiusPx,
                  }}
                >
                  {alert.label}: This is a {alert.label.toLowerCase()} alert message.
                </div>
              ))}
            </div>
          </div>

          {/* Typography Scale */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Typography Scale
            </h4>
            <div
              className="rounded-xl border p-4 space-y-1"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
            >
              {typeSizes.map((step) => (
                <div key={step.name} className="flex items-baseline gap-3">
                  <span
                    className="w-8 text-right text-[10px] font-mono flex-shrink-0"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {step.name}
                  </span>
                  <span
                    className="truncate"
                    style={{
                      fontSize: `${Math.min(step.px, 32)}px`,
                      color: 'var(--text-primary)',
                      fontFamily: step.name.startsWith('2') || step.name.startsWith('3') || step.name.startsWith('4')
                        ? headingFont
                        : bodyFont,
                    }}
                  >
                    {step.px}px
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
