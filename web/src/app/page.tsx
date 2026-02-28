import Link from 'next/link';
import {
  PaletteIcon,
  RefreshIcon,
  RobotIcon,
  TargetIcon,
  ChartIcon,
  UsersIcon,
  DownloadIcon,
  ArrowRightIcon,
  SparklesIcon,
  WandIcon,
  CosmiLogoHero,
} from '@/components/Icons';

const heroFeatures = [
  'Industry-specific presets',
  'Auto-generated color palettes',
  'Component token sets',
  'DTCG export ready',
];

const features = [
  {
    title: 'Design System Creator',
    description:
      'Build a complete design system in minutes. Choose your domain, customize colors, typography, spacing, and get all component tokens auto-generated.',
    Icon: WandIcon,
    highlight: true,
  },
  {
    title: 'Smart Color Generation',
    description:
      'Pick a primary color and Cosmikit generates full palettes with 11 shades, harmony modes, neutral scales, and semantic colors.',
    Icon: PaletteIcon,
  },
  {
    title: 'Component Tokens',
    description:
      'Get token sets for 12 components — buttons, inputs, cards, badges, modals, and more — all using DTCG alias references.',
    Icon: TargetIcon,
  },
  {
    title: 'Auto Documentation',
    description:
      'Every design system comes with auto-generated docs covering color usage, type scale, spacing, and component specs.',
    Icon: SparklesIcon,
  },
  {
    title: 'Figma + GitHub Sync',
    description:
      'Push tokens to GitHub and pull changes back to Figma. Single-file or multi-file, direct commit or via PRs.',
    Icon: RefreshIcon,
  },
  {
    title: 'AI-Powered Design',
    description:
      'Use Claude MCP to generate Figma layouts from natural language. Design intelligence, no API key needed.',
    Icon: RobotIcon,
  },
];

const domains = [
  { name: 'Technology', emoji: '\u{1F4BB}', color: '#6366f1' },
  { name: 'Healthcare', emoji: '\u{1FA7A}', color: '#0891b2' },
  { name: 'Finance', emoji: '\u{1F4B0}', color: '#1e40af' },
  { name: 'Education', emoji: '\u{1F393}', color: '#7c3aed' },
  { name: 'E-Commerce', emoji: '\u{1F6D2}', color: '#ea580c' },
  { name: 'Creative', emoji: '\u{1F3A8}', color: '#db2777' },
  { name: 'Enterprise', emoji: '\u{1F3E2}', color: '#475569' },
];

