'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon, ShieldIcon, ChevronDownIcon, InfoCircleIcon, ExternalLinkIcon } from '@/components/Icons';

interface KeysData {
  hasKeys: boolean;
  githubHint: string | null;
  groqHint: string | null;
  hasGroqKey: boolean;
  geminiHint: string | null;
  hasGeminiKey: boolean;
  openaiHint: string | null;
  hasOpenaiKey: boolean;
  claudeHint: string | null;
  hasClaudeKey: boolean;
}

function StepGuide({ title, steps, defaultOpen = false }: { title: string; steps: { text: string; link?: { url: string; label: string } }[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-accent)', background: 'var(--brand-subtle)' }}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--brand)' }}>
          <InfoCircleIcon className="h-4 w-4 flex-shrink-0" />
          {title}
        </span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border-accent)' }}>
          <ol className="space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}>{i + 1}</span>
                <span>
                  {step.text}
                  {step.link && (
                    <> <a href={step.link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium underline underline-offset-2" style={{ color: 'var(--brand)' }}>{step.link.label}<ExternalLinkIcon className="h-3 w-3" /></a></>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ saved, hint }: { saved: boolean; hint: string | null }) {
  if (!saved) return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--text-tertiary)' }} />Not set</span>;
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />Saved ({hint})</span>;
}

function PriceBadge({ free, price }: { free: boolean; price?: string }) {
  if (free) return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>Free</span>;
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>Paid {price ? `· ${price}` : ''}</span>;
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>;
}

interface AIKeyFormProps {
  id: string; label: string; description: string; free: boolean; price?: string; limits: string; badge?: string; placeholder: string;
  guideTitle: string; guideSteps: { text: string; link?: { url: string; label: string } }[]; guideDefaultOpen: boolean;
  hasKey: boolean; hint: string | null; onSave: (key: string) => Promise<void>; onDelete: () => Promise<void>;
  saving: boolean; message: { type: 'success' | 'error'; text: string } | null;
}

function AIKeyForm({ id, label, description, free, price, limits, badge, placeholder, guideTitle, guideSteps, guideDefaultOpen, hasKey, hint, onSave, onDelete, saving, message }: AIKeyFormProps) {
  const [keyValue, setKeyValue] = useState('');
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!keyValue) return; await onSave(keyValue); setKeyValue(''); };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor={id} className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</label>
          <PriceBadge free={free} price={price} />
          {badge && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: 'white' }}>{badge}</span>}
        </div>
        <StatusBadge saved={hasKey} hint={hint} />
      </div>
      <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>{limits}</p>

      {hasKey && hint && (
        <div className="flex items-center justify-between mb-4 rounded-xl p-3" style={{ background: 'var(--bg-tertiary)' }}>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Current key: <span className="font-mono">{hint}</span></span>
          <button type="button" onClick={onDelete} className="text-sm font-medium transition-colors duration-200" style={{ color: 'var(--error)' }}>Delete</button>
        </div>
      )}

      <StepGuide title={guideTitle} defaultOpen={guideDefaultOpen} steps={guideSteps} />

      <div className="mt-4">
        <input id={id} type="password" value={keyValue} onChange={(e) => setKeyValue(e.target.value)} placeholder={placeholder} className="input w-full rounded-xl px-3.5 py-2.5 text-sm font-mono" />
      </div>
      <div className="flex items-start gap-2.5 mt-4 rounded-xl p-3" style={{ background: 'var(--bg-tertiary)' }}>
        <ShieldIcon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Your key is encrypted with AES-256-GCM before storage and used only for AI generation requests.</p>
      </div>
      {message && (
        <div className="mt-4 rounded-xl px-4 py-3 text-sm border-l-4" style={{ background: message.type === 'success' ? 'var(--success-subtle)' : 'var(--error-subtle)', color: message.type === 'success' ? 'var(--success)' : 'var(--error)', borderLeftColor: message.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
          {message.type === 'success' ? '\u2713 ' : '\u2717 '}{message.text}
        </div>
      )}
      <button type="submit" disabled={saving || !keyValue} className="btn-gradient mt-4 w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
        {saving ? <span className="flex items-center justify-center gap-2"><Spinner />Encrypting &amp; Saving...</span> : `Save ${label.split(' ')[0]} Key`}
      </button>
    </form>
  );
}

