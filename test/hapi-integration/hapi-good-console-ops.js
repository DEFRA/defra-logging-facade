'use strict'
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const { expect } = require('code')
const { Logger } = require('../../lib/index')
const LogMonitor = require('../lib/LogMonitor')

const logger = new Logger({
  level: 'debug'
})

const monitor = new LogMonitor(logger)
const TestAppServer = require('../lib/TestAppServer')
const wait = require('../lib/wait')
let appServer = null

lab.experiment('Test hapi good console logging (ops only)', { timeout: 30000 }, () => {
  lab.before(async () => {
    appServer = new TestAppServer({
      plugins: [
        {
          plugin: require('good'),
          options: {
            ops: {
              interval: 1000
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

  lab.test('logs ops to console', { timeout: 30000 }, async () => {
    monitor.reset()
    await wait.for(3500)
    const logs = await monitor.all()
    expect(logs.length).to.be.above(2)
  })

  lab.after(async () => {
    await appServer.stop()
  })
})