const steps = [
  {
    num: '01',
    title: 'Choose Your Domain',
    description:
      'Select your industry — Tech, Healthcare, Finance, or more — and get curated defaults for colors, typography, and spacing.',
  },
  {
    num: '02',
    title: 'Customize Everything',
    description:
      'Fine-tune your primary color, palette mode, fonts, type scale, border radius, shadows, and pick your components.',
  },
  {
    num: '03',
    title: 'Generate & Export',
    description:
      'Cosmikit generates your complete token document in DTCG format. Export as JSON, CSS variables, or SCSS.',
  },
  {
    num: '04',
    title: 'Sync to Figma & Code',
    description:
      'Push your design system to GitHub and import into Figma. Keep design and code in sync with two-way sync.',
  },
];

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
              <WandIcon className="h-3.5 w-3.5" />
              Design System Creator
            </div>

            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{ color: 'var(--text-primary)', lineHeight: '1.1' }}
            >
              Create complete design systems
              <br />
              <span className="gradient-text">in minutes, not months</span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cosmikit generates production-ready design systems with intelligent color
              palettes, typography scales, component tokens, and auto-documentation.
              Choose your industry and start building.
            </p>

            {/* Hero feature chips */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {heroFeatures.map((f) => (
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
                href="/login"
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <WandIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Create Design System
                </span>
              </Link>
              <Link
                href="/download"
                className="btn-ghost inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
              >
                Download Plugin
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Gradient divider */}
        <div className="gradient-line" />
      </section>

      {/* ── Domain Showcase ── */}
      <section className="py-20 sm:py-24" style={{ background: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="text-2xl font-bold sm:text-3xl lg:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Built for <span className="gradient-text">every industry</span>
            </h2>
            <p
              className="mt-4 text-base sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              Pre-configured domain presets with curated colors, fonts, and spacing
              for your specific use case.
            </p>
          </div>

          <div className="mt-14 flex flex-wrap justify-center gap-4">
            {domains.map((d) => (
              <div
                key={d.name}
                className="group relative flex items-center gap-3 rounded-2xl border px-5 py-4 transition-all duration-200 hover:-translate-y-1"
                style={{
                  borderColor: 'var(--border-primary)',
                  background: 'var(--bg-elevated)',
                }}
              >
                {/* Color accent */}
                <div
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: d.color }}
                />
                <span className="text-2xl">{d.emoji}</span>
                <div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {d.name}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {['50', '300', '500', '700', '900'].map((shade, i) => (
                      <div
                        key={shade}
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{
                          backgroundColor: d.color,
                          opacity: 0.15 + i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="gradient-line" />

      {/* ── Features ── */}
      <section className="py-24 sm:py-28" style={{ background: 'var(--bg-primary)' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="text-2xl font-bold sm:text-3xl lg:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Everything you need to{' '}
              <span className="gradient-text">create and ship</span>
            </h2>
            <p
              className="mt-4 text-base sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              From design system creation to Figma sync, Cosmikit handles the entire workflow.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`group rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 ${
                  feature.highlight ? 'sm:col-span-2 lg:col-span-1' : ''
                }`}
                style={{
                  background: feature.highlight
                    ? 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))'
                    : 'var(--bg-elevated)',
                  border: feature.highlight
                    ? 'none'
                    : '1px solid var(--border-primary)',
                }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-shadow duration-200 group-hover:shadow-glow"
                  style={
                    feature.highlight
                      ? {
                          background: 'rgba(255,255,255,0.2)',
                          color: '#fff',
                        }
                      : {
                          background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                          color: '#fff',
                        }
                  }
                >
                  <feature.Icon className="h-5 w-5" />
                </div>

                <h3
                  className="text-base font-semibold"
                  style={{
                    color: feature.highlight ? '#fff' : 'var(--text-primary)',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{
                    color: feature.highlight
                      ? 'rgba(255,255,255,0.85)'
                      : 'var(--text-secondary)',
                  }}
                >
                  {feature.description}
                </p>

                {feature.highlight && (
                  <Link
                    href="/login"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition-colors"
                  >
                    Try it now
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="gradient-line" />

      {/* ── How It Works ── */}
      <section className="py-24 sm:py-28" style={{ background: 'var(--bg-secondary)' }}>
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
              Go from zero to a production-ready design system in minutes.
            </p>
          </div>

          <div className="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting line (desktop) */}
            <div
              className="pointer-events-none absolute top-7 left-[12.5%] right-[12.5%] hidden h-px lg:block"
              style={{
                background: 'linear-gradient(90deg, var(--border-accent), var(--gradient-from), var(--gradient-to), var(--border-accent))',
                opacity: 0.3,
              }}
              aria-hidden="true"
            />

            {steps.map((step) => (
              <div key={step.num} className="relative text-center group">
                <div
                  className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 group-hover:shadow-glow"
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

          <div className="mt-14 text-center">
            <Link
              href="/login"
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Building
                <ArrowRightIcon className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="hero-mesh relative py-20 sm:py-24" style={{ background: 'var(--bg-primary)' }}>
        <div className="gradient-line absolute inset-x-0 top-0" />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Ready to create your <span className="gradient-text">design system</span>?
          </h2>
          <p
            className="mt-4 text-base sm:text-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            Choose your domain, customize your tokens, and ship a professional
            design system — all for free.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
            >
              <span className="relative z-10 flex items-center gap-2">
                <WandIcon className="h-4 w-4" />
                Get Started Free
              </span>
            </Link>
            <Link
              href="/download"
              className="btn-ghost inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
            >
              Download Plugin
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--bg-secondary)' }}>
        <div className="gradient-line" />
        <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span
            className="text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Cosmikit — Design System Creator
          </span>
          <div className="flex gap-6 text-sm">
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