export function KeysForm() {
  const [keysData, setKeysData] = useState<KeysData | null>(null);
  const [githubToken, setGithubToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { type: 'success' | 'error'; text: string } | null>>({});

  useEffect(() => { fetchKeys(); }, []);

  async function fetchKeys() {
    try { const res = await fetch('/api/keys'); setKeysData(await res.json()); } catch { setMessage({ type: 'error', text: 'Failed to load keys' }); } finally { setLoading(false); }
  }

  async function handleSaveGithub(e: React.FormEvent) {
    e.preventDefault();
    if (!githubToken) { setMessage({ type: 'error', text: 'Enter your GitHub token' }); return; }
    setSaving(true); setMessage(null);
    try {
      const res = await fetch('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ githubToken }) });
      if (!res.ok) throw new Error();
      setMessage({ type: 'success', text: 'GitHub token saved and encrypted successfully' }); setGithubToken(''); fetchKeys();
    } catch { setMessage({ type: 'error', text: 'Failed to save token' }); } finally { setSaving(false); }
  }

  async function handleDeleteGithub() {
    if (!confirm('Delete your GitHub token? Syncing will stop.')) return;
    try { const res = await fetch('/api/keys?key=github', { method: 'DELETE' }); if (!res.ok) throw new Error(); setMessage({ type: 'success', text: 'Token deleted' }); setKeysData(p => p ? { ...p, hasKeys: false, githubHint: null } : null); } catch { setMessage({ type: 'error', text: 'Failed to delete token' }); }
  }

  function makeAISaveHandler(bodyKey: string, name: string) {
    return async (apiKey: string) => {
      setSavingStates(s => ({ ...s, [bodyKey]: true })); setMessages(m => ({ ...m, [bodyKey]: null }));
      try {
        const res = await fetch('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [bodyKey]: apiKey }) });
        if (!res.ok) throw new Error();
        setMessages(m => ({ ...m, [bodyKey]: { type: 'success', text: `${name} API key saved and encrypted successfully` } })); fetchKeys();
      } catch { setMessages(m => ({ ...m, [bodyKey]: { type: 'error', text: `Failed to save ${name} API key` } })); } finally { setSavingStates(s => ({ ...s, [bodyKey]: false })); }
    };
  }

  function makeAIDeleteHandler(param: string, name: string, reset: (p: KeysData) => Partial<KeysData>) {
    return async () => {
      if (!confirm(`Delete your ${name} API key?`)) return;
      try {
        const res = await fetch(`/api/keys?key=${param}`, { method: 'DELETE' }); if (!res.ok) throw new Error();
        setMessages(m => ({ ...m, [`${param}ApiKey`]: { type: 'success', text: `${name} API key deleted` } }));
        setKeysData(p => p ? { ...p, ...reset(p) } : null);
      } catch { setMessages(m => ({ ...m, [`${param}ApiKey`]: { type: 'error', text: `Failed to delete ${name} API key` } })); }
    };
  }

  const activeProvider = keysData?.hasGroqKey ? 'Groq' : keysData?.hasGeminiKey ? 'Gemini' : keysData?.hasOpenaiKey ? 'OpenAI' : keysData?.hasClaudeKey ? 'Claude' : null;

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-10 rounded-xl" style={{ background: 'var(--bg-tertiary)' }} /><div className="h-10 rounded-xl" style={{ background: 'var(--bg-tertiary)' }} /></div>;

  return (
    <div className="space-y-6">
      {/* AI Provider Status */}
      <div className="gradient-border rounded-2xl">
        <div className="p-6 rounded-[15px]" style={{ background: 'var(--bg-elevated)' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, var(--gradient-to), var(--gradient-from))' }}><SparklesIcon className="h-5 w-5 text-white" /></div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Design System Generation</h3>
              {activeProvider ? (
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Active provider: <strong>{activeProvider}</strong>. Add multiple keys as backups — priority: Groq &gt; Gemini &gt; OpenAI &gt; Claude.</p>
              ) : (
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Add at least one AI API key to generate design systems. <strong>Groq</strong> and <strong>Gemini</strong> are free.</p>
              )}
              <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>Priority order: Groq (free) → Gemini (free) → OpenAI (paid) → Claude (paid)</p>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Token */}
      {keysData?.hasKeys && keysData.githubHint && (
        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Saved Token</h3>
          <div className="flex items-center justify-between"><span className="text-sm" style={{ color: 'var(--text-secondary)' }}>GitHub Token</span><StatusBadge saved hint={keysData.githubHint} /></div>
          <button type="button" onClick={handleDeleteGithub} className="mt-4 text-sm font-medium" style={{ color: 'var(--error)' }}>Delete token</button>
        </div>
      )}
      <form onSubmit={handleSaveGithub} className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}>
        <div className="flex items-start justify-between mb-1"><label htmlFor="githubToken" className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>GitHub Personal Access Token</label>{!keysData?.githubHint && <StatusBadge saved={false} hint={null} />}</div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Required for syncing design tokens to your GitHub repository.</p>
        <StepGuide title="How to create a GitHub token (2 minutes)" defaultOpen={!keysData?.githubHint} steps={[{ text: 'Open GitHub token settings.', link: { url: 'https://github.com/settings/tokens?type=beta', label: 'Open Token Settings' } }, { text: 'Click "Generate new token". Set name and expiration (90 days).' }, { text: 'Select "Only select repositories" and pick your repo.' }, { text: 'Set Contents and Pull requests to "Read and write".' }, { text: 'Click "Generate token", copy and paste below.' }]} />
        <div className="mt-4"><input id="githubToken" type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="github_pat_..." className="input w-full rounded-xl px-3.5 py-2.5 text-sm font-mono" /></div>
        <div className="flex items-start gap-2.5 mt-4 rounded-xl p-3" style={{ background: 'var(--bg-tertiary)' }}><ShieldIcon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }} /><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Encrypted with AES-256-GCM before storage.</p></div>
        {message && <div className="mt-4 rounded-xl px-4 py-3 text-sm border-l-4" style={{ background: message.type === 'success' ? 'var(--success-subtle)' : 'var(--error-subtle)', color: message.type === 'success' ? 'var(--success)' : 'var(--error)', borderLeftColor: message.type === 'success' ? 'var(--success)' : 'var(--error)' }}>{message.type === 'success' ? '\u2713 ' : '\u2717 '}{message.text}</div>}
        <button type="submit" disabled={saving || !githubToken} className="btn-gradient mt-4 w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">{saving ? <span className="flex items-center justify-center gap-2"><Spinner />Encrypting &amp; Saving...</span> : 'Save Token'}</button>
      </form>

      {/* AI Providers Section */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold px-1" style={{ color: 'var(--text-primary)' }}>AI Providers</h2>
        <p className="text-sm px-1" style={{ color: 'var(--text-secondary)' }}>Add at least one key to enable AI design system generation. You only need one — add more as backups.</p>
      </div>

      <AIKeyForm id="groqApiKey" label="Groq API Key" description="Fastest free AI provider. Uses Llama 3.3 70B for high-quality generation." free limits="14,400 requests/day · 6,000 tokens/min · Llama 3.3 70B" badge="Recommended" placeholder="gsk_..." guideTitle="How to get a Groq API key (1 minute)" guideSteps={[{ text: 'Go to Groq Console and sign up (free, no credit card).', link: { url: 'https://console.groq.com/keys', label: 'Open Groq Console' } }, { text: 'Click "Create API Key", give it a name (e.g. "Cosmikit").' }, { text: 'Copy the key (starts with gsk_) and paste below.' }]} guideDefaultOpen={!keysData?.hasGroqKey && !keysData?.hasGeminiKey && !keysData?.hasOpenaiKey && !keysData?.hasClaudeKey} hasKey={!!keysData?.hasGroqKey} hint={keysData?.groqHint ?? null} onSave={makeAISaveHandler('groqApiKey', 'Groq')} onDelete={makeAIDeleteHandler('groq', 'Groq', () => ({ groqHint: null, hasGroqKey: false }))} saving={!!savingStates['groqApiKey']} message={messages['groqApiKey'] ?? null} />

      <AIKeyForm id="geminiApiKey" label="Gemini API Key" description="Google Gemini 2.0 Flash — free alternative with good quality." free limits="1,500 requests/day · 15 requests/min · Gemini 2.0 Flash" placeholder="AIzaSy..." guideTitle="How to get a Gemini API key (1 minute)" guideSteps={[{ text: 'Go to Google AI Studio and sign in.', link: { url: 'https://aistudio.google.com/apikey', label: 'Open AI Studio' } }, { text: 'Click "Create API Key" and select a project.' }, { text: 'Copy the API key and paste below.' }]} guideDefaultOpen={false} hasKey={!!keysData?.hasGeminiKey} hint={keysData?.geminiHint ?? null} onSave={makeAISaveHandler('geminiApiKey', 'Gemini')} onDelete={makeAIDeleteHandler('gemini', 'Gemini', () => ({ geminiHint: null, hasGeminiKey: false }))} saving={!!savingStates['geminiApiKey']} message={messages['geminiApiKey'] ?? null} />

      <AIKeyForm id="openaiApiKey" label="OpenAI API Key" description="GPT-4o — premium quality with pay-as-you-go pricing." free={false} price="~$0.01/generation" limits="Pay-as-you-go · $2.50/1M input tokens · $10/1M output tokens · GPT-4o" placeholder="sk-..." guideTitle="How to get an OpenAI API key (2 minutes)" guideSteps={[{ text: 'Go to OpenAI Platform and sign in.', link: { url: 'https://platform.openai.com/api-keys', label: 'Open OpenAI Platform' } }, { text: 'Click "Create new secret key", give it a name.' }, { text: 'Add billing credits ($5 min) in Billing settings.', link: { url: 'https://platform.openai.com/settings/organization/billing/overview', label: 'Billing Settings' } }, { text: 'Copy the key (starts with sk-) and paste below.' }]} guideDefaultOpen={false} hasKey={!!keysData?.hasOpenaiKey} hint={keysData?.openaiHint ?? null} onSave={makeAISaveHandler('openaiApiKey', 'OpenAI')} onDelete={makeAIDeleteHandler('openai', 'OpenAI', () => ({ openaiHint: null, hasOpenaiKey: false }))} saving={!!savingStates['openaiApiKey']} message={messages['openaiApiKey'] ?? null} />

      <AIKeyForm id="claudeApiKey" label="Claude API Key" description="Anthropic Claude Sonnet — excellent at following design specifications." free={false} price="~$0.02/generation" limits="Pay-as-you-go · $3/1M input tokens · $15/1M output tokens · Claude Sonnet" placeholder="sk-ant-..." guideTitle="How to get a Claude API key (2 minutes)" guideSteps={[{ text: 'Go to Anthropic Console and sign in.', link: { url: 'https://console.anthropic.com/settings/keys', label: 'Open Anthropic Console' } }, { text: 'Click "Create Key", give it a name (e.g. "Cosmikit").' }, { text: 'Add billing credits ($5 min) in Plans & Billing.', link: { url: 'https://console.anthropic.com/settings/plans', label: 'Billing Settings' } }, { text: 'Copy the key (starts with sk-ant-) and paste below.' }]} guideDefaultOpen={false} hasKey={!!keysData?.hasClaudeKey} hint={keysData?.claudeHint ?? null} onSave={makeAISaveHandler('claudeApiKey', 'Claude')} onDelete={makeAIDeleteHandler('claude', 'Claude', () => ({ claudeHint: null, hasClaudeKey: false }))} saving={!!savingStates['claudeApiKey']} message={messages['claudeApiKey'] ?? null} />
    </div>
  );
}
