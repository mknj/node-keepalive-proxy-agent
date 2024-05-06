const https = require('https')
const net = require('net')
const url = require('url')

class myAgent extends https.Agent {
  constructor (options) {
    options = options || {}
    if (options.proxy === undefined) {
      let u = null
      if ( typeof options === 'string') {
        u = new url.URL(options)
        options = {};
      }
      else if ( options.hostname !== undefined ) {
        u = { hostname: options.hostname, 
              port: (options.port === undefined ? '':options.port)}
        options = {};
      }
      else {
        if (process.env.HTTPS_PROXY !== undefined) {
          u = new url.URL(process.env.HTTPS_PROXY)
        }
        if (process.env.https_proxy !== undefined) {
          u = new url.URL(process.env.https_proxy)
        }
      }
      if (u) {
        options.proxy = { hostname: u.hostname, port: u.port }
      }
    }
    if (options.keepAlive === undefined) {
      options.keepAlive = true
    }
    super(options)
    if (options.timeout) this._timeout = options.timeout
  }

  createConnectionHttpsAfterHttp (options, cb) {
    const proxySocket = net.connect(+options.proxy.port, options.proxy.hostname || options.proxy.host)
    const errorListener = (error) => {
      proxySocket.destroy()
      cb(error)
    }
    const endListener = () => {
      const error = new Error("'end'")
      error.code = "ERR_HTTP_PROXY_CONNECT"
      cb(error)
    }
    proxySocket.once('error', errorListener)
    proxySocket.once('end',endListener)

    if (this._timeout) {
			proxySocket.setTimeout(this._timeout);

			proxySocket.on('timeout', () => {
				proxySocket.end();
			});
		}

    let response = ''
    const dataListener = (data) => {
      response += data.toString()
      if (!response.endsWith('\r\n\r\n')) {
        // response not completed yet
        return
      }
      proxySocket.removeListener('error', errorListener)
      proxySocket.removeListener('end', endListener)
      proxySocket.removeListener('data', dataListener)

      const m = response.match(/^HTTP\/1.\d (\d*)/)
      if (m == null || m[1] == null) {
        const error = new Error(response.trim());
        error.code = "ERR_HTTP_PROXY_CONNECT"
        proxySocket.destroy()
        return cb(error)
      } else if (m[1] !== '200') {
        const error= new Error(m[0])
        error.code = "ERR_HTTP_PROXY_CONNECT"
        proxySocket.destroy()
        return cb(error)
      }
      options.socket = proxySocket // tell super function to use our proxy socket,
      cb(null, super.createConnection(options))
    }
    proxySocket.on('data', dataListener)

    let host = options.hostname
    if (!host) host = options.host
    let cmd = 'CONNECT ' + host + ':' + options.port + ' HTTP/1.1\r\n'
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
