const util = require('util');
const exec = util.promisify(require('child_process').exec);
var WebSocket = require('ws');
var uniqid = require('uniqid');
var cron = require('node-cron');
require('dotenv').config();


function heartbeat() {
    clearTimeout(this.pingTimeout);
    this.pingTimeout = setTimeout(() => {
        this.terminate();
    }, 30000 + 1000);
}


console.log(process.env.URL);
var client = new WebSocket(`ws://34.84.208.3:83/ws`);
// client.on('connect', connection => {
//     console.log('WebSocket Client Connected');
// });
client.on('open', heartbeat);
client.on('ping', heartbeat);
client.on('close', function clear() {
    clearTimeout(this.pingTimeout);
});

const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

async function ls() {
    task.stop();
    try {

        //client.connect(`${process.env.URL}`);
        if (client.readyState === WebSocket.CLOSED) {
            client.ping();
        }

        let message = {
            id: 'Test',
            name: 'Test',
            type: 'logs',
            date: new Date(),
            log: 'test'
        }
        if (client.readyState === WebSocket.OPEN) {
            waitFor(50);
            client.send(JSON.stringify(message));            
        }

        task.start();

    } catch (err) {
        console.log(err.message);
        task.start();
    }
}
let task;

task = cron.schedule('*/20 * * * * *', async () => {
    ls();
}, {
    scheduled: false
});
task.start();