'use strict'
const {logger} = require('./index')
module.exports.plugin = {
  pkg: require('../package.json'),
  register: async (server, options) => {
    const target = options.logger || logger

    server.events.on('log', (event, tags) => {
      if (tags.error || event.error) {
        let error = event.error || new Error(event.data)
        target.notify('error', error)
      } else {
        target.notify('info', event.data)
      }
    })

    server.events.on('request', (request, event, tags) => {
      if (tags.error || event.error) {
        let error = event.error
        error.params = request.query
        error.context = {
          action: `${request.method.toUpperCase()} ${request.url.path}`,
          userAgent: request.headers['user-agent']
        }
        error.session = request.state
        target.notify('error', error)
      }
    })

    server.method('notify', (error) => {
      target.notify('error', error)
    })
  }
}
