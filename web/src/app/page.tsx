import Link from 'next/link';
import {
  PaletteIcon,
  RefreshIcon,
  RobotIcon,
  TargetIcon,
  SparklesIcon,
  WandIcon,
  ArrowRightIcon,
  CosmiLogoHero,
} from '@/components/Icons';

// ── Vibe showcase cards (same vibes as /create) ──
const vibes = [
  {
    label: 'Clean & Minimal',
    reference: 'Like Linear or Notion',
    colors: ['#6366f1', '#a5b4fc', '#e0e7ff', '#f1f5f9'],
    radius: 4,
    font: 'Inter',
  },
  {
    label: 'Professional & Trustworthy',
    reference: 'Like Stripe or Mercury',
    colors: ['#1e40af', '#3b82f6', '#dbeafe', '#f8fafc'],
    radius: 4,
    font: 'IBM Plex Sans',
  },
  {
    label: 'Warm & Friendly',
    reference: 'Like Slack or Asana',
    colors: ['#ea580c', '#fb923c', '#fed7aa', '#fffbeb'],
    radius: 14,
    font: 'Nunito',
  },
  {
    label: 'Bold & Energetic',
    reference: 'Like Vercel or Framer',
    colors: ['#dc2626', '#f97316', '#fbbf24', '#111827'],
    radius: 8,
    font: 'Space Grotesk',
  },
  {
    label: 'Soft & Approachable',
    reference: 'Like Calm or Headspace',
    colors: ['#8b5cf6', '#c4b5fd', '#ede9fe', '#faf5ff'],
    radius: 14,
    font: 'DM Sans',
  },
  {
    label: 'Custom',
    reference: 'You define the vibe',
    colors: ['#7c3aed', '#06b6d4', '#f59e0b', '#ec4899'],
    radius: 8,
    font: 'Your choice',
  },
];

const howItWorks = [
  {
    num: '01',
    title: 'Describe your product',
    description: 'Tell us what you\'re building in a sentence. Cosmikit detects your domain, audience, and aesthetic needs.',
  },
  {
    num: '02',
    title: 'Pick your vibe',
    description: 'Choose from 6 curated vibes — clean, professional, warm, bold, soft, or fully custom. The AI fills in the rest.',
  },
  {
    num: '03',
    title: 'AI generates everything',
    description: 'Colors, typography, spacing, radius, shadows, component tokens, and documentation — all generated in seconds.',
  },
  {
    num: '04',
    title: 'Export & build',
    description: 'Download CSS variables, SCSS, or DTCG JSON. Feed it to Claude Code, Cursor, or your Tailwind config.',
  },
];

const features = [
  {
    title: 'Complete Color System',
    description: 'Primary, secondary, accent, neutral scales with 11 shades each, plus semantic status colors.',
    Icon: PaletteIcon,
  },
  {
    title: 'Typography Scale',
    description: 'Body + heading fonts, 9-step type scale, weight tokens — all based on proven mathematical ratios.',
    Icon: TargetIcon,
  },
  {
    title: '12 Component Token Sets',
    description: 'Button, input, card, badge, modal, tabs — full token specs using DTCG alias references.',
    Icon: WandIcon,
  },
  {
    title: 'AI Refinement',
    description: '"Make it warmer" or "sharper corners" — iterate with natural language and see changes live.',
    Icon: SparklesIcon,
  },
  {
    title: 'Multi-Format Export',
    description: 'CSS variables, SCSS, JSON tokens. Paste into your Tailwind config or feed to any AI coding tool.',
    Icon: RefreshIcon,
  },
  {
    title: 'Figma + GitHub Sync',
    description: 'Push tokens to your repo and pull into Figma. Keep design and code in sync automatically.',
    Icon: RobotIcon,
  },
];

