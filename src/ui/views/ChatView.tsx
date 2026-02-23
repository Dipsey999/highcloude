import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { ChatMessage, DesignTokensDocument } from '../../types/messages';
import { sendChatMessage } from '../../api/chat-client';
import { buildChatSystemPrompt, flattenTokensForPrompt } from '../../api/prompt-builder';
import { ChatBubble } from '../components/ChatBubble';

interface ChatViewProps {
  apiKey: string;
  tokensDocument: DesignTokensDocument | null;
}

let messageIdCounter = 0;
function nextId(): string {
  return `chat-${Date.now()}-${++messageIdCounter}`;
}

export function ChatView({ apiKey, tokensDocument }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    if (!apiKey) {
      setError('No API key configured. Connect Claude API first.');
      return;
    }

    setError(null);

    // Add user message
    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setStreaming(true);
    setStreamingText('');

    // Build system prompt with token context
    const tokenLines = tokensDocument ? flattenTokensForPrompt(tokensDocument) : [];
    const systemPrompt = buildChatSystemPrompt(tokenLines);

    // Create abort controller
    const controller = new AbortController();
    abortRef.current = controller;

    let fullText = '';

    await sendChatMessage(
      apiKey,
      updatedMessages,
      systemPrompt,
      {
        onChunk: (text: string) => {
          fullText += text;
          setStreamingText(fullText);
        },
        onComplete: (finalText: string) => {
          const assistantMsg: ChatMessage = {
            id: nextId(),
            role: 'assistant',
            content: finalText,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreaming(false);
          setStreamingText('');
        },
        onError: (errorMsg: string) => {
          setError(errorMsg);
          setStreaming(false);
          setStreamingText('');
        },
      },
      controller.signal,
    );
  }, [input, streaming, messages, apiKey, tokensDocument]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    if (streamingText) {
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: streamingText + ' [stopped]',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }
    setStreaming(false);
    setStreamingText('');
  }, [streamingText]);

  const handleNewChat = useCallback(() => {
    if (streaming) {
      abortRef.current?.abort();
    }
    setMessages([]);
    setStreaming(false);
    setStreamingText('');
    setError(null);
    setInput('');
    inputRef.current?.focus();
  }, [streaming]);

  return (
    <div class="chat-view">
      {/* Header */}
      <div class="chat-header">
        <span class="chat-title">Claude Chat</span>
        <div class="chat-header-actions">
          {tokensDocument && (
            <span class="chat-context-badge" title="Tokens loaded as context">
              🎨 Tokens
            </span>
          )}
          <button class="btn-filter" onClick={handleNewChat}>
            New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div class="chat-messages">
        {messages.length === 0 && !streaming && (
          <div class="chat-empty">
            <div class="chat-empty-icon">💬</div>
            <div>Ask Claude about your design system</div>
            <div class="chat-empty-hint">
              Your design tokens are automatically included as context
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming response */}
        {streaming && streamingText && (
          <div class="chat-bubble chat-bubble-assistant">
            <div class="chat-bubble-content">{streamingText}</div>
            <div class="chat-bubble-streaming">
              <span class="generate-streaming-dot" />
            </div>
          </div>
        )}

        {/* Streaming indicator with no text yet */}
        {streaming && !streamingText && (
          <div class="chat-bubble chat-bubble-assistant">
            <div class="chat-bubble-content chat-thinking">
              <span class="generate-streaming-dot" />
              <span class="generate-streaming-dot" style={{ animationDelay: '0.2s' }} />
              <span class="generate-streaming-dot" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        {error && (
          <div class="chat-error">{error}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div class="chat-input-area">
        <textarea
          ref={inputRef}
          class="chat-input"
          placeholder="Ask about your design system..."
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
          rows={2}
        />
        <div class="chat-input-actions">
          {streaming ? (
            <button class="btn btn-danger chat-send-btn" onClick={handleStop}>
              Stop
            </button>
          ) : (
            <button
              class="btn btn-primary chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || !apiKey}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
