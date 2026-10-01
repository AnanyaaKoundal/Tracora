'use client';

import { Sparkles, X } from 'lucide-react';
import { useAssistantStore } from '@/schemas/assistantStore';

export default function AssistantBadge() {
  const open = useAssistantStore((s) => s.open);
  const toggleOpen = useAssistantStore((s) => s.toggleOpen);

  return (
    <button
      type="button"
      onClick={toggleOpen}
      aria-label={open ? 'Close assistant' : 'Open assistant'}
      title={open ? 'Close assistant' : 'Ask the assistant'}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
    >
      {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
    </button>
  );
}