function VibeCard({ vibe }: { vibe: typeof vibes[0] }) {
  const isDark = vibe.label === 'Bold & Energetic';
  return (
    <div
      className="group rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
      }}
    >
      {/* Mini preview */}
      <div
        className="w-full h-20 rounded-lg overflow-hidden flex mb-3"
        style={{
          background: isDark ? vibe.colors[3] : '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div
          className="w-8 h-full flex flex-col gap-1.5 p-1.5"
          style={{ background: isDark ? '#1f2937' : vibe.colors[2] }}
        >
          <div className="w-full h-1.5 rounded-full" style={{ background: vibe.colors[0] }} />
          <div className="w-full h-1 rounded-full" style={{ background: vibe.colors[1], opacity: 0.5 }} />
          <div className="w-full h-1 rounded-full" style={{ background: vibe.colors[1], opacity: 0.3 }} />
        </div>
        <div className="flex-1 p-2 flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <div className="h-6 flex-1" style={{ background: vibe.colors[2], borderRadius: vibe.radius / 2 }} />
            <div className="h-6 flex-1" style={{ background: vibe.colors[2], borderRadius: vibe.radius / 2 }} />
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="h-4 px-3" style={{ background: vibe.colors[0], borderRadius: vibe.radius / 2, minWidth: 32 }} />
            <div className="h-2 flex-1 rounded-full" style={{ background: vibe.colors[1], opacity: 0.3 }} />
          </div>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {vibe.label}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
        {vibe.reference}
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* ── Hero ── */}
      <section className="hero-mesh relative">
        <div className="mx-auto max-w-5xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
          <div className="text-center">
            {/* Logo mark */}
            <div className="mb-8 flex justify-center">
              <CosmiLogoHero className="h-16 w-16 sm:h-20 sm:w-20" />
            </div>

            {/* Badge */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase"
              style={{
                background: 'var(--brand-subtle)',
                color: 'var(--brand)',
                border: '1px solid var(--border-accent)',
              }}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              AI Design System Generator
            </div>

            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{ color: 'var(--text-primary)', lineHeight: '1.1' }}
            >
              Make everything AI builds
              <br />
              <span className="gradient-text">look professional</span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              AI coding tools can write code but can&apos;t make consistent design decisions.
              Describe your product, pick a vibe, and Cosmikit generates a complete design
              system that any AI tool can follow.
            </p>

            {/* Hero feature chips */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {[
                'AI-generated color palettes',
                'Typography & spacing tokens',
                'Export for Claude Code & Cursor',
                'No account required to try',
              ].map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--brand)' }}
                  />
                  {f}
                </span>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/create"
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <WandIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Create Your Design System
                </span>
              </Link>
              <a
                href="#how-it-works"
                className="btn-ghost inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
              >
                See how it works
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            </div>

            <p className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              No account required. No API key needed. Just describe and go.
            </p>
          </div>
        </div>

        <div className="gradient-line" />
      </section>

      {/* ── Problem / Solution ── */}
      <section className="py-20 sm:py-24" style={{ background: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2
              className="text-2xl font-bold sm:text-3xl lg:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              The <span className="gradient-text">vibe coding</span> gap
            </h2>
            <p
              className="mt-4 text-base sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              AI writes great code fast. But without a design system, every component
              looks different. Cosmikit solves this by giving your AI tool a single
              source of design truth.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Before */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}
                >
                  !
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Without Cosmikit
                </span>
              </div>
              {/* 3 inconsistent mini cards */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="h-16 flex-1 rounded-md" style={{ background: '#6366f1', borderRadius: 4 }} />
                  <div className="h-16 flex-1 rounded-md" style={{ background: '#ea580c', borderRadius: 14 }} />
                  <div className="h-16 flex-1 rounded-md" style={{ background: '#dc2626', borderRadius: 0 }} />
                </div>
                <div className="flex gap-2">
                  <div className="h-3 rounded-full flex-[2]" style={{ background: '#e5e7eb' }} />
                  <div className="h-3 rounded-full flex-1" style={{ background: '#fde68a' }} />
                </div>
                <div className="flex gap-2">
                  <div className="h-3 rounded flex-1" style={{ background: '#dbeafe' }} />
                  <div className="h-3 rounded flex-[3]" style={{ background: '#fecaca' }} />
                </div>
              </div>
              <p className="text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
                Inconsistent colors, fonts, and radius across screens
              </p>
            </div>

            {/* After */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--bg-elevated)',
                border: '2px solid var(--brand)',
                boxShadow: '0 0 0 3px var(--brand-glow)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}
                >
                  ✓
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  With Cosmikit
                </span>
              </div>
              {/* 3 consistent mini cards */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="h-16 flex-1" style={{ background: '#6366f1', borderRadius: 8 }} />
                  <div className="h-16 flex-1" style={{ background: '#818cf8', borderRadius: 8 }} />
                  <div className="h-16 flex-1" style={{ background: '#a5b4fc', borderRadius: 8 }} />
                </div>
                <div className="flex gap-2">
                  <div className="h-3 flex-[2]" style={{ background: '#e0e7ff', borderRadius: 8 }} />
                  <div className="h-3 flex-1" style={{ background: '#eef2ff', borderRadius: 8 }} />
                </div>
                <div className="flex gap-2">
                  <div className="h-3 flex-1" style={{ background: '#eef2ff', borderRadius: 8 }} />
                  <div className="h-3 flex-[3]" style={{ background: '#e0e7ff', borderRadius: 8 }} />
                </div>
              </div>
              <p className="text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
                One design system, consistent everywhere
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="gradient-line" />

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 sm:py-28" style={{ background: 'var(--bg-primary)' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="text-2xl font-bold sm:text-3xl lg:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Design system in <span className="gradient-text">four steps</span>
            </h2>
            <p
              className="mt-4 text-base sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              From product description to production-ready tokens in minutes.
            </p>
          </div>

          <div className="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting line */}
            <div
              className="pointer-events-none absolute top-7 left-[12.5%] right-[12.5%] hidden h-px lg:block"
              style={{
                background: 'linear-gradient(90deg, var(--border-accent), var(--gradient-from), var(--gradient-to), var(--border-accent))',
                opacity: 0.3,
              }}
              aria-hidden="true"
            />

            {howItWorks.map((step) => (
              <div key={step.num} className="relative text-center group">
                <div
                  className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold transition-all duration-200"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '2px solid var(--border-primary)',
                    color: 'var(--brand)',
                  }}
                >
                  {step.num}
                </div>
                <h3
                  className="mt-5 font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {step.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gradient-line" />

      {/* ── Vibe Showcase ── */}
      <section className="py-24 sm:py-28" style={{ background: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="text-2xl font-bold sm:text-3xl lg:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Choose your <span className="gradient-text">vibe</span>
            </h2>
            <p
              className="mt-4 text-base sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              Six curated aesthetic directions. Pick one and the AI handles the rest — fonts,
              colors, radius, spacing, shadows — a complete design language.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {vibes.map((vibe) => (
              <VibeCard key={vibe.label} vibe={vibe} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/create"
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
            >
              <span className="relative z-10 flex items-center gap-2">
                Try it yourself
                <ArrowRightIcon className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <div className="gradient-line" />

      {/* ── Features Grid ── */}
      <section className="py-24 sm:py-28" style={{ background: 'var(--bg-primary)' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="text-2xl font-bold sm:text-3xl lg:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Everything to <span className="gradient-text">create and ship</span>
            </h2>
            <p
              className="mt-4 text-base sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              From AI generation to Figma sync, Cosmikit covers the full design system workflow.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                    color: '#fff',
                  }}
                >
                  <feature.Icon className="h-5 w-5" />
                </div>
                <h3
                  className="text-base font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {feature.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="hero-mesh relative py-20 sm:py-24" style={{ background: 'var(--bg-secondary)' }}>
        <div className="gradient-line absolute inset-x-0 top-0" />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Ready to make your product <span className="gradient-text">look professional</span>?
          </h2>
          <p
            className="mt-4 text-base sm:text-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            Describe your product. Pick a vibe. Get a complete design system in minutes.
            No account required to try.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/create"
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
            >
              <span className="relative z-10 flex items-center gap-2">
                <WandIcon className="h-4 w-4" />
                Create Your Design System
              </span>
            </Link>
          </div>
          <p className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Free to try. No sign-up required. No API key needed.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--bg-primary)' }}>
        <div className="gradient-line" />
        <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Cosmikit — The Design Brain for AI-Powered Development
          </span>
          <div className="flex gap-6 text-sm">
            <Link
              href="/create"
              className="transition-colors duration-200"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Create
            </Link>
            <Link
              href="/download"
              className="transition-colors duration-200"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Download
            </Link>
            <Link
              href="/dashboard/docs"
              className="transition-colors duration-200"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Docs
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
