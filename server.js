const WebSocket = require("ws") // step 1 

const wss = new WebSocket.Server({port:3000}) //step 2

const users = {} // step 3

wss.on("connection",(ws)=>{
  ws.on("message", (msg)=>{
    const data = JSON.parse(msg)
    
    // step 1  join users

    if(data.type === "join"){
      users[data.username] = ws 
      console.log(`${data.username} joined`)
    }

   // step 2 private chat 
    if(data.type === "private"){
      
      const to = users[data.to];
      if(to){
        to.send(`${data.from} -> ${data.text}`);
      }
      return
    }
  // step 3
    if(data.type === "broadcast"){

      for(const user in users ){
       
        if(users[user] !== ws){
          users[user].send(`${data.from} (to all) ${data.text} `)
        }
      }
    }
  })
})

// server start message 
console.log('serve running on thhe port 3000')
