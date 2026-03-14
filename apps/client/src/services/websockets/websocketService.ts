// /services/websocketService.ts

type Listener = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Record<string, Listener[]> = {};
  private url = "ws://localhost:5000/ws";

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("✅ Global WebSocket connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        const eventType = data.type;

        if (!eventType) return;

        const handlers = this.listeners[eventType] || [];

        handlers.forEach((handler) => {
          try {
            handler(data);
          } catch (err) {
            console.error("WS listener error:", err);
          }
        });
      } catch (err) {
        console.error("Invalid WS message:", err);
      }
    };

    this.ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    this.ws.onclose = () => {
      console.log("⚠️ WebSocket disconnected");
      this.ws = null;
    };
  }

  subscribe(eventType: string, callback: Listener) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }

    this.listeners[eventType].push(callback);
  }

  unsubscribe(eventType: string, callback: Listener) {
    if (!this.listeners[eventType]) return;

    this.listeners[eventType] = this.listeners[eventType].filter(
      (cb) => cb !== callback
    );
  }

  send(data: any) {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
      this.connect();
      setTimeout(() => this.send(data), 100);
      return;
    }
  
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return;
    }
  
    if (this.ws.readyState === WebSocket.CONNECTING) {
      const ws = this.ws;
      ws.addEventListener(
        "open",
        () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
          }
        },
        { once: true }
      );
    }
  }
}

const websocketService = new WebSocketService();

export default websocketService;