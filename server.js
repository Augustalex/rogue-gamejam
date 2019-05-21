const express = require('express');
const http = require('http');
const port = 3000;
const SocketIO = require('socket.io');

run();

async function run() {
    const log = Log();

    const app = express();
    app.use(express.static(__dirname));
    app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
    app.get('/log', (req, res) => {
        res.end(JSON.stringify(log.read()));
    });
    const server = http.createServer(app);
    const socketMaster = SocketIO(server);

    console.log(` - 2/2 Setting up server at port ${port}`);
    server.listen(port, () => {
        console.log(` - 2/2 SUCCESS, running on port ${port}\n`);
    });

    socketMaster.on('connection', socket => {
        socket.on('dispatch', data => {
            // console.log('dispatch', data.argument);
            log.push(['d', data]);
            socket.broadcast.emit('dispatch', data)
        });
        socket.on('commit', data => {
            // console.log('commit', data.argument);
            log.push(['c', data]);
            socket.broadcast.emit('commit', data)
        });

        const readLog = log.read();
        for (let i = 0; i < readLog.length; i++) {
            if (readLog[i][0] === 'd') {
                socket.emit('dispatch', readLog[i][1])
            }
            else if (readLog[i][0] === 'c') {
                socket.emit('commit', readLog[i][1])
            }
        }
    });
}

function Log() {
    let log = [];

    return {
        push,
        read
    };

    function push(data) {
        log.push(data);
        if (log.length > 10000) {
            log = log.slice(5000);
        }
    }

    function read() {
        return log;
    }
}
