import Link from 'next/link';
import {
  PaletteIcon,
  RefreshIcon,
  RobotIcon,
  TargetIcon,
  ChartIcon,
  UsersIcon,
  SparklesIcon,
  DownloadIcon,
} from '@/components/Icons';
import { StarField, CosmicDust } from '@/components/StarField';

const features = [
  {
    title: 'Token Extraction',
    description:
      'Extract all variables, text styles, and effects from Figma into W3C DTCG format automatically.',
    Icon: PaletteIcon,
    orbit: 'from-violet-500/20 to-cyan-500/20',
  },
  {
    title: 'Two-Way GitHub Sync',
    description:
      'Push tokens to GitHub and pull changes back to Figma. Single-file or multi-file, direct or via PRs.',
    Icon: RefreshIcon,
    orbit: 'from-cyan-500/20 to-pink-500/20',
  },
  {
    title: 'AI-Powered Design',
    description:
      'Use Claude MCP to generate Figma layouts from natural language — free, no API key needed.',
    Icon: RobotIcon,
    orbit: 'from-pink-500/20 to-violet-500/20',
  },
  {
    title: 'Smart Auto-Mapping',
    description:
      'Automatically detect hard-coded values and map them to the closest matching design token.',
    Icon: TargetIcon,
    orbit: 'from-violet-500/20 to-blue-500/20',
  },
  {
    title: 'Diff & Merge',
    description:
      'See exactly what changed between local and remote tokens before syncing. Resolve conflicts per-file.',
    Icon: ChartIcon,
    orbit: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    title: 'Team-Ready',
    description:
      'Multi-file sync splits tokens by collection. PR workflow for team review before merging changes.',
    Icon: UsersIcon,
    orbit: 'from-cyan-500/20 to-violet-500/20',
  },
];

