"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AssistantContext } from "@/services/aiService";
import { useAssistantStore } from "@/schemas/assistantStore";

// A page declares what the user is looking at, and the assistant carries it on every
// turn regardless of whether it is shown as the corner panel or the full screen view.
// `key` is the identity of the thing on screen (a bug id, "new", ...). The context
// object is rebuilt on each render, so depending on the key is deliberate.
export function useAssistantContext(context: AssistantContext | null, key: string) {
  const setContext = useAssistantStore((s) => s.setContext);

  useEffect(() => {
    setContext(context);
    return () => setContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

// Any ordinary page can declare itself with one line: usePageContext("Projects").
// The pathname is the identity, so navigating between pages swaps the context without
// the caller having to build a key. Detail pages that carry real data (a bug, a draft)
// use useAssistantContext directly instead.
export function usePageContext(label: string) {
  const pathname = usePathname();
  useAssistantContext({ kind: "page", label, data: {} }, `page:${pathname}`);
}
