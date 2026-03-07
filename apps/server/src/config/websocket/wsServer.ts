import { WebSocket, WebSocketServer, RawData } from "ws";
import { Server } from "http";

/*
Extended socket metadata
*/
interface ExtendedWebSocket extends WebSocket {
  subscriptions: Set<string>; // bug subscriptions
  userId?: string;
  isAlive: boolean;
}

/*
Bug watchers
*/
const bugSubscribers: Map<string, Set<ExtendedWebSocket>> = new Map();

/*
User notification subscribers
*/
const userSubscribers: Map<string, Set<ExtendedWebSocket>> = new Map();

/*
BUG SUBSCRIPTIONS
*/

function subscribeBug(bugId: string, socket: ExtendedWebSocket) {
  if (!bugSubscribers.has(bugId)) {
    bugSubscribers.set(bugId, new Set());
  }

  bugSubscribers.get(bugId)!.add(socket);
}

function unsubscribeBug(bugId: string, socket: ExtendedWebSocket) {
  const subs = bugSubscribers.get(bugId);
  if (!subs) return;

  subs.delete(socket);

  if (subs.size === 0) {
    bugSubscribers.delete(bugId);
  }
}

/*
USER SUBSCRIPTIONS (for notifications)
*/

function subscribeUser(userId: string, socket: ExtendedWebSocket) {
  if (!userSubscribers.has(userId)) {
    userSubscribers.set(userId, new Set());
  }

  userSubscribers.get(userId)!.add(socket);
}

function unsubscribeUser(userId: string, socket: ExtendedWebSocket) {
  const subs = userSubscribers.get(userId);
  if (!subs) return;

  subs.delete(socket);

  if (subs.size === 0) {
    userSubscribers.delete(userId);
  }
}

/*
Cleanup when socket closes
*/
function cleanupSubscriptions(socket: ExtendedWebSocket) {

  for (const bugId of socket.subscriptions) {
    unsubscribeBug(bugId, socket);
  }

  if (socket.userId) {
    unsubscribeUser(socket.userId, socket);
  }
}

/*
Send JSON safely
*/
function sendJson(socket: WebSocket, payload: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

/*
Broadcast comment to bug watchers
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
Send notification to a specific user
*/
function sendNotificationToUser(userId: string, payload: unknown) {
  const subs = userSubscribers.get(userId);
  if (!subs) return;
  
  const msg = JSON.stringify(payload);
  console.log(msg);
  for (const client of subs) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

/*
Handle client messages
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
  Subscribe bug
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
  Unsubscribe bug
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

  /*
  Register user for notifications
  */
  if (msg.type === "subscribe_user") {
    const userId = msg.employeeId;

    socket.userId = userId;

    subscribeUser(userId, socket);

    sendJson(socket, {
      type: "user_registered",
      userId,
    });
  }
}

/*
Attach server
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
  Heartbeat
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
  Comment broadcast (already used)
  */
  function broadcastNewComment(bugId: string, comment: any) {

    broadcastToBug(bugId, {
      type: "new_comment",
      bugId,
      comment,
    });

  }

  /*
  Notification sender (Kafka consumer will use this)
  */
  function broadcastNotification(userId: string, notification: any) {

    sendNotificationToUser(userId, {
      type: "notification",
      notification,
    });

  }

  return {
    broadcastNewComment,
    broadcastNotification,
  };
}