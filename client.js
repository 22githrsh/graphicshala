// Import WebSocket library
const WebSocket = require("ws");

// Take username from command line
const username = process.argv[2];
if (!username) {
  console.log("Usage: node client.js <username>");
  process.exit(1);
}

// Connect to WebSocket server
const ws = new WebSocket("ws://localhost:3000");

// When connection opens
ws.on("open", () => {
  console.log(`${username} connected to server`);

  // Inform server who joined
  ws.send(JSON.stringify({ type: "join", username }));

  console.log("Commands:");
  console.log("/p <username> <message>  (Private message)");
  console.log("/b <message>            (Broadcast message)");
});

// Listen for terminal input
process.stdin.on("data", (input) => {
  const text = input.toString().trim();

  // Private message: /p shizuka hello
  if (text.startsWith("/p ")) {
    const parts = text.split(" ");
    const toUser = parts[1];
    const message = parts.slice(2).join(" ");

    ws.send(JSON.stringify({
      type: "private",
      from: username,
      to: toUser,
      text: message
    }));
  }

  // Broadcast message: /b hello everyone
  else if (text.startsWith("/b ")) {
    const message = text.slice(3);

    ws.send(JSON.stringify({
      type: "broadcast",
      from: username,
      text: message
    }));
  }

  // Invalid command
  else {
    console.log("Invalid command! Use /p or /b");
  }
});

// When server sends a message
ws.on("message", (data) => {
  console.log("msg", data.toString());
});