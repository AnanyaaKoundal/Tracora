'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useAssistantStore } from '@/schemas/assistantStore';
import Markdown from './Markdown';

const STARTERS = [
  'What projects do we have?',
  'Any existing bugs about slow loading?',
  'Is there a known issue with the login page?',
];

export default function ChatMessages() {
  const messages = useAssistantStore((s) => s.messages);
  const busy = useAssistantStore((s) => s.busy);
  const send = useAssistantStore((s) => s.send);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  return (
    <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Try one of these:</p>
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50"
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
                ? 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-teal-600 px-3.5 py-2 text-sm text-white'
                : 'max-w-[95%] space-y-2'
            }
          >
            {m.role === 'assistant' && m.steps && m.steps.length > 0 && (
              <ul className="space-y-1 border-l-2 border-teal-300 pl-2">
                {m.steps.map((step, j) => (
                  <li key={j} className="text-xs text-slate-500">
                    {step}
                  </li>
                ))}
              </ul>
            )}
            {m.role === 'user' ? (
              <p className="whitespace-pre-wrap">{m.content}</p>
            ) : (
              <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800">
                <Markdown>{m.content}</Markdown>
              </div>
            )}
          </div>
        </div>
      ))}

      {busy && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Looking into that...
        </div>
      )}
    </div>
  );
}
