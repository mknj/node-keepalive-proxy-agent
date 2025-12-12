import https from 'https'
import net from 'net'
import url from 'url'

class myAgent extends https.Agent {
  constructor (options) {
    options = options || {}
    if (options.proxy === undefined) {
      let u = null
      if (typeof options === 'string') {
        u = new url.URL(options)
        options = {}
      } else if (options.hostname !== undefined) {
        u = {
          hostname: options.hostname,
          port: (options.port === undefined ? '' : options.port)
        }
        options = {}
      } else {
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
  }

  createConnectionHttpsAfterHttp (options, cb) {
    let response = ''
    let callbackCalled = false

    const safeCallback = (err, socket) => {
      if (callbackCalled) return
      callbackCalled = true
      cb(err, socket)
    }

    const handleProxyResponse = (hasCompleteHeaders) => {
      proxySocket.removeListener('error', errorListener)
      proxySocket.removeListener('end', endListener)
      proxySocket.removeListener('data', dataListener)

      const m = response.match(/^HTTP\/1.\d (\d*)/)

      // Check for valid HTTP status line with status code
      if (m == null || m[1] == null) {
        // No valid HTTP/1.x status code found
        if (hasCompleteHeaders) {
          // Have complete headers but not HTTP/1.x (e.g., HTTP/0.0)
          const error = new Error(response.trim())
          error.code = 'ERR_HTTP_PROXY_CONNECT'
          proxySocket.destroy()
          safeCallback(error)
        } else if (m && m[0]) {
          // Got partial HTTP line (e.g., "HTTP/1.1" without status code)
          const error = new Error(m[0])
          error.code = 'ERR_HTTP_PROXY_CONNECT'
          proxySocket.destroy()
          safeCallback(error)
        } else {
          // Connection closed with no valid response
          const error = new Error("'end'")
          error.code = 'ERR_HTTP_PROXY_CONNECT'
          proxySocket.destroy()
          safeCallback(error)
        }
        return
      }

      // Have valid HTTP/1.x status line with code
      if (m[1] !== '200') {
        const error = new Error(m[0])
        error.code = 'ERR_HTTP_PROXY_CONNECT'
        proxySocket.destroy()
        safeCallback(error)
        return
      }

      // Success - got 200 OK
      options.socket = proxySocket
      safeCallback(null, super.createConnection(options))
    }

    const proxySocket = net.connect(+options.proxy.port, options.proxy.hostname || options.proxy.host)

    const errorListener = (error) => {
      proxySocket.destroy()
      // Handle AggregateError from dual-stack connection attempts in newer Node.js
      if (error.code === 'ECONNREFUSED' && error.errors && error.errors.length > 0) {
        safeCallback(error.errors[error.errors.length - 1])
      } else {
        safeCallback(error)
      }
    }

    const endListener = () => {
      handleProxyResponse(false)
    }

    const dataListener = (data) => {
      response += data.toString()
      if (response.endsWith('\r\n\r\n')) {
        handleProxyResponse(true)
      }
    }

    proxySocket.once('error', errorListener)
    proxySocket.once('end', endListener)
    proxySocket.on('data', dataListener)

    proxySocket.once('connect', () => {
      let host = options.hostname
      if (!host) host = options.host
      let cmd = 'CONNECT ' + host + ':' + options.port + ' HTTP/1.1\r\n'
      cmd += `Host: ${host}:${options.port}\r\n`
      if (options.proxy.auth) {
        // noinspection JSCheckFunctionSignatures
        const auth = Buffer.from(options.proxy.auth).toString('base64')
        cmd += 'Proxy-Authorization: Basic ' + auth + '\r\n'
      }
      cmd += '\r\n'
      proxySocket.write(cmd)
    })
  }

  createConnection (options, cb) {
    if (options.proxy) {
      this.createConnectionHttpsAfterHttp(options, cb)
    } else {
      cb(null, super.createConnection(options))
    }
  }
}

export default myAgent
