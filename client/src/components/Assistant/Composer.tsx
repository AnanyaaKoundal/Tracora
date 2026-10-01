'use client';

import { FormEvent, useState } from 'react';
import { Send } from 'lucide-react';
import { useAssistantStore } from '@/schemas/assistantStore';

export default function Composer() {
  const busy = useAssistantStore((s) => s.busy);
  const context = useAssistantStore((s) => s.context);
  const shareContext = useAssistantStore((s) => s.shareContext);
  const setShareContext = useAssistantStore((s) => s.setShareContext);
  const send = useAssistantStore((s) => s.send);
  const [input, setInput] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = input;
    setInput('');
    if (text.trim()) send(text);
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50/70">
      {context && (
        <div className="flex items-center gap-2 px-3 pt-2.5">
          {shareContext && (
            <span className="inline-flex max-w-[10rem] items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
              <span className="truncate">{context.label}</span>
            </span>
          )}

          <button
            type="button"
            role="switch"
            aria-checked={shareContext}
            onClick={() => setShareContext(!shareContext)}
            title={
              shareContext
                ? "The assistant can see what's on this page. Click to stop sharing."
                : "Let the assistant use what's on this page. Click to share."
            }
            className={`ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
              shareContext ? 'text-teal-700' : 'text-slate-400 hover:text-slate-500'
            }`}
          >
            Context
            <span
              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                shareContext ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
                  shareContext ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder="Ask about projects, bugs, or this page"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="rounded-xl bg-teal-600 p-2 text-white shadow-sm transition-colors hover:bg-teal-700 disabled:bg-slate-300"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
