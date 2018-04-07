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
      if (u) {
        options.proxy = {hostname: u.hostname, port: u.port}
      }
    }
    if (options.keepAlive === undefined) {
      options.keepAlive = true
    }
    super(options)
  }

  createConnectionHttpsAfterHttp (options, cb) {
    let proxySocket = net.connect(options.proxy)
    let errorListener = (error) => {
      proxySocket.destroy()
      cb(error)
    }
    proxySocket.once('error', errorListener)
    proxySocket.once('data', (data) => {
      proxySocket.removeListener('error', errorListener)
      const m = data.toString().match(/^HTTP\/1.1 (\d*)/)
      if (m[1] !== '200') {
        proxySocket.destroy()
        return cb(new Error(m[0]))
      }
      options.socket = proxySocket // tell super function to use our proxy socket,
      cb(null, super.createConnection(options))
    })
    let cmd = 'CONNECT ' + options.hostname + ':' + options.port + ' HTTP/1.1\r\n'
    if (options.proxy.auth) {
      // noinspection JSCheckFunctionSignatures
      let auth = Buffer.from(options.proxy.auth).toString('base64')
      cmd += 'Proxy-Authorization: Basic ' + auth + '\r\n'
    }
    cmd += '\r\n'
    proxySocket.write(cmd)
  }

  createConnection (options, cb) {
    if (options.proxy) {
      this.createConnectionHttpsAfterHttp(options, cb)
    } else {
      cb(null, super.createConnection(options))
    }
  }
}

module.exports = myAgent
