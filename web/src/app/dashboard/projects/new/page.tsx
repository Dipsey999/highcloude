'use client';

import { useState } from 'react';
import { ProjectForm } from '@/components/ProjectForm';
import { DesignSystemSourcePicker } from '@/components/DesignSystemSourcePicker';

export default function NewProjectPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [projectData, setProjectData] = useState<any>(null);

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <StepDot active={step === 1} completed={step > 1} number={1} />
          <div className="h-px w-8" style={{ background: step > 1 ? 'var(--brand)' : 'var(--border-primary)' }} />
          <StepDot active={step === 2} completed={false} number={2} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {step === 1 ? 'New Project' : 'Design System'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {step === 1
            ? 'Configure how your design tokens sync with GitHub.'
            : 'Optionally create or import a design system for this project.'}
        </p>
      </div>

      {step === 1 && (
        <div className="max-w-xl">
          <ProjectForm
            mode="create"
            onProjectCreated={(project) => {
              setProjectData(project);
              setStep(2);
            }}
            skipRedirect
          />
        </div>
      )}

      {step === 2 && projectData && (
        <DesignSystemSourcePicker projectId={projectData.id} projectName={projectData.name} />
      )}
    </div>
  );
}

function StepDot({ active, completed, number }: { active: boolean; completed: boolean; number: number }) {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200"
      style={{
        background: active
          ? 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))'
          : completed
          ? 'var(--brand)'
          : 'var(--bg-tertiary)',
        color: active || completed ? '#fff' : 'var(--text-tertiary)',
        border: `2px solid ${active ? 'transparent' : completed ? 'var(--brand)' : 'var(--border-primary)'}`,
      }}
    >
      {completed ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ) : (
        number
      )}
    </div>
  );
}
