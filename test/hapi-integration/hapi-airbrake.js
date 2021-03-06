'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const wait = require('../lib/wait')
const FakeAirbrake = require('../lib/FakeAirbrake')
const fakeAirbrakeServer = new FakeAirbrake()
const TestAppServer = require('../lib/TestAppServer')
const request = require('request')
const { Logger, HapiErrorLoggerPlugin } = require('../../lib/index')
let appServer = null

lab.experiment('Test hapi airbrake integration', { timeout: 30000 }, () => {
  /**
   * Before running tests, create a mock airbrake server and a mock application server which has the plugin set up
   */
  lab.before(async () => {
    console.log('Initialising test servers.')
    process.env.AIRBRAKE_HOST = `http://localhost:${fakeAirbrakeServer.getPort()}`
    process.env.AIRBRAKE_PROJECT_KEY = '1234567890'
    process.env.AIRBRAKE_LOG_LEVEL = 'error'
    process.env.NODE_ENV = 'Unit test fake app server'
    appServer = new TestAppServer({
      plugins: [
        {
          plugin: HapiErrorLoggerPlugin,
          options: {
            logger: new Logger()
          }
        }
      ]
    })
    await fakeAirbrakeServer.start()
    await appServer.start()
  })

  lab.test('handles an exception thrown by a server route handler', async () => {
    let payload = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (payload = request.payload))

    await appServer.inject({ url: `http://localhost:${appServer.getPort()}/broken?withTestParameter=true` })
    await wait.until(() => {
      return payload !== null
    })
    expect(payload.errors[0].message).to.equal('NOT AN ERROR - JUST TESTING')
    expect(payload.params.withTestParameter).to.equal('true')
    expect(payload.context.action).to.equal('GET /broken?withTestParameter=true')
    expect(payload.context.severity).to.equal('error')
    expect(payload.context.userAgent).to.equal('shot')
  })

  lab.test('No notification on client error', async () => {
    let payload = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (payload = request.payload))
    await appServer.inject({ url: `http://localhost:${appServer.getPort()}/something/that/doesnt/exist` })
    await wait.for(1000)
    expect(payload).to.be.null()
  })

  lab.test('No notification on client abort', async () => {
    return new Promise(function (resolve, reject) {
      let payload = null
      fakeAirbrakeServer.useDefaultResponse()
      fakeAirbrakeServer.setNotificationHandler((request) => (payload = request.payload))
      request({
        url: `http://localhost:${appServer.getPort()}/timeout/10000`,
        timeout: 1000
      }, async function (error, response, body) {
        expect(response).to.be.undefined()
        expect(body).to.be.undefined()
        expect(error).to.be.an.error()
        await wait.for(1000)
        expect(payload).to.be.null()
        resolve()
      })
    })
  })

  lab.test('No notification on success', async () => {
    let payload = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (payload = request.payload))
    await appServer.inject({ url: `http://localhost:${appServer.getPort()}/ping/200` })
    await wait.for(1000)
    expect(payload).to.be.null()
  })

  lab.test('Adds notify server method', async () => {
    let payload = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (payload = request.payload))

    expect(appServer.methods.notify).to.be.a.function()

    const error = new Error('test error')
    error.params = {
      param1: 'test-param'
    }
    error.context = {
      action: `POST /something`,
      userAgent: 'TEST-AGENT'
    }
    error.environment = {
      TEST: 'var'
    }
    error.session = {
      sessionParam: 'session-val'
    }

    appServer.methods.notify(error)
    await wait.until(() => {
      return payload !== null
    })
    expect(payload.errors.length).to.equal(1)
    expect(payload.errors[0].message).to.equal('test error')
    expect(payload.context.severity).to.equal('error')
    expect(payload.context.userAgent).to.equal('TEST-AGENT')
    expect(payload.params.param1).to.equal('test-param')
    expect(payload.environment.TEST).to.equal('var')
    expect(payload.session.sessionParam).to.equal('session-val')
    expect(payload.context.userAgent).to.equal('TEST-AGENT')
  })

  lab.test('behaves when airbrake not notifiable', async () => {
    let payload = null
    fakeAirbrakeServer.useErrorResponse(500)
    fakeAirbrakeServer.setNotificationHandler((request) => (payload = request.payload))

    await appServer.inject({ url: `http://localhost:${appServer.getPort()}/broken` })
    await wait.until(() => {
      return payload !== null
    })
    expect(payload.errors[0].message).to.equal('NOT AN ERROR - JUST TESTING')
    expect(payload.context.action).to.equal('GET /broken')
    expect(payload.context.severity).to.equal('error')
    expect(payload.context.userAgent).to.equal('shot')
  })

  lab.test('filters repeated errors', async () => {
    let callCount = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler(() => {
      callCount != null ? callCount++ : callCount = 1
    })
    for (let i = 0; i < 200; i++) {
      await appServer.inject({ url: `http://localhost:${appServer.getPort()}/broken` })
    }
    await wait.until(() => {
      return callCount !== null
    })
    expect(callCount).to.equal(1)
  })

  lab.after(async () => {
    console.log('Shutting down test servers.')
    await appServer.stop()
    await fakeAirbrakeServer.stop()
  })
})
