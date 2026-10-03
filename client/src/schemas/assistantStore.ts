import { create } from "zustand";
import {
  AssistantContext,
  chatService,
  Citation,
  ConversationSummary,
  deleteConversationService,
  getConversationService,
  listConversationsService,
} from "@/services/aiService";

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
  steps?: string[];
  citations?: Citation[];
};

type AssistantState = {
  open: boolean;
  expanded: boolean;
  shareContext: boolean;
  messages: AssistantMessage[];
  conversationId: string | null;
  conversations: ConversationSummary[];
  loadingConversations: boolean;
  busy: boolean;
  error: string | null;
  context: AssistantContext | null;

  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setExpanded: (expanded: boolean) => void;
  setShareContext: (share: boolean) => void;
  setContext: (context: AssistantContext | null) => void;
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  newConversation: () => void;
  removeConversation: (id: string) => Promise<void>;
  send: (text: string) => Promise<void>;
};

// Conversation state lives here rather than inside the panel so that closing the
// panel, expanding it, or navigating between pages does not lose it. The durable
// copy is in MongoDB; this is just the live view of the conversation on screen.
export const useAssistantStore = create<AssistantState>((set, get) => ({
  open: false,
  expanded: false,
  // Context is opt-out, not silent: the pill above the composer shows exactly what
  // would be shared and one click stops it. The badge always reopens the small panel.
  shareContext: true,
  messages: [],
  conversationId: null,
  conversations: [],
  loadingConversations: false,
  busy: false,
  error: null,
  context: null,

  setOpen: (open) => set({ open }),
  toggleOpen: () =>
    set((s) => (s.open ? { open: false, expanded: false } : { open: true, expanded: false })),
  setExpanded: (expanded) => set({ expanded }),
  setShareContext: (shareContext) => set({ shareContext }),
  setContext: (context) => set({ context }),

  loadConversations: async () => {
    set({ loadingConversations: true });
    try {
      const conversations = await listConversationsService();
      set({ conversations });
    } catch {
      // A failed sidebar fetch must not take down the chat itself.
    } finally {
      set({ loadingConversations: false });
    }
  },

  selectConversation: async (id) => {
    if (get().busy) return;
    set({ error: null });
    try {
      const detail = await getConversationService(id);
      set({
        conversationId: detail.conversation_id,
        messages: detail.messages.map((m) => ({
          role: m.role,
          content: m.content,
          steps: m.steps,
          citations: m.citations,
        })),
      });
    } catch {
      set({ error: "Could not open that conversation." });
    }
  },

  newConversation: () => set({ conversationId: null, messages: [], error: null }),

  removeConversation: async (id) => {
    try {
      await deleteConversationService(id);
      if (get().conversationId === id) {
        set({ conversationId: null, messages: [] });
      }
      await get().loadConversations();
    } catch {
      set({ error: "Could not delete that conversation." });
    }
  },

  send: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().busy) return;

    set((s) => ({
      error: null,
      busy: true,
      messages: [...s.messages, { role: "user", content: trimmed }],
    }));

    try {
      const result = await chatService(
        trimmed,
        get().shareContext ? get().context : null,
        get().conversationId
      );
      set((s) => ({
        conversationId: result.conversation_id,
        messages: [
          ...s.messages,
          {
            role: "assistant",
            content: result.reply,
            steps: result.steps,
            citations: result.citations,
          },
        ],
      }));
      await get().loadConversations();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      set({ busy: false });
    }
  },
}));
