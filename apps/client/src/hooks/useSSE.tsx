import { useEffect } from "react";

export function useSSEConnection(url: string) {
  useEffect(() => {
    if (!url) return;

    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => {
      console.log("SSE connected");
    };

    es.onerror = (err) => {
      console.log("SSE connection lost...retrying", err);
    };

    // No onmessage needed

    return () => {
      console.log("SSE closed");
      es.close();
    };
  }, [url]);
}