const steps = [
  {
    num: '1',
    title: 'Download Plugin',
    description:
      'Download the Figma plugin ZIP and import it into Figma Desktop via Plugins > Development > Import plugin from manifest.',
    emoji: '🚀',
  },
  {
    num: '2',
    title: 'Create Account',
    description:
      'Sign in with GitHub, add your GitHub token, and create a project for your design token repository.',
    emoji: '🌟',
  },
  {
    num: '3',
    title: 'Connect Plugin',
    description:
      'Generate a plugin token from the dashboard and paste it into the Cosmikit plugin in Figma.',
    emoji: '🔗',
  },
  {
    num: '4',
    title: 'Sync & Build',
    description:
      'Extract tokens, sync to GitHub, and use AI to generate designs — all inside Figma.',
    emoji: '🪐',
  },
];

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Deep space background */}
        <StarField starCount={120} showNebula />

        {/* Nebula gradients */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-30 animate-nebula-float"
            style={{
              background: 'radial-gradient(ellipse, var(--gradient-from) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-20 animate-nebula-float"
            style={{
              background: 'radial-gradient(ellipse, var(--nebula-cyan) 0%, transparent 70%)',
              filter: 'blur(60px)',
              animationDelay: '4s',
            }}
          />
          <div
            className="absolute top-1/3 right-10 w-[300px] h-[300px] rounded-full opacity-15 animate-nebula-float"
            style={{
              background: 'radial-gradient(ellipse, var(--nebula-pink) 0%, transparent 70%)',
              filter: 'blur(50px)',
              animationDelay: '8s',
            }}
          />
        </div>

        {/* Floating planet decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {/* Small planet top-right */}
          <div
            className="absolute top-[15%] right-[12%] h-6 w-6 rounded-full animate-planet-float"
            style={{
              background: 'linear-gradient(135deg, var(--gradient-from), var(--nebula-pink))',
              boxShadow: '0 0 20px var(--brand-glow), inset -2px -2px 4px rgba(0,0,0,0.3)',
            }}
          />
          {/* Saturn-like planet */}
          <div
            className="absolute top-[35%] left-[8%] animate-planet-float"
            style={{ animationDelay: '2s' }}
          >
            <div
              className="h-8 w-8 rounded-full"
              style={{
                background: 'linear-gradient(135deg, var(--star-gold), var(--nebula-pink))',
                boxShadow: '0 0 24px rgba(251, 191, 36, 0.15), inset -2px -2px 6px rgba(0,0,0,0.3)',
              }}
            />
            {/* Ring */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-3 rounded-full border opacity-40"
              style={{
                borderColor: 'var(--star-gold)',
                transform: 'translate(-50%, -50%) rotateX(75deg)',
              }}
            />
          </div>
          {/* Tiny moon bottom */}
          <div
            className="absolute bottom-[20%] right-[25%] h-3 w-3 rounded-full animate-float"
            style={{
              background: 'var(--text-tertiary)',
              boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.4)',
              animationDelay: '3s',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium glass">
              <SparklesIcon className="h-4 w-4" style={{ color: 'var(--star-gold)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Design tokens from the cosmos</span>
            </div>

            <h1
              className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Your design system,{' '}
              <span className="gradient-text">in orbit</span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cosmikit connects Figma to GitHub, keeping your design tokens in sync
              with AI-powered assistance. Extract, transform, diff, and push — all from
              inside Figma.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/download"
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <DownloadIcon className="h-5 w-5" />
                  Download Plugin
                </span>
              </Link>
              <Link
                href="/login"
                className="btn-ghost inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold transition-all duration-200 hover:-translate-y-0.5"
              >
                Launch Mission
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative py-28" style={{ background: 'var(--bg-secondary)' }}>
        <CosmicDust />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h2
              className="text-3xl font-bold sm:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Everything you need for{' '}
              <span className="gradient-text">design token management</span>
            </h2>
            <p
              className="mt-4 text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              From extraction to deployment, Cosmikit handles the entire token lifecycle.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                {/* Hover nebula border */}
                <div
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: 'conic-gradient(from 180deg, var(--gradient-from), var(--nebula-pink), var(--gradient-to), var(--nebula-blue), var(--gradient-from))',
                  }}
                  aria-hidden="true"
                />
                {/* Inner bg to create border effect */}
                <div
                  className="pointer-events-none absolute inset-[1px] rounded-[15px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: 'var(--bg-elevated)' }}
                  aria-hidden="true"
                />

                <div className="relative">
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-shadow duration-300 group-hover:shadow-glow"
                    style={{
                      background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                      color: '#fff',
                    }}
                  >
                    <feature.Icon className="h-6 w-6" />
                  </div>

                  <h3
                    className="text-lg font-semibold"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works — Orbital Steps ── */}
      <section className="relative py-28 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <StarField starCount={40} showNebula={false} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <h2
            className="text-center text-3xl font-bold sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Your <span className="gradient-text">launch sequence</span>
          </h2>

          <div className="relative mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting orbital path */}
            <div
              className="pointer-events-none absolute top-7 left-[12.5%] right-[12.5%] hidden h-px lg:block"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, var(--border-accent) 0px, var(--border-accent) 6px, transparent 6px, transparent 14px)',
              }}
              aria-hidden="true"
            />

            {steps.map((step) => (
              <div key={step.num} className="relative text-center group">
                {/* Orbital number with glow */}
                <div
                  className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full font-bold text-lg shadow-lg transition-all duration-300 group-hover:shadow-cosmic"
                  style={{
                    background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                    color: '#fff',
                  }}
                >
                  <span className="text-xl">{step.emoji}</span>
                  {/* Orbit ring */}
                  <div
                    className="absolute inset-[-6px] rounded-full border border-dashed opacity-20 group-hover:opacity-50 transition-opacity duration-300"
                    style={{
                      borderColor: 'var(--brand)',
                      animation: 'orbitSpin 15s linear infinite',
                    }}
                  />
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
              href="/download"
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <span className="relative z-10">Begin Your Mission</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative py-8"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        {/* Gradient separator line */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--gradient-from), var(--gradient-to), transparent)',
          }}
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span
            className="text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Cosmikit &mdash; Design System Sync for Figma
          </span>
          <div className="flex gap-6 text-sm">
            <Link
              href="/download"
              className="transition-colors duration-200"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Download
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
