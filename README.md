# node-keepalive-proxy-agent

[![Greenkeeper badge](https://badges.greenkeeper.io/mknj/node-keepalive-proxy-agent.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/mknj/node-keepalive-proxy-agent.svg?branch=master)](https://travis-ci.org/mknj/node-keepalive-proxy-agent)
[![codecov](https://codecov.io/gh/mknj/node-keepalive-proxy-agent/branch/master/graph/badge.svg)](https://codecov.io/gh/mknj/node-keepalive-proxy-agent)

proxy agent that honors keepalive

# examples

## using https_proxy
``` javascript
let https = require('https')

let Agent = require('keepalive-proxy-agent')

let agent = new Agent ()

let options = {hostname: 'google.de', port: 443, agent: agent, rejectUnauthorized: false}

https.get(options, (resp) => resp.pipe(process.stdout))

```

## using provided proxy
``` javascript
let https = require('https')

let Agent = require('keepalive-proxy-agent')

let agent = new Agent ({proxy:{hostname:"MYPROXYHOST",port:3128}})

let options = {hostname: 'google.de', port: 443, agent: agent, rejectUnauthorized: false}

https.get(options, (resp) => resp.pipe(process.stdout))

```


# others 
- https://www.npmjs.com/package/https-agent
- https://www.npmjs.com/package/proxying-agent
- https://www.npmjs.com/package/tunnel
- https://www.npmjs.com/package/persistent-tunnel
- https://www.npmjs.com/package/tunnel-agent
