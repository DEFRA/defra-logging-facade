'use strict'
// TODO: Investigate, the lab documentation is vague on this and the examples don't seem to work...

// const Lab = require('lab')
// const lab = exports.lab = Lab.script()
// const {expect} = require('code')
// const {logger} = require('../../lib/index')
// const LogMonitor = require('../lib/LogMonitor')
// const monitor = new LogMonitor(logger)
//
// lab.experiment('Logs unhandled', () => {
//   lab.before(async () => {
//     setTimeout(() => {
//       throw new Error('Test')
//       // Promise.reject(new Error('Test'))
//     })
//   })
//
//   lab.test('leaves an unhandled rejection', async (flags) => {
//     const result = await monitor.lastLog()
//     expect(result.level).to.equal('error')
//     // expect(result.message).to.include('Unhandled Rejection at')
//     expect(result.message).to.include('Error: Test')
//   })
// })
