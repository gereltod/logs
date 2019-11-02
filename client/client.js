const util = require('util');
const exec = util.promisify(require('child_process').exec);
var WebSocket = require('ws');
var uniqid = require('uniqid');
var cron = require('node-cron');
require('dotenv').config();


function heartbeat() {
    clearTimeout(this.pingTimeout);

    // Use `WebSocket#terminate()`, which immediately destroys the connection,
    // instead of `WebSocket#close()`, which waits for the close timer.
    // Delay should be equal to the interval at which your server
    // sends out pings plus a conservative assumption of the latency.
    this.pingTimeout = setTimeout(() => {
        this.terminate();
    }, 30000 + 1000);
}


console.log(process.env.URL);
var client = new WebSocket(`${process.env.URL}`);
// client.on('connect', connection => {
//     console.log('WebSocket Client Connected');
// });
client.on('open', heartbeat);
client.on('ping', heartbeat);
client.on('close', function clear() {
    clearTimeout(this.pingTimeout);
});


let info_project = process.env.PROJECT;

async function getName() {

    const { stdout, stderr } = await exec('docker ps -f name=baito_backend');

    var content = stdout.toString().split('\n');
    let containers = {};

    for (let i = 1; i < content.length; i++) {
        var content_tab = content[i].split(' ');
        let data = [];
        let id;
        for (let j = 0; j < content_tab.length; j++) {
            if (j === 0) {
                id = content_tab[j];
                data.push(content_tab[j]);
            } else if (content_tab[j] !== '' && content_tab[j].includes('baito_')) {
                data.push(content_tab[j]);
            }
        };
        if (id !== "")
            containers[id] = data;
    };
    return containers;
}
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

async function ls() {
    task.stop();
    try {

        //client.connect(`${process.env.URL}`);
        if (client.readyState === WebSocket.CLOSED) {
            client.ping();
        }

        const { stdout, stderr } = await exec('docker ps -f name=baito_backend');

        var content = stdout.toString().split('\n');
        let containers = {};

        for (let i = 1; i < content.length; i++) {
            var content_tab = content[i].split(' ');
            let data = [];
            let id;
            for (let j = 0; j < content_tab.length; j++) {
                if (j === 0) {
                    id = content_tab[j];
                    data.push(content_tab[j]);
                } else if (content_tab[j] !== '' && content_tab[j].includes('baito_')) {
                    data.push(content_tab[j]);
                }
            };
            containers[id] = data;
        };
        // //console.log(containers);
        // Object.values(webSockets).forEach((item) => {                                
        //     let message = { type:'container', name: containers };
        //     item.send(JSON.stringify(message));

        // });

        for (let i = 1; i < content.length; i++) {
            if (content[i] != '') {
                var content_tab = content[i].split(' ');

                for (let j = 0; j < content_tab.length; j++) {
                    if (j === 0) {
                        const { stdout, stderr } = await exec(`docker logs -t --tail=50 ${content_tab[j]}`);

                        //console.log(stdout)

                        let name = containers[content_tab[j]][1];
                        let message = {
                            type: 'logs', project: info_project,
                            date: Date(), id: content_tab[j], name: name, log: stdout
                        };
                        if (client.readyState === WebSocket.OPEN) {
                            waitFor(50);
                            client.send(JSON.stringify(message));
                            console.log('WebSocket Client Connected:', name);
                        }

                    }
                };
            }
        };
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