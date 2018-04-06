/* eslint-env node, mocha, should */
require('should')
let testserver = require('../testserver')
const pem = require('pem')

describe('testsserver ', function () {
  it('start() throws on pem error', function () {
    let old = pem.createCertificate
    // MOCK MOCK MOCK
    pem.createCertificate = function (a, cb2) { cb2(new Error('HACK')) }
    return testserver.start().should.be.rejected().then(() => { pem.createCertificate = old })
  })
})
