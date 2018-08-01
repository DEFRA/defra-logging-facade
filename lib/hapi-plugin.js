'use strict'
const LoggerProxy = require('./index')
module.exports = {
  pkg: require('../package.json'),
  register: async (server, options) => {
    const logger = options.logger || LoggerProxy.default

    // server.events.on('log', (event) => {
    //   logger.log('info', event)
    // })
    server.events.on({name: 'request', channels: ['error']}, (request, event) => {
      let error = event.error
      error.params = request.query
      error.context = {
        action: `${request.method.toUpperCase()} ${request.url.path}`,
        userAgent: request.headers['user-agent']
      }
      // TODO: Or not TODO... security?
      // error.environment = process.env

      logger.notify('error', error)
    })

    server.method('notify', (error) => {
      logger.notify('error', error)
    })
  }
}
