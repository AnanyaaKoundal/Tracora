// import { WebSocket, WebSocketServer } from "ws";

// const matchSubscriber = new Map();

// function subscribe(){
    
// }

// function unsubscribe(){
    
// }

// function cleanupSubscriptions(){

// }

// function sendJson(){

// }

// function broadcastToAll(){

// }

// function broadcastToMatch(){

// }

// function handleMessage(){

// }

// export function attachWebSocketServer(server:any){
//     const wss = new WebSocketServer({
//         server,
//         path: '/ws',
//         maxPayload: 1024*1024
//     })

//     wss.on("connection", async(socket: WebSocket, req: Request) => {

//         socket.isAlive = true;
//         socket.on("pong", ()=>{socket.isAlive = true}); 

//         socket.subscriptions = new Set();

//         sendJson(socket, { type: "welcome"});

//         socket.on("message", (data) => {
//             handleMessage(socket, data);
//         })

//         socket.on("error", ( ) => {
//             socket.terminate();
//         })

//         socket.on("close", ()=>{
//             cleanupSubscriptions(socket);
//         })

//         socket.on("error", (err) => console.error("WS Error:", err));
//     })

//     const interval = setInterval(() => {
//         wss.clients.forEach((ws)=>{
//             if(ws.isAlive === false){
//                 return ws.terminate();
//             }
//             ws.isAlive = false;
//             ws.ping();
//         })
//     }, 3000);

//     wss.on("close", ()=> clearInterval(interval)); 

//     function broadcastMatchCreated(match){
//         broadcastToAll(wss, {type: "match_created", payload: match});
//     }

//     function broadcastCommentary(matchId, comment){
//         broadcastToMatch(matchId,  {type: "commentary", data: comment});
//     }

//     return {broadcastMatchCreated, broadcastCommentary};
// }