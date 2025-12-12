import https from 'https'
import http from 'http'
import pem from 'pem'
import { createProxy } from 'proxy'

export function startServer (PORT) {
  return new Promise((resolve, reject) => {
    pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
      if (err) {
        reject(err)
      }
      const server = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, function (req, res) {
        res.end(':' + req.url + ':')
      }).listen(PORT)
      resolve(server)
    })
  })
}

function startProxy (PORT, auth) {
  const server = http.createServer()
  const p = createProxy(server)
  if (auth) {
    p.authenticate = function (req) {
      return req.headers['proxy-authorization'] === 'Basic Ym9iOmFsaWNl' // user bob password alice
    }
  }
  // noinspection JSUnresolvedFunction
  server.listen(PORT)
  return server
}

const servers = []

export async function start () {
  servers.push(await startServer(8443))
  servers.push(await startServer(8444))
  servers.push(startProxy(3128))
  servers.push(startProxy(3129, true))
}

export async function stop () {
  servers[0].close()
  servers[1].close()
  servers[2].close()
  servers[3].close()
}

/*
if (require.main === module) {
  start()
  console.log(`
Server1 listening on https://localhost:8443
Server2 listening on https://localhost:8444
Proxy1 listening on http://localhost:3128
Proxy2 listening on http://localhost:3129 Authentication "bob:alice"

Get https://localhost:8443/quit to exit process

curl -k https://localhost:8443
curl -k https://localhost:8444
curl -k --proxy localhost:3128 https://localhost:8443
curl -k --proxy-basic --proxy-user bob:alice --proxy localhost:3129 https://localhost:8443
curl -k --proxy-basic --proxy-user WRONG:PASSWORD --proxy localhost:3129 https://localhost:8443

`)
}
*/
