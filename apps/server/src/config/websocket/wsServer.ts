import { WebSocket, WebSocketServer, RawData } from "ws";
import { Server } from "http";

/*
We extend the default WebSocket so we can store
extra metadata per connected client.
*/
interface ExtendedWebSocket extends WebSocket {
  subscriptions: Set<string>; // bug_id subscriptions
  isAlive: boolean;
}

/*
Map that stores subscribers for each bug.

Example:

bugSubscribers = {
  BUG-101 → Set(socketA, socketB)
  BUG-202 → Set(socketC)
}
*/
const bugSubscribers: Map<string, Set<ExtendedWebSocket>> = new Map();

/*
Client subscribes to a bug
when they open the bug page.
*/
function subscribeBug(bugId: string, socket: ExtendedWebSocket) {
  if (!bugSubscribers.has(bugId)) {
    bugSubscribers.set(bugId, new Set());
  }

  bugSubscribers.get(bugId)!.add(socket);
}

/*
Remove subscription.
*/
function unsubscribeBug(bugId: string, socket: ExtendedWebSocket) {
  const subs = bugSubscribers.get(bugId);
  if (!subs) return;

  subs.delete(socket);

  if (subs.size === 0) {
    bugSubscribers.delete(bugId);
  }
}

/*
When client disconnects,
remove them from all bug subscriptions.
*/
function cleanupSubscriptions(socket: ExtendedWebSocket) {
  for (const bugId of socket.subscriptions) {
    unsubscribeBug(bugId, socket);
  }
}

/*
Safe JSON sender
*/
function sendJson(socket: WebSocket, payload: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

/*
Broadcast message to everyone watching a bug
*/
function broadcastToBug(bugId: string, payload: unknown) {
  const subs = bugSubscribers.get(bugId);
  if (!subs) return;

  const msg = JSON.stringify(payload);

  for (const client of subs) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

/*
Handle messages sent by clients
*/
function handleMessage(socket: ExtendedWebSocket, data: RawData) {
  let msg: any;

  try {
    msg = JSON.parse(data.toString());
  } catch {
    sendJson(socket, { type: "error", message: "Invalid JSON" });
    return;
  }

  /*
  Subscribe to bug
  */
  if (msg.type === "subscribe_bug") {
    const bugId = msg.bugId;

    subscribeBug(bugId, socket);
    socket.subscriptions.add(bugId);

    sendJson(socket, {
      type: "subscribed",
      bugId,
    });
  }

  /*
  Unsubscribe
  */
  if (msg.type === "unsubscribe_bug") {
    const bugId = msg.bugId;

    unsubscribeBug(bugId, socket);
    socket.subscriptions.delete(bugId);

    sendJson(socket, {
      type: "unsubscribed",
      bugId,
    });
  }
}

/*
Attach WebSocket server to HTTP server
*/
export function attachWebSocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
  });

  wss.on("connection", (socket: WebSocket) => {
    const ws = socket as ExtendedWebSocket;

    ws.subscriptions = new Set();
    ws.isAlive = true;

    ws.on("pong", () => (ws.isAlive = true));

    sendJson(ws, { type: "connected" });

    ws.on("message", (data) => {
      handleMessage(ws, data);
    });

    ws.on("close", () => {
      cleanupSubscriptions(ws);
    });
  });

  /*
  Heartbeat check
  */
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const socket = ws as ExtendedWebSocket;

      if (!socket.isAlive) return socket.terminate();

      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  /*
  This function will be used by your comment API
  */
  function broadcastNewComment(bugId: string, comment: any) {
    broadcastToBug(bugId, {
      type: "new_comment",
      bugId,
      comment,
    });
  }

  return { broadcastNewComment };
}