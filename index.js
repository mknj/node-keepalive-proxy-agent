const https = require('https')
const net = require('net')
const url = require('url')

class myAgent extends https.Agent {
  constructor (options) {
    options = options || {}
    if (options.proxy === undefined) {
      let u = null
      if (process.env.HTTPS_PROXY !== undefined) {
        u = url.parse(process.env.HTTPS_PROXY)
      }
      if (process.env.https_proxy !== undefined) {
        u = url.parse(process.env.https_proxy)
      }
      if(u)
      {
        options.proxy = {hostname: u.hostname, port: u.port}
      }
    }
    if (options.keepAlive === undefined) {
      options.keepAlive = true
    }
    super(options)
  }

  createConnectionHttpsAfterHttp (options, cb) {
    let psocket = net.connect(options.proxy)
    let errorListener = (error) => {
      psocket.destroy()
      cb(error)
    }
    psocket.once('error', errorListener)
    psocket.once('data', (data) => {
      psocket.removeListener('error', errorListener)
      const m = data.toString().match(/^HTTP\/1.1 (\d*)/)
      if (m[1] !== '200') {
        psocket.destroy()
        return cb(new Error(m[0]))
      }
      options.socket = psocket // tell super function to use our proxy socket,
      cb(null, super.createConnection(options))
    })
    let cmd = 'CONNECT ' + options.hostname + ':' + options.port + ' HTTP/1.1\r\n'
    if (options.proxy.auth) {
      cmd += 'Proxy-Authorization: Basic ' + (Buffer.from(options.proxy.auth).toString('base64')) + '\r\n'
    }
    cmd += '\r\n'
    psocket.write(cmd)
  }

  createConnection (options, cb) {
    if (options.proxy) {
      this.createConnectionHttpsAfterHttp(options, cb)
    }
    else {
      cb(null,super.createConnection(options))
    }
  }
}

// TODO bug? keepAlive: false, maxSockets:1 -> only one connection is made
// TODO compare to other tunnels
// TODO clarify limitations (currently no auth, only HTTP+HTTPS..)
// TODO once('data' can fail if proxy server sends answer in two packets
// TODO test with squid

module.exports = myAgent
