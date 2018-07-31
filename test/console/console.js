'use strict'
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const {expect} = require('code')
const wait = require('../lib/wait')
const logger = require('../../lib/index').default

let logs = []
logger.events.on('logged', function (logEvent) {
  // console.log('Hit event', logEvent)
  logs.push(logEvent)
})

const lastLog = () => {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      if (logs.length > 0) {
        resolve(logs[logs.length - 1])
      }
      reject(new Error('No logs found'))
    }, 100)
  })
}

lab.experiment('Test logger', () => {
  lab.afterEach(() => {
    logs = []
  })

  lab.test('Logging level info', async () => {
    logger.info('Info level logging')
    const result = await lastLog()
    expect(result.level).to.equal('info')
    expect(result.message).to.equal('Info level logging')
  })

  lab.test('Logging level warning', async () => {
    logger.warn('Warning level logging')
    const result = await lastLog()
    expect(result.level).to.equal('warn')
    expect(result.message).to.equal('Warning level logging')
  })

  lab.test('Logging level error', async () => {
    logger.error('Error level logging')
    const result = await lastLog()

    expect(result.level).to.equal('error')
    expect(result.message).to.equal('Error level logging')
  })
  lab.test('Logging profiler', async () => {
    const profileMsg = 'Profiler execution:'
    logger.profile(profileMsg)
    await wait.for(100)
    expect(logger.profile(profileMsg)).to.be.true()
  })
})
