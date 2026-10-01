'use client';

import { useEffect, useState } from 'react';
import { Maximize2, Menu, Plus, Sparkles, X } from 'lucide-react';
import { useAssistantStore } from '@/schemas/assistantStore';
import ChatMessages from './ChatMessages';
import Composer from './Composer';
import ConversationList from './ConversationList';

export default function AssistantPanel() {
  const open = useAssistantStore((s) => s.open);
  const expanded = useAssistantStore((s) => s.expanded);
  const error = useAssistantStore((s) => s.error);
  const setOpen = useAssistantStore((s) => s.setOpen);
  const setExpanded = useAssistantStore((s) => s.setExpanded);
  const loadConversations = useAssistantStore((s) => s.loadConversations);
  const newConversation = useAssistantStore((s) => s.newConversation);

  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!open) setShowHistory(false);
  }, [open]);

  useEffect(() => {
    if (open) loadConversations();
  }, [open, loadConversations]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showHistory) setShowHistory(false);
      else setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, showHistory, setOpen]);

  if (!open || expanded) return null;

  const iconButton =
    'rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800';

  return (
    <div className="fixed bottom-24 right-6 z-40 flex h-[32rem] w-[24rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            aria-label="Conversations"
            className={iconButton}
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">Assistant</h2>
            <p className="truncate text-xs text-slate-500">Your workspace assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={newConversation}
            aria-label="New chat"
            title="New chat"
            className={iconButton}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expand assistant"
            title="Open in workspace"
            className={iconButton}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            className={iconButton}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <span className="text-xs font-medium text-slate-600">Conversations</span>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              aria-label="Close conversations"
              className={iconButton}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ConversationList onSelect={() => setShowHistory(false)} />
        </div>
      ) : (
        <>
          <ChatMessages />
          {error && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          <Composer />
        </>
      )}
    </div>
  );
}
