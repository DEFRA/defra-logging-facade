'use strict'
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const {expect} = require('code')
const {logger} = require('../../lib/index')
const LogMonitor = require('../lib/LogMonitor')
const monitor = new LogMonitor(logger)
const TestAppServer = require('../lib/TestAppServer')
let appServer = null

function testResponseLog (path, params, statusCode, method = 'get') {
  return new RegExp(`\\[response].*${method}.*${path} ${params}.*${statusCode}`)
}

lab.experiment('Test hapi good console logging', {timeout: 30000}, () => {
  lab.before(async () => {
    delete process.env.AIRBRAKE_HOST
    delete process.env.AIRBRAKE_PROJECT_KEY
    appServer = new TestAppServer({
      plugins: [
        {
          plugin: require('good'),
          options: {
            ops: {
              interval: 2147483647
            },
            reporters: {
              testReporter: [
                logger
              ]
            }
          }
        }
      ]
    })
    await appServer.start()
  })

  lab.test('logs errors to console', async () => {
    monitor.reset()
    await appServer.inject({url: `http://localhost:${appServer.getPort()}/broken?withTestParameter=true`})
    const logs = await monitor.all()
    expect(logs.length).to.equal(2)

    for (let log of logs) {
      if (log.level === 'error') {
        expect(log.message).to.include('Error: Broken')
      } else {
        expect(log.message).to.match(testResponseLog('/broken', '{ withTestParameter: \'true\' }', 500))
      }
    }
  })

  lab.test('logs responses to console', async () => {
    monitor.reset()
    await appServer.inject({url: `http://localhost:${appServer.getPort()}/ping/404`})
    let logs = await monitor.all()
    expect(logs.length).to.equal(1)
    expect(logs[0].message).to.match(testResponseLog('/ping/404', '{}', 404))

    monitor.reset()
    await appServer.inject({url: `http://localhost:${appServer.getPort()}/ping/302`, method: 'post'})
    logs = await monitor.all()
    expect(logs.length).to.equal(1)
    expect(logs[0].message).to.match(testResponseLog('/ping/302', '{}', 302, 'post'))

    monitor.reset()
    await appServer.inject({url: `http://localhost:${appServer.getPort()}/ping/201`, method: 'put'})
    logs = await monitor.all()
    expect(logs.length).to.equal(1)
    expect(logs[0].message).to.match(testResponseLog('/ping/201', '{}', 201, 'put'))

    monitor.reset()
    await appServer.inject({url: `http://localhost:${appServer.getPort()}/ping/200`, method: 'patch'})
    logs = await monitor.all()
    expect(logs.length).to.equal(1)
    expect(logs[0].message).to.match(testResponseLog('/ping/200', '{}', 200, 'patch'))
  })

  lab.test('intercepts the request.log() method', async () => {
    monitor.reset()
    await appServer.inject({url: `http://localhost:${appServer.getPort()}/fireRequestErrorLog`})
    let logs = await monitor.all()
    expect(logs.length).to.equal(2)
    expect(logs[0].message).to.include('Error: Testing error handling!')
    expect(logs[1].message).to.match(testResponseLog('/fireRequestErrorLog', '{}', 200))
  })

  lab.test('intercepts the server.log() method', async () => {
    monitor.reset()
    await appServer.inject({url: `http://localhost:${appServer.getPort()}/fireServerLog`})
    let logs = await monitor.all()
    expect(logs.length).to.equal(2)
    expect(logs[0].message).to.include('Something happened')
    expect(logs[0].level).to.equal('info')
    expect(logs[1].message).to.match(testResponseLog('/fireServerLog', '{}', 200))
  })

  lab.test('intercepts the server.log() method for errors', async () => {
    monitor.reset()
    await appServer.inject({url: `http://localhost:${appServer.getPort()}/fireServerErrorLog`})
    let logs = await monitor.all()
    expect(logs.length).to.equal(2)
    expect(logs[0].message).to.include('Error: Testing error handling!')
    expect(logs[0].level).to.equal('error')
    expect(logs[1].message).to.match(testResponseLog('/fireServerErrorLog', '{}', 200))
  })

  lab.after(async () => {
    await appServer.stop()
  })
})
