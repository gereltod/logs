const util = require('util');
const exec = util.promisify(require('child_process').exec);

var WebSocketServer = require('ws');
var http = require('http');
var uniqid = require('uniqid');
var cron = require('node-cron');


let webSockets = {}
function noop() { }

let CLIENTS = [];

const wsServer = new WebSocketServer.Server({ port: 3000 });
function heartbeat() {
    this.isAlive = true;
}

wsServer.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

wsServer.on('connection', function connection(ws) {
    console.log(wsServer.getUniqueID());
    ws.id = wsServer.getUniqueID();
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    CLIENTS.push(ws);
    ws.on('message', function incoming(message) {
        try {
            let dd = JSON.parse(message);

            if (dd.type === 'containers') {
                let con = '';//await getName();
                let message = { type: 'containers', name: con };
                connection.send(JSON.stringify(message));
            } else if (dd.type === "logs") {
                //console.log(dd.name);           
                //sendAll(JSON.stringify(dd));
                wsServer.clients.forEach(function each(client) {
                    //console.log('bbbb');
                    if (client.readyState === WebSocketServer.OPEN) {
                        // console.log('ddd');
                        client.send(message);
                    }
                });
            }

        } catch (err) {
            console.log(err.message);
        }
    });

    ws.on('close', function (connection) {
        // close user connection
    });

});

function sendAll(message) {
    for (var i = 0; i < CLIENTS.length; i++) {
        CLIENTS[i].send(message);
    }
}

const interval = setInterval(function ping() {
    wsServer.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();

        ws.isAlive = false;
        ws.ping(noop);
    });
}, 30000);