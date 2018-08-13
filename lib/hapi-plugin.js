'use strict'
const {logger} = require('./index')

module.exports.plugin = {
  pkg: require('../package.json'),
  register: async (server, options) => {
    const target = options.logger || logger

    server.events.on('log', (event, tags) => {
      const logItem = event.data || event.error
      if (tags.error || logItem instanceof Error) {
        target.serverError(logItem)
      } else {
        target.notify('info', logItem)
      }
    })

    server.events.on('request', (request, event, tags) => {
      const logItem = event.data || event.error
      // hapi will set error.isServer to false on client errors, ignore these completely
      if (logItem && logItem.isServer !== false) {
        if (tags.error || logItem instanceof Error) {
          target.serverError(logItem, request)
        } else {
          target.notify('info', logItem)
        }
      }
    })

    server.method('notify', (error) => {
      target.notify('error', error)
    })
  }
}
