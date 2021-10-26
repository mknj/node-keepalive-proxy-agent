const https = require('https')
const MyAgent = require('.')
const fs = require('fs')
const si = require('si')
const testServer = require('./testserver')
const ports = {}
ports.add = function (k, i) {
  i = i || 1
  this[k] = i + (this[k] || 0)
}

let workers = 0
let countDown = 30000
const agents = []

agents[0] = new MyAgent({ maxSockets: 4, proxy: { hostname: 'localhost', port: 3128 } })
agents[1] = new MyAgent({ proxy: { hostname: 'localhost', port: 3129, auth: 'bob:alice' } })

function doIt () {
  if (countDown <= 0) {
    return
  }
  countDown = countDown - 1
  workers = workers + 1
  agents[2] = new MyAgent({ maxSockets: 4, proxy: { host: 'localhost', port: 3128 } })
  const x = agents[countDown % 3]
  https.get({ hostname: 'localhost', port: 8443 + countDown % 2, agent: x, rejectUnauthorized: false }, (resp) => {
    ports.add(resp.socket.localPort)
    resp.on('data', x => x
    )
      .on('end', () => {
        doIt()
        workers = workers - 1
      })
  }).on('error', (err) => {
    console.log('MyError: ' + err.message)
  })
}

testServer.start().then(
  () => {
    for (let i = 0; i < 50; ++i) {
      setImmediate(doIt)
    }
  }
)
let oc = countDown
setInterval(() => {
  fs.readdir('/proc/self/fd',
    (err, data) => {
      if (err) {
        return
      }
      const l = process.memoryUsage()
      l.workers = workers
      l.ReqPerSec = oc - countDown
      l.countDown = countDown
      if (data) l.fds = data.length
      l.seenPorts = Object.keys(ports).length
      Object.keys(l).forEach(k => { l[k] = (l[k] < 10000) ? l[k] : si.format(l[k]) })
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
  if (data === 's\n') {
    for (let i = 0; i < 50; ++i) {
      setImmediate(doIt)
    }
  }
})
