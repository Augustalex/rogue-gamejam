const express = require("express");
const Log = require("./server/Log.js");
const http = require("http");
const SocketIO = require("socket.io");

// Parse port from command-line arguments
let port = 3000;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (["-p", "--p", "-port", "--port"].includes(args[i])) {
    const nextArg = args[i + 1];
    if (nextArg && !isNaN(Number(nextArg))) {
      port = Number(nextArg);
      break;
    }
  }
}

run();

async function run() {
  const log = Log({ limit: 100000 });
  // const store = ServerStore({ log });

  const app = express();
  app.use(express.static(__dirname));
  app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
  app.get("/log", (req, res) => {
    res.end(JSON.stringify(log.read()));
  });
  const server = http.createServer(app);
  const socketMaster = SocketIO(server);

  console.log(` - 2/2 Setting up server at port ${port}`);
  server.listen(port, () => {
    console.log(` - 2/2 SUCCESS, running on port ${port}\n`);
  });

  const clients = new Set();
  let isFirst = true;

  socketMaster.on("connection", (socket) => {
    socket.on("login", (data) => {
      const clientId = data.clientId;
      console.log(clients);
      if (clients.has(clientId)) {
        socket.emit("start", { alreadyCreated: true });
      } else if (isFirst) {
        isFirst = false;
        socket.emit("setup");
      } else {
        socket.emit("start", { alreadyCreated: false });
      }

      clients.add(clientId);
    });

    socket.on("dispatch", (data) => {
      // console.log('dispatch', data.argument);
      log.push(["d", data]);
      socket.broadcast.emit("dispatch", data);
    });
    socket.on("commit", (data) => {
      // console.log('commit', data.argument);
      log.push(["c", data]);
      socket.broadcast.emit("commit", data);
    });

    socket.on("reload", () => {
      const readLog = log.read();
      for (let i = 0; i < readLog.length; i++) {
        if (readLog[i][0] === "d") {
          socket.emit("dispatch", readLog[i][1]);
        } else if (readLog[i][0] === "c") {
          socket.emit("commit", readLog[i][1]);
        }
      }
      console.log("Done retransmitting log");
    });
  });
}

//
// function ServerStore({ log }) {
//     return {
//         commit,
//         dispatch
//     };
//
//     function commit(argument, options) {
//         log.push(['c', { argument, options }]);
//     }
//
//     function dispatch(actionName, argument) {
//         log.push(['d', { argument: actionName, options: argument }]);
//     }
// }
