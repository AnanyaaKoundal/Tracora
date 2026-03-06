import http from "http";
import app from "./src/app";
import Connect from "./src/config/kafka/db";
import { initializeKafka } from "@/config/kafka/kafka_init";
import { attachWebSocketServer } from "@/config/websocket/wsServer";

initializeKafka();

const PORT = 5000;

/*
Create HTTP server from Express
*/
const server = http.createServer(app);

/*
Attach WebSocket server
*/
export const { broadcastNewComment } = attachWebSocketServer(server);

Connect().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket running on ws://localhost:${PORT}/ws`);
  });
});