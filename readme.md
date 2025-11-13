# WebSocket Chat (Terminal) — README

A simple terminal-based chat using WebSockets (the `ws` library for Node.js). This repository contains two files: a **server** (`server.js`) and a **client** (`client.js`). The client accepts a username from the command line and can send either private or broadcast messages.

---

## Contents

* `server.js` — WebSocket server that accepts connections, tracks connected users, and routes messages (private or broadcast).
* `client.js` — Terminal-based client that connects to the server and sends commands typed in the terminal.

---

## Prerequisites

* Node.js (v12+ recommended)
* `npm` (Node package manager)

Install dependencies:

```bash
npm init -y
npm install ws
```

---

## How to run

1. Start the server (in one terminal):

```bash
node server.js
```

You should see: `server running on the port 3000` (or similar).

2. Start a client (in another terminal):

```bash
node client.js alice
```

Start more clients in separate terminals using different usernames:

```bash
node client.js shizuka
node client.js nonita
```

---

## Client commands (typed in terminal)

When a client connects it prints:

```
Commands:
/p <username> <message>  (Private message)
/b <message>            (Broadcast message)
```

Examples:

* Private: `/p shizuka hello` — sends a private message to `shizuka`.
* Broadcast: `/b hello everyone` — sends a message to all connected clients except the sender.

If you type something else it will print `Invalid command! Use /p or /b`.

---

## Message formats exchanged between client and server

The client sends JSON strings to the server. The important fields are `type`, and additional fields depending on type.

1. **Join** (sent by client immediately after connecting):

```json
{ "type": "join", "username": "alice" }
```

2. **Private message** (from client):

```json
{ "type": "private", "from": "alice", "to": "shizuka", "text": "hello" }
```

3. **Broadcast message** (from client):

```json
{ "type": "broadcast", "from": "alice", "text": "hello everyone" }
```

Server responses in the code are simple text strings like `alice -> hello` (private) or `alice (to all) hello` (broadcast). You can change the server to send structured JSON responses instead.

---

## Step-by-step explanation (code-level)

Below is a concise mapping of the major steps and why they exist. These match the comments in your provided files.

### Client (`client.js`)

1. **Import WebSocket library**

   ```js
   const WebSocket = require("ws");
   ```

   * Loads the `ws` client implementation so we can connect to a WebSocket server.

2. **Take username from command line**

   ```js
   const username = process.argv[2];
   if (!username) { /* show usage and exit */ }
   ```

   * Ensures each client has a username. We use it when sending messages and registering on server.

3. **Connect to WebSocket server**

   ```js
   const ws = new WebSocket("ws://localhost:3000");
   ```

   * Opens a socket connection to the server running locally on port 3000.

4. **On connection open**

   ```js
   ws.on("open", () => { ... });
   ```

   * Send a `join` message to the server: `ws.send(JSON.stringify({ type: "join", username }));` so the server knows which WebSocket belongs to which username.
   * Print the command help so user knows how to interact.

5. **Listen for terminal input**

   ```js
   process.stdin.on("data", (input) => { ... });
   ```

   * Read user keystrokes. If input starts with `/p ` we parse it as a private message, if `/b ` parse as broadcast. We then `ws.send(JSON.stringify(...))` the appropriate JSON structure.

6. **When server sends a message**

   ```js
   ws.on("message", (data) => { console.log("msg", data.toString()); });
   ```

   * Print whatever data arrives. Right now the server sends plain strings; the client prints them raw.

### Server (`server.js`)

1. **Import WebSocket library and create server**

   ```js
   const WebSocket = require("ws");
   const wss = new WebSocket.Server({ port: 3000 });
   ```

   * `wss` listens for new WebSocket connections on port 3000.

2. **Keep track of connected users**

   ```js
   const users = {};
   ```

   * `users[username] = ws` maps usernames to the client WebSocket objects.

3. **On new connection**

   ```js
   wss.on("connection", (ws) => {
     ws.on("message", (msg) => {
       const data = JSON.parse(msg);
       // handle `join`, `private`, `broadcast`
     });
   });
   ```

   * The server listens for messages from each connected client, parses JSON, and routes messages.

4. **Handle `join`**

   ```js
   if (data.type === "join") {
     users[data.username] = ws;
     console.log(`${data.username} joined`);
   }
   ```

   * Adds the username to `users` map so server can find the target when delivering a private message.

5. **Handle `private`**

   ```js
   if (data.type === "private") {
     const to = users[data.to];
     if (to) {
       to.send(`${data.from} -> ${data.text}`);
     }
     return;
   }
   ```

   * Looks up the `to` user WebSocket and sends them a plain string. If `to` is not found nothing happens (you may want to notify the sender).

6. **Handle `broadcast`**

   ```js
   if (data.type === "broadcast") {
     for (const user in users) {
       if (users[user] !== ws) {
         users[user].send(`${data.from} (to all) ${data.text}`)
       }
     }
   }
   ```

   * Iterates over all connected users and sends the message to everyone except the origin socket.

7. **Start message**

   ```js
   console.log('server running on the port 3000');
   ```

---

## Important notes, edge cases and improvements

* **Handle disconnects**: Currently when a client disconnects (or closes the terminal) the `users` map still holds a reference. Add `ws.on('close', () => { /* remove from users */ })` to remove stale entries.

* **Duplicate usernames**: If two clients connect with the same username they will overwrite each other in the `users` map. Consider rejecting duplicate usernames or using unique IDs.

* **Use JSON for responses**: Right now the server sends plain strings to clients. Prefer sending structured JSON (e.g. `{type: 'private', from: 'alice', text: '...'}`) so the client can present messages more cleanly.

* **Acknowledge missing recipients**: If a private `to` user is not found, reply to the sender with an error message.

* **Security and validation**: Validate and sanitize incoming messages to avoid crashes on malformed JSON.

* **Message history**: Consider storing recent messages (in memory or DB) so newly joined users can fetch history.

* **Scalability**: For many users and multiple server instances, use a shared store (Redis pub/sub) or a real message broker.

* **Heartbeats/pings**: Use `ws.ping()`/`ws.on('pong', ...)` or implement an application-level heartbeat to detect dead connections.

---

## Example session

Terminal 1:

```bash
node server.js
# server running on the port 3000
```

Terminal 2:

```bash
node client.js alice
# alice connected to server
# Commands: /p <username> <message>  /b <message>
/p shizuka hey
```

Terminal 3:

```bash
node client.js shizuka
# shizuka joined
# receives: alice -> hey
```

---

## File structure suggestion

```
/websocket-chat
  |- server.js
  |- client.js
  |- README.md
  |- package.json
```


