const https = require('https')
const net = require('net')
const url = require('url')

class myAgent extends https.Agent {
  constructor (options) {
    options = options || {}
    if (options.proxy === undefined) {
      let u = null
      if (process.env.HTTPS_PROXY !== undefined) {
        u = new url.URL(process.env.HTTPS_PROXY)
      }
      if (process.env.https_proxy !== undefined) {
        u = new url.URL(process.env.https_proxy)
      }
      if (u) {
        options.proxy = { hostname: u.hostname, port: u.port }
      }
    }
    if (options.keepAlive === undefined) {
      options.keepAlive = true
    }
    super(options)
  }

  createConnectionHttpsAfterHttp (options, cb) {
    const proxySocket = net.connect(options.proxy)
    const errorListener = (error) => {
      proxySocket.destroy()
      cb(error)
    }
    proxySocket.once('error', errorListener)

    let response = ''
    const dataListener = (data) => {
      response += data.toString()
      if (!response.endsWith('\r\n\r\n')) {
        // response not completed yet
        return
      }
      proxySocket.removeListener('error', errorListener)
      proxySocket.removeListener('data', dataListener)

      const m = response.match(/^HTTP\/1.1 (\d*)/)
      if (m == null || m[1] == null) {
        proxySocket.destroy()
        return cb(new Error(response.trim()))
      } else if (m[1] !== '200') {
        proxySocket.destroy()
        return cb(new Error(m[0]))
      }
      options.socket = proxySocket // tell super function to use our proxy socket,
      cb(null, super.createConnection(options))
    }
    proxySocket.on('data', dataListener)

    let cmd = 'CONNECT ' + options.hostname + ':' + options.port + ' HTTP/1.1\r\n'
    if (options.proxy.auth) {
      // noinspection JSCheckFunctionSignatures
      const auth = Buffer.from(options.proxy.auth).toString('base64')
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
