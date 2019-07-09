'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const { logger } = require('../../lib/index')
const LogMonitor = require('../lib/LogMonitor')
const monitor = new LogMonitor(logger)

lab.experiment('Test logger', () => {
  lab.test('Test streaming simple info log', async () => {
    return new Promise((resolve) => {
      logger.write('Some data', async () => {
        const result = await monitor.lastLog()
        expect(result.level).to.equal('info')
        expect(result.message).to.equal('Some data')
        resolve()
      })
    })
  })

  lab.test('Test streaming hapi error event', async () => {
    return new Promise((resolve) => {
      let data = {
        event: 'error',
        error: new Error('Test error')
      }

      logger.write(data, async () => {
        const result = await monitor.lastLog()
        expect(result.level).to.equal('error')
        expect(result.message).to.include('Error: Test error')
        resolve()
      })
    })
  })

  lab.test('Test hapi request event', async () => {
    return new Promise((resolve) => {
      let data = {
        event: 'request',
        data: {
          title: 'Some data we want logged'
        }
      }

      logger.write(data, async () => {
        const result = await monitor.lastLog()
        expect(result.level).to.equal('info')
        expect(result.message).to.equal(' [request] data: { title: \'Some data we want logged\' }')
        resolve()
      })
    })
  })

  lab.test('Test handling of unknown hapi event', async () => {
    return new Promise((resolve) => {
      let data = {
        event: 'customEventName',
        data: {
          title: 'Some data we want logged'
        }
      }

      logger.write(data, async () => {
        const result = await monitor.lastLog()
        expect(result.level).to.equal('info')
        expect(result.message).to.equal(' [customEventName] data: { title: \'Some data we want logged\' }')
        resolve()
      })
    })
  })

  lab.test('Test handling of unknown hapi event with no data', async () => {
    return new Promise((resolve) => {
      let data = {
        event: 'customEventName'
      }

      logger.write(data, async () => {
        const result = await monitor.lastLog()
        expect(result.level).to.equal('info')
        expect(result.message).to.equal(' [customEventName] data: (none)')
        resolve()
      })
    })
  })
})
