'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import type { VibePreset, GeneratedDesignSystem } from '@/lib/ai/types';
import { ProgressIndicator } from './ProgressIndicator';
import { StepProductDescription } from './steps/StepProductDescription';
import { StepVibeSelector } from './steps/StepVibeSelector';
import { StepBrandReferences } from './steps/StepBrandReferences';
import { StepColorPicker } from './steps/StepColorPicker';
import { StepGeneration } from './steps/StepGeneration';
import { StepLivePreview } from './steps/StepLivePreview';
import { StepRefinement } from './steps/StepRefinement';
import { StepSignupWall } from './steps/StepSignupWall';

interface CreateFlowProps {
  isAuthenticated: boolean;
  restoreMode: boolean;
}

const TOTAL_STEPS = 8;

// Suggested colors per vibe
const VIBE_SUGGESTED_COLORS: Record<string, string> = {
  'clean-minimal': '#6366f1',
  'professional-trustworthy': '#1e40af',
  'warm-friendly': '#ea580c',
  'bold-energetic': '#dc2626',
  'soft-approachable': '#8b5cf6',
  'custom': '#6366f1',
};

export function CreateFlow({ isAuthenticated, restoreMode }: CreateFlowProps) {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState(1);

  // Input state (steps 1-4)
  const [productDescription, setProductDescription] = useState('');
  const [vibe, setVibe] = useState<VibePreset | null>(null);
  const [brandReferences, setBrandReferences] = useState('');
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);

  // Generation state (step 5)
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Result state (steps 6-8)
  const [generatedSystem, setGeneratedSystem] = useState<GeneratedDesignSystem | null>(null);

  // Refinement state (step 7)
  const [isRefining, setIsRefining] = useState(false);

  // Save state (step 8)
  const [isSaving, setIsSaving] = useState(false);

  // ── Restore from sessionStorage after OAuth redirect ──
  useEffect(() => {
    if (restoreMode && isAuthenticated) {
      try {
        const stored = sessionStorage.getItem('cosmikit-create-data');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.designSystem) {
            // We have a generated system — save it directly
            handleSaveAfterRestore(data);
          }
        }
      } catch (e) {
        console.error('[CreateFlow] Failed to restore from sessionStorage:', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreMode, isAuthenticated]);

  // ── Save after OAuth restore ──
  const handleSaveAfterRestore = async (data: {
    designSystem: GeneratedDesignSystem;
    input: {
      productDescription: string;
      vibe: string;
      brandReferences: string;
      primaryColor: string;
    };
  }) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/generate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designSystem: data.designSystem,
          productDescription: data.input.productDescription,
          productVibe: data.input.vibe,
          brandReferences: data.input.brandReferences,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      const result = await res.json();
      sessionStorage.removeItem('cosmikit-create-data');
      router.push(`/dashboard/projects/${result.projectId}`);
    } catch (e) {
      console.error('[CreateFlow] Failed to save restored design system:', e);
      // If save fails, show the design system at the save step
      setGeneratedSystem(data.designSystem);
      setProductDescription(data.input.productDescription);
      setVibe(data.input.vibe as VibePreset);
      setBrandReferences(data.input.brandReferences);
      setPrimaryColor(data.input.primaryColor);
      setStep(8);
      setIsSaving(false);
    }
  };

  // ── Generate design system ──
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const endpoint = isAuthenticated ? '/api/generate' : '/api/generate/preview';
      const body: Record<string, unknown> = {
        input: {
          productDescription,
          vibe: vibe || 'custom',
          brandReferences: brandReferences || undefined,
          primaryColor: primaryColor || undefined,
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Generation failed (${res.status})`);
      }

      const data = await res.json();
      setGeneratedSystem(data.designSystem);
      setStep(6); // Auto-advance to preview
    } catch (e) {
      setGenerationError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  }, [isAuthenticated, productDescription, vibe, brandReferences, primaryColor]);

  // ── Refine design system ──
  const handleRefine = useCallback(async (instruction: string) => {
    if (!generatedSystem) return;
    setIsRefining(true);

    try {
      const endpoint = isAuthenticated ? '/api/generate/refine' : '/api/generate/preview/refine';
      const body: Record<string, unknown> = {
        currentSystem: generatedSystem,
        instruction,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Refinement failed');
      }

      const data = await res.json();
      setGeneratedSystem(data.designSystem);
    } catch (e) {
      console.error('[CreateFlow] Refinement error:', e);
    } finally {
      setIsRefining(false);
    }
  }, [isAuthenticated, generatedSystem]);

  // ── Save design system (authenticated) ──
  const handleSave = useCallback(async () => {
    if (!generatedSystem) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/generate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designSystem: generatedSystem,
          productDescription,
          productVibe: vibe,
          brandReferences,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      const data = await res.json();
      router.push(`/dashboard/projects/${data.projectId}`);
    } catch (e) {
      console.error('[CreateFlow] Save error:', e);
      setIsSaving(false);
    }
  }, [generatedSystem, productDescription, vibe, brandReferences, router]);

  // ── Sign up (pre-signup flow) ──
  const handleSignUp = useCallback(() => {
    // Save current state to sessionStorage before OAuth redirect
    if (generatedSystem) {
      sessionStorage.setItem(
        'cosmikit-create-data',
        JSON.stringify({
          designSystem: generatedSystem,
          input: {
            productDescription,
            vibe,
            brandReferences,
            primaryColor,
          },
        }),
      );
    }
    signIn('github', { callbackUrl: '/create?restore=true' });
  }, [generatedSystem, productDescription, vibe, brandReferences, primaryColor]);

  // ── Navigation ──
  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // ── Suggested color based on vibe ──
  const suggestedColor = vibe ? VIBE_SUGGESTED_COLORS[vibe] || '#6366f1' : '#6366f1';

  // ── Render current step ──
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepProductDescription
            value={productDescription}
            onChange={setProductDescription}
            onNext={goNext}
          />
        );

      case 2:
        return (
          <StepVibeSelector
            value={vibe}
            onChange={setVibe}
            onNext={goNext}
            onBack={goBack}
          />
        );

      case 3:
        return (
          <StepBrandReferences
            value={brandReferences}
            onChange={setBrandReferences}
            onNext={goNext}
            onBack={goBack}
          />
        );

      case 4:
        return (
          <StepColorPicker
            value={primaryColor}
            suggestedColor={suggestedColor}
            onChange={setPrimaryColor}
            onNext={goNext}
            onBack={goBack}
          />
        );

      case 5:
        return (
          <StepGeneration
            isGenerating={isGenerating}
            error={generationError}
            onGenerate={handleGenerate}
            onBack={goBack}
          />
        );

      case 6:
        return generatedSystem ? (
          <StepLivePreview
            designSystem={generatedSystem}
            onRefine={() => setStep(7)}
            onAccept={() => setStep(8)}
            onBack={() => setStep(5)}
          />
        ) : null;

      case 7:
        return generatedSystem ? (
          <StepRefinement
            designSystem={generatedSystem}
            isRefining={isRefining}
            onRefine={handleRefine}
            onDone={() => setStep(8)}
            onBack={() => setStep(6)}
          />
        ) : null;

      case 8:
        return generatedSystem ? (
          <StepSignupWall
            designSystem={generatedSystem}
            isAuthenticated={isAuthenticated}
            isSaving={isSaving}
            onSave={handleSave}
            onSignUp={handleSignUp}
            onBack={() => setStep(7)}
          />
        ) : null;

      default:
        return null;
    }
  };

  // Show loading state for restore mode
  if (restoreMode && isAuthenticated && !generatedSystem && step < 6) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div
          className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Saving your design system...
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Progress indicator */}
      <div className="max-w-2xl mx-auto mb-8 flex items-center justify-between">
        <ProgressIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
        <span className="text-xs tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
          {step}/{TOTAL_STEPS}
        </span>
      </div>

      {/* Step content */}
      <div className="animate-in fade-in duration-300">
        {renderStep()}
      </div>
    </div>
  );
}
