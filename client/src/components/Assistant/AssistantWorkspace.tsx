'use client';

import { useEffect, useState } from 'react';
import { Menu, Minimize2, Plus, Sparkles, X } from 'lucide-react';
import { useAssistantStore } from '@/schemas/assistantStore';
import ChatMessages from './ChatMessages';
import Composer from './Composer';
import ConversationList from './ConversationList';

export default function AssistantWorkspace() {
  const error = useAssistantStore((s) => s.error);
  const setOpen = useAssistantStore((s) => s.setOpen);
  const setExpanded = useAssistantStore((s) => s.setExpanded);
  const loadConversations = useAssistantStore((s) => s.loadConversations);
  const newConversation = useAssistantStore((s) => s.newConversation);

  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const close = () => {
    setOpen(false);
    setExpanded(false);
  };

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Desktop history sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 sm:flex">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-900">Assistant</h2>
          </div>
          <button
            type="button"
            onClick={newConversation}
            aria-label="New chat"
            title="New chat"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-teal-600"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <ConversationList />
      </aside>

      {/* Mobile history drawer */}
      {showHistory && (
        <div className="absolute inset-0 z-30 flex sm:hidden">
          <div className="flex w-72 max-w-[80%] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">Conversations</span>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                aria-label="Close conversations"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ConversationList onSelect={() => setShowHistory(false)} />
          </div>
          <button
            type="button"
            aria-label="Close conversations"
            onClick={() => setShowHistory(false)}
            className="flex-1 bg-slate-900/40"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              aria-label="Conversations"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 sm:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">Assistant</h2>
              <p className="truncate text-xs text-slate-500">Your workspace assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={newConversation}
              aria-label="New chat"
              title="New chat"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 sm:hidden"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Minimize assistant"
              title="Back to the panel"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={close}
              aria-label="Close assistant"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <ChatMessages />
        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <Composer />
      </div>
    </div>
  );
}
