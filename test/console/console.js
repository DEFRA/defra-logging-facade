'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const wait = require('../lib/wait')
const { logger } = require('../../lib/index')
const LogMonitor = require('../lib/LogMonitor')
const monitor = new LogMonitor(logger)

lab.experiment('Test logger', () => {
  lab.test('Logging level info', async () => {
    logger.info('Info level logging')
    const result = await monitor.lastLog()
    expect(result.level).to.equal('info')
    expect(result.message).to.equal('Info level logging')
  })

  lab.test('Logging level warning', async () => {
    logger.warn('Warning level logging')
    const result = await monitor.lastLog()
    expect(result.level).to.equal('warn')
    expect(result.message).to.equal('Warning level logging')
  })

  lab.test('Logging level error', async () => {
    logger.error('Error level logging')
    const result = await monitor.lastLog()

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
