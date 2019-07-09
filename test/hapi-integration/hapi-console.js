'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const { logger, HapiErrorLoggerPlugin } = require('../../lib/index')
const LogMonitor = require('../lib/LogMonitor')
const monitor = new LogMonitor(logger)
const TestAppServer = require('../lib/TestAppServer')
let appServer = null

lab.experiment('Test hapi plugin', { timeout: 30000 }, () => {
  lab.before(async () => {
    delete process.env.AIRBRAKE_HOST
    delete process.env.AIRBRAKE_PROJECT_KEY
    appServer = new TestAppServer({ plugins: [HapiErrorLoggerPlugin] })
    await appServer.start()
  })

  lab.test('errors are logged to console', async () => {
    monitor.reset()
    await appServer.inject({ url: `http://localhost:${appServer.getPort()}/broken?withTestParameter=true` })
    const result = await monitor.lastLog()
    expect(result.level).to.equal('error')
    expect(result.message).to.include('Error: Broken')
  })

  lab.test('intercepts the request.log() method', async () => {
    monitor.reset()
    await appServer.inject({ url: `http://localhost:${appServer.getPort()}/fireRequestLog` })
    let log = await monitor.lastLog()
    expect(log.level).to.equal('info')
    expect(log.message).to.include('A simple request log item')
  })

  lab.test('intercepts the request.log() method for Error objects', async () => {
    monitor.reset()
    await appServer.inject({ url: `http://localhost:${appServer.getPort()}/fireRequestErrorLog` })
    let log = await monitor.lastLog()
    expect(log.level).to.equal('error')
    expect(log.message).to.include('Error: Testing error handling!')
  })

  lab.test('intercepts the server.log() method', async () => {
    monitor.reset()
    await appServer.inject({ url: `http://localhost:${appServer.getPort()}/fireServerLog` })
    let log = await monitor.lastLog()
    expect(log.level).to.equal('info')
    expect(log.message).to.include('Something happened')
  })
  lab.test('intercepts the server.log() method for errors', async () => {
    monitor.reset()
    await appServer.inject({ url: `http://localhost:${appServer.getPort()}/fireServerErrorLog` })
    let log = await monitor.lastLog()
    expect(log.level).to.equal('error')
    expect(log.message).to.include('Error: Testing error handling!')
  })

  lab.after(async () => {
    await appServer.stop()
  })
})
