'use client';

import { useState, useRef, useEffect } from 'react';
import type { GeneratedDesignSystem } from '@/lib/ai/types';
import { LivePreviewPanel } from '@/components/create/preview/LivePreviewPanel';

interface StepRefinementProps {
  designSystem: GeneratedDesignSystem;
  isRefining: boolean;
  onRefine: (instruction: string) => void;
  onDone: () => void;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const QUICK_CONTROLS = [
  { label: 'Warmer colors', instruction: 'Make the color palette warmer with more orange and red tones' },
  { label: 'Cooler colors', instruction: 'Make the color palette cooler with more blue and teal tones' },
  { label: 'Rounder corners', instruction: 'Increase border radius values for rounder, softer corners' },
  { label: 'Sharper corners', instruction: 'Reduce border radius values for sharper, more angular corners' },
  { label: 'Larger text', instruction: 'Increase the base font size and scale for larger, more readable typography' },
  { label: 'More contrast', instruction: 'Increase contrast between text and backgrounds for better readability' },
];

export function StepRefinement({
  designSystem,
  isRefining,
  onRefine,
  onDone,
  onBack,
}: StepRefinementProps) {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = (instruction: string) => {
    if (!instruction.trim() || isRefining) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: instruction.trim(),
      timestamp: Date.now(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setInputValue('');
    onRefine(instruction.trim());
  };

  // When refinement completes (isRefining goes from true to false), add an assistant message
  const prevRefiningRef = useRef(isRefining);
  useEffect(() => {
    if (prevRefiningRef.current && !isRefining && chatHistory.length > 0) {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'Design system updated. Check the preview to see the changes.',
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
    }
    prevRefiningRef.current = isRefining;
  }, [isRefining, chatHistory.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-6 min-h-[600px]">
        {/* Left panel - Controls and chat */}
        <div
          className="w-2/5 shrink-0 flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-primary)' }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Refine your design
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Use quick controls or describe changes in your own words
            </p>
          </div>

          {/* Quick controls */}
          <div
            className="px-5 py-3"
            style={{ borderBottom: '1px solid var(--border-primary)' }}
          >
            <p
              className="text-xs font-medium mb-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Quick adjustments
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CONTROLS.map((control) => (
                <button
                  key={control.label}
                  onClick={() => handleSend(control.instruction)}
                  disabled={isRefining}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isRefining) {
                      e.currentTarget.style.borderColor = 'var(--brand)';
                      e.currentTarget.style.color = 'var(--brand)';
                      e.currentTarget.style.background = 'var(--brand-subtle)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }}
                >
                  {control.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {chatHistory.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p
                  className="text-sm text-center"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Your refinement history will appear here
                </p>
              </div>
            )}

            {chatHistory.map((message) => (
              <div
                key={message.id}
                className="transition-all duration-300"
                style={{
                  animation: 'fadeInUp 0.3s ease-out',
                }}
              >
                <div
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm"
                    style={
                      message.role === 'user'
                        ? {
                            background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                            color: '#ffffff',
                          }
                        : {
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-primary)',
                          }
                    }
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Refining indicator */}
            {isRefining && (
              <div className="flex justify-start">
                <div
                  className="rounded-xl px-3.5 py-2.5 text-sm flex items-center gap-2"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{
                      border: '2px solid var(--brand)',
                      borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Refining...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div
            className="px-5 py-3"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Make it more playful..."
                className="input flex-1 rounded-xl px-4 py-2.5 text-sm"
                disabled={isRefining}
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isRefining}
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: inputValue.trim() && !isRefining
                    ? 'var(--brand)'
                    : 'var(--bg-tertiary)',
                  color: inputValue.trim() && !isRefining
                    ? '#ffffff'
                    : 'var(--text-tertiary)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right panel - Live preview */}
        <div className="flex-1 min-w-0">
          <LivePreviewPanel designSystem={designSystem} />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-xl px-4 py-2.5 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Back to preview
        </button>
        <button
          onClick={onDone}
          className="btn-gradient rounded-xl px-6 py-2.5 text-sm font-medium"
        >
          <span className="relative z-10">I'm happy with this</span>
        </button>
      </div>
    </div>
  );
}
