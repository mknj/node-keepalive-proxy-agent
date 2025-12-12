/* eslint-env node, mocha, should */
import 'should'
import * as testServer from '../testserver.js'
import pem from 'pem'

describe('testServer ', function () {
  it('start() throws on pem error', function () {
    const old = pem.createCertificate
    // MOCK MOCK MOCK
    pem.createCertificate = function (a, cb2) { cb2(new Error('HACK')) }
    // noinspection JSValidateTypes
    return testServer.start().should.be.rejected().then(() => { pem.createCertificate = old })
  })
})
