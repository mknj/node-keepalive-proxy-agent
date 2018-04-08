# node-keepalive-proxy-agent

[![Join the chat at https://gitter.im/node-keepalive-proxy-agent/Lobby](https://badges.gitter.im/node-keepalive-proxy-agent/Lobby.svg)](https://gitter.im/node-keepalive-proxy-agent/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/mknj/node-keepalive-proxy-agent.svg?branch=master)](https://travis-ci.org/mknj/node-keepalive-proxy-agent)
[![codecov](https://codecov.io/gh/mknj/node-keepalive-proxy-agent/branch/master/graph/badge.svg)](https://codecov.io/gh/mknj/node-keepalive-proxy-agent)
[![npm](https://img.shields.io/npm/dw/keepalive-proxy-agent.svg)](https://www.npmjs.com/package/keepalive-proxy-agent)
![npm](https://img.shields.io/npm/l/express.svg)
[![Greenkeeper badge](https://badges.greenkeeper.io/mknj/node-keepalive-proxy-agent.svg)](https://greenkeeper.io/)
[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

# features

- working keepalive
- option to allow self-signed servers
- basic auth for proxy authentication
- 60 lines of code (100% code coverage)

# installation

```
npm install keepalive-proxy-agent
```

# examples

## using the https_proxy or HTTP_PROXY environment variables

``` javascript
let https = require('https')
let Agent = require('keepalive-proxy-agent')
let agent = new Agent ()
let options = {hostname: 'google.de', port: 443, agent: agent}
https.get(options, (resp) => resp.pipe(process.stdout))

```

## using provided proxy
``` javascript
...
let agent = new Agent ({proxy:{hostname:"MYPROXYHOST",port:3128}})
...

```

## connect to self-signed-server over proxy

``` javascript
...
let options = {hostname: 'google.de', port: 443, agent: agent, rejectUnauthorized: false}
...
```

## allow proxy authentication

``` javascript
...
let agent = new Agent ({proxy:{hostname:"MYPROXYHOST",port:3128, auth:"USER:PASS"}})
...
```

# caveat
- use hostname+port, not host+port, see https://nodejs.org/api/url.html#url_url_strings_and_url_objects for details
