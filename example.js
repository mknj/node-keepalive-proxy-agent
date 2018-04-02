let https = require('https')

let myAgent = require('.')

let agent = new myAgent({proxy: {hostname: 'localhost', port: 3129,auth:"bob:alice"}})

let options = {hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false}

https.get(options, (resp) => resp.pipe(process.stdout))
