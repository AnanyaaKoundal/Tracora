'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { chatService } from '@/services/aiService';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  steps?: string[];
};

const STARTERS = [
  'Is there an existing bug for a missing reset password link?',
  'Any prior bugs about the signin page being slow?',
];

export default function AssistantPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setBusy(true);

    try {
      const result = await chatService(trimmed);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.reply, steps: result.steps },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="fixed bottom-24 right-6 z-40 flex h-[32rem] w-[24rem] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Assistant</h2>
          <p className="text-xs text-gray-500">Searches this company&apos;s bugs</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Try one of these:</p>
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[85%] rounded-lg rounded-br-sm bg-indigo-600 px-3 py-2 text-sm text-white whitespace-pre-wrap'
                  : 'max-w-[95%] space-y-2'
              }
            >
              {m.role === 'assistant' && m.steps && m.steps.length > 0 && (
                <ul className="space-y-1 border-l-2 border-indigo-200 pl-2">
                  {m.steps.map((step, j) => (
                    <li key={j} className="text-xs text-gray-500">
                      {step}
                    </li>
                  ))}
                </ul>
              )}
              <p
                className={
                  m.role === 'user'
                    ? ''
                    : 'rounded-lg rounded-bl-sm bg-gray-100 px-3 py-2 text-sm text-gray-900 whitespace-pre-wrap'
                }
              >
                {m.content}
              </p>
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching the bug tracker...
          </div>
        )}
      </div>

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-gray-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder="Describe a problem, or ask about existing bugs"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-400 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="rounded-lg bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
