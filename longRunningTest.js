let https = require('https')
let net = require('net')
let myAgent = require('.')
let fs = require('fs')
let si = require('si')
let testserver = require('./testserver')
ports = {}
ports.add = function (k, i) {
  i = i || 1
  this[k] = i + (this[k] || 0)
}

let workers = 0
let countDown = 300000
let agents = []

agents[0] = new myAgent({maxSockets: 4, proxy: {hostname: 'localhost', port: 3128}})
agents[1] = new myAgent({proxy: {hostname: 'localhost', port: 3129, auth: 'bob:alice'}})

function doit () {
  if (countDown <= 0) {
    return
  }
  countDown = countDown - 1
  workers = workers + 1
  agents[2] = new myAgent({maxSockets: 4, proxy: {host: 'localhost', port: 3128}})
  let x = agents[countDown % 3]
  https.get({hostname: 'localhost', port: 8443 + countDown % 2, agent: x, rejectUnauthorized: false}, (resp) => {
    ports.add(resp.socket.localPort)
    resp.on('data', x => x
    )
      .on('end', () => {
        doit()
        workers = workers - 1
      })
  }).on('error', (err) => {
    console.log('MyError: ' + err.message)
  })
}

testserver.start().then(
  () => {
    for (i = 0; i < 50; ++i) {
      setImmediate(doit)

    }
  }
)
let oc = countDown
setInterval(() => {
    fs.readdir('/proc/self/fd',
      (err, data) => {
        let l = process.memoryUsage()
        l.workers = workers
        l.ReqPerSec = oc - countDown
        l.countDown = countDown
        if (data) l.fds = data.length
        l.seenPorts = Object.keys(ports).length
        Object.keys(l).map(k => l[k] = (l[k]<10000)?l[k]:si.format(l[k]))
        console.log(l)
        oc = countDown
      })
  },
  5000
)

process.stdin.on('data', data => {
  // if you enter NUMBER\n the countDown will be set to NUMBER
  if (data > 0) {
    countDown = data
  }
  // entering s\n will start 50 parallel workers
  if (data == 's\n') {
    for (i = 0; i < 50; ++i) {
      setImmediate(doit)
    }
  }
})
