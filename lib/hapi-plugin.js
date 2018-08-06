'use strict'
const {logger} = require('./index')
const util = require('util')
module.exports.plugin = {
  pkg: require('../package.json'),
  register: async (server, options) => {
    const target = options.logger || logger

    server.events.on('log', (event, tags) => {
      if (tags.error || event.error) {
        let error = event.error || new Error(util.format(event.data))
        target.serverError(error)
      } else {
        target.notify('info', event.data)
      }
    })

    server.events.on('request', (request, event, tags) => {
      if (tags.error || event.error) {
        let error = event.error || new Error(util.format(event.data))
        target.serverError(error, request)
      }
    })

    server.method('notify', (error) => {
      target.notify('error', error)
    })
  }
}
