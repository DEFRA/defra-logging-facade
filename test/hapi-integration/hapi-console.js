'use strict'
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const {expect} = require('code')
const Logger = require('../../lib/index')
const LogMonitor = require('../lib/LogMonitor')
const monitor = new LogMonitor(Logger.default)
const TestAppServer = require('../lib/TestAppServer')
let appServer = null

lab.experiment('Test hapi console logging', {timeout: 30000}, () => {
  lab.before(async () => {
    delete process.env.AIRBRAKE_HOST
    delete process.env.AIRBRAKE_PROJECT_KEY
    appServer = new TestAppServer()
    await appServer.start()
  })

  lab.test('logs ops to console', async () => {
    await appServer.inject({url: `http://localhost:${appServer.getPort()}/broken?withTestParameter=true`})
    const result = await monitor.lastLog()
    expect(result.level).to.equal('error')
    expect(result.message).to.include('Error: Broken')
  })

  lab.after(async () => {
    await appServer.stop()
  })
})
