/* eslint-env node, mocha */
require('should')
let testserver = require('../testserver')
let https = require('https')
let MyAgent = require('..')

describe('proxy agent', function () {
  before(function () {
    return testserver.start()
  })
  beforeEach(function () {
    delete process.env.https_proxy
    delete process.env.HTTPS_PROXY
  })
  after(function () {
    testserver.stop()
  })
  describe('agent', function () {
    it('should default keepAlive', function (cb) {
      let agent = new MyAgent()
      agent.options.keepAlive.should.equal(true)
      agent.destroy()
      cb()
    })
    it('should not overwrite keepAlive', function (cb) {
      let agent = new MyAgent({keepAlive: false})
      agent.options.keepAlive.should.equal(false)
      agent.destroy()
      cb()
    })
  })
  describe('when using process.env', function () {
    it('succeeds on env https_proxy', function (cb) {
      process.env.https_proxy = 'http://localhost:3128'
      let agent = new MyAgent()
      let options = {hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false}
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          agent.destroy()
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
    it('succeeds on env HTTPS_PROXY', function (cb) {
      process.env.HTTPS_PROXY = 'http://localhost:3128'
      let agent = new MyAgent()
      let options = {hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false}
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          agent.destroy()
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
    it('also work with no proxy setting', function (cb) {
      let agent = new MyAgent()
      let options = {hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false}
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          agent.destroy()
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
  })
  describe('when using no authentication', function () {
    it('succeeds on good request', function (cb) {
      let agent = new MyAgent({proxy: {hostname: 'localhost', port: 3128}})
      let options = {hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false}
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          agent.destroy()
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
    it('throws error on bad target port', function (cb) {
      let agent = new MyAgent({proxy: {hostname: 'localhost', port: 3128}})
      let options = {hostname: 'localhost', port: 8445, agent: agent, rejectUnauthorized: false}

      https.get(options).on('error', e => {
        agent.destroy()
        e.message.should.be.equal('HTTP/1.1 500')
        cb()
      })
    })

    it('automatically uses port 443 ', function (cb) {
      let agent = new MyAgent({proxy: {hostname: 'localhost', port: 3128}})
      let options = {hostname: 'localhost', agent: agent, rejectUnauthorized: false}
      // no one should be listening on 443
      https.get(options).on('error', e => {
        agent.destroy()
        e.message.should.be.oneOf('HTTP/1.1 500', 'socket hang up')
        cb()
      })
    })
    it('throws error on bad proxy port', function (cb) {
      let agent = new MyAgent({proxy: {hostname: 'localhost', port: 3130}})
      let options = {hostname: 'localhost', agent: agent, rejectUnauthorized: false}
      // no one should be listening on 443
      https.get(options).on('error', e => {
        agent.destroy()
        e.message.should.be.equal('connect ECONNREFUSED 127.0.0.1:3130')
        cb()
      })
    })
  })
  describe('when using authentication', function () {
    it('succeeds on good auth', function (cb) {
      let agent = new MyAgent({proxy: {hostname: 'localhost', port: 3129, auth: 'bob:alice'}})
      let options = {hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false}
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          agent.destroy()
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
    it('throws error on bad auth', function (cb) {
      let agent = new MyAgent({proxy: {hostname: 'localhost', port: 3129, auth: 'bo2b:alice'}})
      let options = {hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false}

      https.get(options).on('error', e => {
        agent.destroy()
        e.message.should.be.equal('HTTP/1.1 407')
        cb()
      })
    })
  })
})
