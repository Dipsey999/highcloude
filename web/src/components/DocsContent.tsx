'use client';

import { useState, useEffect, useRef } from 'react';
import { InfoCircleIcon } from '@/components/Icons';

// ── Section definitions ──

const sections = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'plugin-setup', label: 'Plugin Setup' },
  { id: 'token-extraction', label: 'Token Extraction' },
  { id: 'github-sync', label: 'GitHub Sync' },
  { id: 'ai-design-generation', label: 'AI Design Generation' },
  { id: 'design-refinement', label: 'Design Refinement' },
  { id: 'design-rules', label: 'Design Rules' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'component-patterns', label: 'Component Patterns' },
  { id: 'ai-chat', label: 'AI Chat' },
  { id: 'reverse-sync', label: 'Reverse Sync' },
  { id: 'reference-generation', label: 'Reference Generation' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

// ── Reusable doc components ──

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-3 rounded-xl border p-4"
      style={{ borderColor: 'var(--border-accent)', background: 'var(--brand-subtle)' }}
    >
      <InfoCircleIcon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--brand)' }} />
      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      className="rounded-lg border p-3 text-xs font-mono overflow-x-auto"
      style={{
        background: 'var(--bg-tertiary)',
        borderColor: 'var(--border-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {children}
    </pre>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2.5">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
          <span
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}
          >
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function SectionHeading({ id, title }: { id: string; title: string }) {
  return (
    <h2
      id={id}
      className="text-xl font-bold mb-4 scroll-mt-8"
      style={{ color: 'var(--text-primary)' }}
    >
      {title}
    </h2>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </p>
  );
}

// ── Main docs component ──

export function DocsContent() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -80% 0px' },
    );

    const headings = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    headings.forEach((h) => observerRef.current?.observe(h));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="flex gap-8">
      {/* ── Sticky TOC sidebar ── */}
      <nav className="hidden lg:block w-48 shrink-0">
        <div className="sticky top-24 space-y-0.5">
          <span
            className="block px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Contents
          </span>
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`block rounded-lg px-3 py-1.5 text-xs transition-all duration-150 ${
                activeSection === section.id ? 'font-medium' : ''
              }`}
              style={{
                color: activeSection === section.id ? 'var(--brand)' : 'var(--text-tertiary)',
                background: activeSection === section.id ? 'var(--brand-subtle)' : 'transparent',
              }}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="flex-1 max-w-3xl space-y-12">
        {/* Getting Started */}
        <section>
          <SectionHeading id="getting-started" title="Getting Started" />
          <div className="space-y-4">
            <Paragraph>
              Claude Bridge connects Figma to GitHub, keeping your design tokens in sync with AI-powered assistance.
              It extracts Figma variables into the W3C Design Token Community Group (DTCG) format, syncs them to
              GitHub, and uses Claude AI to generate Figma designs based on your design system.
            </Paragraph>
            <InfoBox>
              <strong>Quick start:</strong> Install the plugin, create a project on this dashboard,
              generate a plugin token, and paste it into the Figma plugin to connect.
            </InfoBox>
            <StepList
              steps={[
                'Download the Claude Bridge Figma plugin from the Download page.',
                'Sign in to this dashboard with your GitHub account.',
                'Add your GitHub personal access token in the API Keys section.',
                'Create a project and configure your repository settings.',
                'Generate a Plugin Token and paste it into the Figma plugin.',
                'Start extracting tokens and generating designs!',
              ]}
            />
          </div>
        </section>

        {/* Plugin Setup */}
        <section>
          <SectionHeading id="plugin-setup" title="Plugin Setup" />
          <div className="space-y-4">
            <Paragraph>
              The Claude Bridge plugin runs inside Figma Desktop. It communicates with this web dashboard
              to sync tokens, retrieve API keys, and push design data.
            </Paragraph>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Installation</h3>
            <StepList
              steps={[
                'Download the plugin ZIP from the Download page.',
                'Open Figma Desktop and go to Plugins > Development > Import plugin from manifest.',
                'Select the manifest.json file from the extracted ZIP.',
                'The plugin appears under Plugins > Development > Claude Bridge.',
              ]}
            />
            <h3 className="text-sm font-semibold mt-6" style={{ color: 'var(--text-primary)' }}>Connecting to the Dashboard</h3>
            <StepList
              steps={[
                'Go to Plugin Token in this dashboard and generate a token.',
                'Open the Claude Bridge plugin in Figma.',
                'Paste the token in the connection screen and click Connect.',
                'The plugin fetches your project settings and API keys securely via JWT.',
              ]}
            />
            <InfoBox>
              Plugin tokens expire after 24 hours. Generate a new one anytime from the Plugin Token page.
            </InfoBox>
          </div>
        </section>

        {/* Token Extraction */}
        <section>
          <SectionHeading id="token-extraction" title="Token Extraction" />
          <div className="space-y-4">
            <Paragraph>
              Claude Bridge extracts all Figma local variables and converts them into the W3C DTCG format.
              This includes colors, dimensions, typography, and any custom variable collections you&apos;ve created.
            </Paragraph>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>What Gets Extracted</h3>
            <ul className="space-y-1.5 text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Color variables (solid colors, with mode variants)</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Number variables (spacing, sizing, radius, opacity)</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> String variables (font families, custom values)</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Boolean variables (feature flags, visibility toggles)</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Variable scopes (FRAME_FILL, TEXT_CONTENT, STROKE_COLOR, etc.)</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Descriptions and metadata from each variable</li>
            </ul>
            <h3 className="text-sm font-semibold mt-6" style={{ color: 'var(--text-primary)' }}>Output Format</h3>
            <Paragraph>
              Tokens are output in the W3C DTCG format with $type, $value, and $description fields,
              plus Figma-specific extensions for scopes and collection metadata.
            </Paragraph>
            <CodeBlock>{`{
  "color": {
    "primary": {
      "$type": "color",
      "$value": "#3B82F6",
      "$description": "Brand primary color",
      "$extensions": {
        "figma": {
          "scopes": ["FRAME_FILL", "SHAPE_FILL"],
          "collection": "Brand Colors"
        }
      }
    }
  }
}`}</CodeBlock>
          </div>
        </section>

        {/* GitHub Sync */}
        <section>
          <SectionHeading id="github-sync" title="GitHub Sync" />
          <div className="space-y-4">
            <Paragraph>
              Push your extracted tokens to a GitHub repository and pull changes back to Figma.
              Supports single-file or multi-file output, with direct push or pull request workflows.
            </Paragraph>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sync Modes</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}>
                <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Single File</h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  All tokens in one JSON file (e.g. tokens.json). Simple and easy to manage.
                </p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}>
                <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Multi File</h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Tokens split by collection into separate files (e.g. tokens/colors.json, tokens/spacing.json).
                </p>
              </div>
            </div>
            <h3 className="text-sm font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>Push Modes</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}>
                <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Direct Push</h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Commits directly to your configured branch. Fast, good for solo workflows.
                </p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}>
                <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Pull Request</h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Creates a PR for team review before merging. Ideal for team workflows.
                </p>
              </div>
            </div>
            <InfoBox>
              Configure your sync and push mode in the project settings. Requires a GitHub token with
              &quot;Contents: Read and write&quot; and &quot;Pull requests: Read and write&quot; permissions.
            </InfoBox>
          </div>
        </section>

        {/* AI Design Generation */}
        <section>
          <SectionHeading id="ai-design-generation" title="AI Design Generation" />
          <div className="space-y-4">
            <Paragraph>
              Describe any UI component in natural language and Claude generates a complete Figma layout
              using your design tokens. The generated design uses auto layout, proper spacing, and
              references your actual token values for colors, typography, and dimensions.
            </Paragraph>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>How It Works</h3>
            <StepList
              steps={[
                'Open the Build tab in the Claude Bridge plugin.',
                'Type a design prompt (e.g. "A card with a profile avatar, name, and email").',
                'Claude generates a JSON design spec using your extracted tokens.',
                'Review the output and click "Apply to Canvas" to create the Figma nodes.',
              ]}
            />
            <h3 className="text-sm font-semibold mt-6" style={{ color: 'var(--text-primary)' }}>Token-Aware Generation</h3>
            <Paragraph>
              Claude sees all your extracted tokens organized by category (colors, dimensions, typography, effects).
              It automatically selects appropriate tokens based on their scopes — for example, using
              tokens marked [FRAME_FILL] for backgrounds and [TEXT_CONTENT] for text colors.
            </Paragraph>
            <h3 className="text-sm font-semibold mt-6" style={{ color: 'var(--text-primary)' }}>Example Prompts</h3>
            <ul className="space-y-1.5 text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;A pricing card with title, price, feature list, and CTA button&quot;</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;A navigation bar with logo, links, and a profile dropdown&quot;</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;A settings form with labeled inputs, toggles, and a save button&quot;</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;A dashboard stats row with 4 metric cards showing icon, value, and label&quot;</li>
            </ul>
          </div>
        </section>

        {/* Design Refinement */}
        <section>
          <SectionHeading id="design-refinement" title="Design Refinement" />
          <div className="space-y-4">
            <Paragraph>
              After generating a design, you can iteratively refine it with follow-up prompts.
              Claude remembers the previous spec and your conversation history, applying targeted changes
              without starting over.
            </Paragraph>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Example Refinements</h3>
            <ul className="space-y-1.5 text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;Make the button wider and change its color to the secondary brand color&quot;</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;Add a subtitle text below the heading&quot;</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;Switch the layout from vertical to horizontal&quot;</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;Add a drop shadow to the card and increase padding&quot;</li>
            </ul>
            <InfoBox>
              Each refinement preserves the full design structure. You can refine multiple times in a row
              before applying to the canvas.
            </InfoBox>
          </div>
        </section>

        {/* Design Rules */}
        <section>
          <SectionHeading id="design-rules" title="Design Rules & Validation" />
          <div className="space-y-4">
            <Paragraph>
              Before applying a generated design to the canvas, Claude Bridge automatically validates it
              against a set of design system rules. Issues are shown with severity levels (error, warning, info)
              so you can fix them before applying.
            </Paragraph>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Built-in Rules</h3>
            <ul className="space-y-1.5 text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><span style={{ color: 'var(--error)' }}>&#8226;</span> <strong>Auto Layout Required</strong> — Frames with children should use auto layout</li>
              <li className="flex gap-2"><span style={{ color: 'var(--warning)' }}>&#8226;</span> <strong>Spacing Consistency</strong> — Values should match the 4-point grid (4, 8, 12, 16, 24, 32, 48, 64)</li>
              <li className="flex gap-2"><span style={{ color: 'var(--warning)' }}>&#8226;</span> <strong>Descriptive Naming</strong> — No generic names like &quot;Frame&quot; or &quot;Rectangle&quot;</li>
              <li className="flex gap-2"><span style={{ color: 'var(--warning)' }}>&#8226;</span> <strong>Token Coverage</strong> — Warns on hard-coded hex colors when matching tokens exist</li>
              <li className="flex gap-2"><span style={{ color: 'var(--warning)' }}>&#8226;</span> <strong>Touch Targets</strong> — Interactive elements should be at least 44x44px</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> <strong>Typography Minimum</strong> — Text should be at least 11px for readability</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> <strong>Text Content Required</strong> — TEXT nodes must have a characters field</li>
            </ul>
          </div>
        </section>

        {/* Accessibility */}
        <section>
          <SectionHeading id="accessibility" title="Accessibility Checker" />
          <div className="space-y-4">
            <Paragraph>
              Claude Bridge includes a WCAG 2.1 accessibility checker that validates generated designs
              for color contrast, touch target sizes, and text readability.
            </Paragraph>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>What It Checks</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}>
                <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Contrast Ratio</h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Checks text/background combinations meet WCAG AA (4.5:1) and AAA (7:1) standards.
                </p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}>
                <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Touch Targets</h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Validates interactive elements are at least 44x44px for mobile accessibility.
                </p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}>
                <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Text Size</h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Ensures text meets minimum size requirements for readability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Component Patterns */}
        <section>
          <SectionHeading id="component-patterns" title="Component Pattern Library" />
          <div className="space-y-4">
            <Paragraph>
              Save Figma selections as reusable component patterns. Claude uses saved patterns as structural
              references when generating new designs, ensuring consistency across your design system.
            </Paragraph>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Saving a Pattern</h3>
            <StepList
              steps={[
                'Select a component or frame in Figma.',
                'Open the Claude Bridge plugin.',
                'Give the pattern a name, category, and optional tags.',
                'Click "Save as Pattern" to store it.',
              ]}
            />
            <Paragraph>
              Saved patterns are included in Claude&apos;s context during generation. For example, if you save a
              &quot;PrimaryButton&quot; pattern, Claude will reference its structure (layout direction, padding, spacing)
              when generating buttons in new designs.
            </Paragraph>
          </div>
        </section>

        {/* AI Chat */}
        <section>
          <SectionHeading id="ai-chat" title="AI Design Chat" />
          <div className="space-y-4">
            <Paragraph>
              The Chat tab in the plugin is a design system consultant that knows your tokens.
              Ask questions about color usage, spacing decisions, typography choices, and design system best practices.
            </Paragraph>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Example Questions</h3>
            <ul className="space-y-1.5 text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;Which token should I use for a card background?&quot;</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;What&apos;s the contrast ratio between our primary text and background colors?&quot;</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;Suggest a consistent spacing scale for my layout&quot;</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> &quot;How should I organize my color tokens for a dark mode?&quot;</li>
            </ul>
            <InfoBox>
              The chat includes your token context automatically. Claude can reference specific token names,
              values, and scopes from your design system.
            </InfoBox>
          </div>
        </section>

        {/* Reverse Sync */}
        <section>
          <SectionHeading id="reverse-sync" title="Reverse Sync" />
          <div className="space-y-4">
            <Paragraph>
              Reverse sync lets you export an existing Figma selection as a JSON spec, have Claude modify it
              based on your instructions, and then reapply the changes back to the canvas.
            </Paragraph>
            <StepList
              steps={[
                'Select a frame or component in Figma.',
                'Use "Export Selection" to convert it to a JSON design spec.',
                'Describe the modifications you want Claude to make.',
                'Claude returns the updated spec preserving unchanged properties.',
                'Apply the modified spec back to the canvas.',
              ]}
            />
          </div>
        </section>

        {/* Reference-Based Generation */}
        <section>
          <SectionHeading id="reference-generation" title="Reference-Based Generation" />
          <div className="space-y-4">
            <Paragraph>
              Use an existing component as a structural reference for generating new designs.
              Claude mirrors the reference&apos;s layout patterns (auto layout direction, spacing values, padding)
              while adapting the content for a different purpose.
            </Paragraph>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Example</h3>
            <Paragraph>
              If you have a &quot;User Profile Card&quot; and want a &quot;Product Card&quot; that follows the same layout
              conventions, select the profile card as a reference, then prompt: &quot;Create a product card with
              image, title, price, and add-to-cart button.&quot; Claude will use the same layout direction, spacing
              scale, and nesting depth as the reference.
            </Paragraph>
          </div>
        </section>

        {/* Troubleshooting */}
        <section>
          <SectionHeading id="troubleshooting" title="Troubleshooting" />
          <div className="space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Plugin Won&apos;t Connect</h3>
            <ul className="space-y-1.5 text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Plugin tokens expire after 24 hours. Generate a new one from the Plugin Token page.</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Make sure you&apos;re using Figma Desktop (not the browser version).</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Check that the plugin is imported from the correct manifest.json file.</li>
            </ul>

            <h3 className="text-sm font-semibold mt-6" style={{ color: 'var(--text-primary)' }}>GitHub Sync Failing</h3>
            <ul className="space-y-1.5 text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Verify your GitHub token has &quot;Contents: Read and write&quot; permissions.</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> For PR mode, the token also needs &quot;Pull requests: Read and write&quot;.</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Check that the repository and branch exist and are accessible.</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Fine-grained tokens must have the specific repository selected.</li>
            </ul>

            <h3 className="text-sm font-semibold mt-6" style={{ color: 'var(--text-primary)' }}>AI Features Not Working</h3>
            <ul className="space-y-1.5 text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> If using MCP: ensure Claude is connected to Figma via the MCP server.</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> If using API key: verify the key starts with sk-ant- and is valid in the Anthropic Console.</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Extract tokens first — Claude needs token context for design-aware generation.</li>
            </ul>

            <h3 className="text-sm font-semibold mt-6" style={{ color: 'var(--text-primary)' }}>Design Spec Parse Errors</h3>
            <ul className="space-y-1.5 text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> The plugin automatically tries to fix common JSON issues (trailing commas, truncated output).</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> If parsing fails, try a simpler prompt or regenerate.</li>
              <li className="flex gap-2"><span style={{ color: 'var(--brand)' }}>&#8226;</span> Very complex designs may hit token limits — break them into smaller components.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
