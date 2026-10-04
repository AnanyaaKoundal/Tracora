'use client';

import { Trash2 } from 'lucide-react';
import { useAssistantStore } from '@/schemas/assistantStore';

export default function ConversationList({ onSelect }: { onSelect?: () => void }) {
  const conversations = useAssistantStore((s) => s.conversations);
  const loading = useAssistantStore((s) => s.loadingConversations);
  const conversationId = useAssistantStore((s) => s.conversationId);
  const selectConversation = useAssistantStore((s) => s.selectConversation);
  const removeConversation = useAssistantStore((s) => s.removeConversation);

  const handleSelect = (id: string) => {
    selectConversation(id);
    onSelect?.();
  };

  return (
    <div className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
      {loading && conversations.length === 0 && (
        <p className="px-2 py-1 text-xs text-slate-400">Loading...</p>
      )}
      {!loading && conversations.length === 0 && (
        <p className="px-2 py-1 text-xs text-slate-400">No conversations yet.</p>
      )}
      {conversations.map((c) => (
        <div
          key={c.conversation_id}
          className={`group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors ${
            c.conversation_id === conversationId ? 'bg-teal-50' : 'hover:bg-slate-100'
          }`}
        >
          <button
            type="button"
            onClick={() => handleSelect(c.conversation_id)}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate text-xs font-medium text-slate-900">{c.title}</p>
            {c.preview && <p className="truncate text-[11px] text-slate-400">{c.preview}</p>}
          </button>
          <button
            type="button"
            aria-label="Delete conversation"
            onClick={() => removeConversation(c.conversation_id)}
            className="rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
