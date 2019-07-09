'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const wait = require('../lib/wait')
const FakeAirbrake = require('../lib/FakeAirbrake')
const fakeAirbrakeServer = new FakeAirbrake()
const Logger = require('../../lib/index')

lab.experiment('Customised logger configurations', { timeout: 30000 }, () => {
  /**
   * Before running tests, create a mock airbrake server and a mock application server which has the plugin set up
   */
  lab.before(async () => {
    process.env.AIRBRAKE_HOST = `http://localhost:${fakeAirbrakeServer.getPort()}`
    process.env.AIRBRAKE_PROJECT_KEY = '1234567890'
    process.env.AIRBRAKE_LOG_LEVEL = 'error'
    process.env.NODE_ENV = 'Unit test fake app server'
    await fakeAirbrakeServer.start()
  })

  lab.test('logs to airbrake by default', async () => {
    let payload = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (payload = request.payload))
    let logger = new Logger({
      level: 'error'
    })
    logger.error('Test error')
    await wait.until(() => {
      return payload !== null
    })
    expect(payload.errors[0].message).to.equal('Test error')
  })

  lab.test('does not log to airbrake if appender not configured', async () => {
    let payload = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (payload = request.payload))
    let logger = new Logger({
      level: 'error',
      activeTransports: ['console']
    })
    logger.error('Test error is not sent to airbrake')
    await wait.for(1000)
    expect(payload).to.be.null()
  })

  lab.test('ignores unknown appenders without erroring', async () => {
    let payload = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (payload = request.payload))
    let logger = new Logger({
      level: 'error',
      activeTransports: ['console', 'unknown', 'something-else']
    })
    logger.error('Test error is not sent to airbrake')
    await wait.for(1000)
    expect(payload).to.be.null()
  })

  lab.after(async () => {
    await fakeAirbrakeServer.stop()
  })
})
