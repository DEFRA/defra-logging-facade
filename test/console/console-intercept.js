'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const { logger } = require('../../lib/index')
logger.interceptConsole()
const LogMonitor = require('../lib/LogMonitor')
const monitor = new LogMonitor(logger)

lab.experiment('Test console intercept', () => {
  lab.test('works for log method', async () => {
    console.log('Log method')
    const result = await monitor.lastLog()
    expect(result.level).to.equal('info')
    expect(result.message).to.equal('Log method')
  })

  lab.test('works for info method', async () => {
    console.info('Info level logging')
    const result = await monitor.lastLog()
    expect(result.level).to.equal('info')
    expect(result.message).to.equal('Info level logging')
  })

  lab.test('works for warn method', async () => {
    console.warn('Warning level logging')
    const result = await monitor.lastLog()
    expect(result.level).to.equal('warn')
    expect(result.message).to.equal('Warning level logging')
  })

  lab.test('works for error message', async () => {
    console.error('Error level logging')
    const result = await monitor.lastLog()

    expect(result.level).to.equal('error')
    expect(result.message).to.equal('Error level logging')
  })
})
