'use strict'
const _ = require('lodash')
const Stream = require('stream')
const util = require('util')

const internals = {
  defaults: {
    goodEventLevels: {
      log: 'info',
      error: 'error',
      ops: 'debug',
      response: 'info',
      request: 'info'
    }
  }
}

internals.utility = {
  formatError (data) {
    let output = data.error
    output.params = data.url ? data.url.query : {}

    if (data.method) {
      const path = data.path || (data.url ? data.url.path : '')
      output.context = {action: `${data.method.toUpperCase()} ${path}`}
    }
    return output
  },

  formatOutput (event) {
    event.tags = event.tags.toString()
    const tags = ` [${event.tags}] `
    const id = event.id ? ` (${event.id})` : ''
    return `${id}${tags}${event.data}`
  },

  formatMethod (method) {
    const methodColors = {get: 32, delete: 31, put: 36, post: 33}
    let formattedMethod = method.toLowerCase()
    const color = methodColors[method.toLowerCase()] || 34
    formattedMethod = `\x1b[1;${color}m${formattedMethod}\x1b[0m`
    return formattedMethod
  },

  formatStatusCode (statusCode) {
    let color = 32
    if (statusCode >= 500) {
      color = 31
    } else if (statusCode >= 400) {
      color = 33
    } else if (statusCode >= 300) {
      color = 36
    }
    return `\x1b[${color}m${statusCode}\x1b[0m`
  },

  formatResponse (event, tags) {
    const query = event.query
    delete query.os
    delete query.process
    const method = internals.utility.formatMethod(event.method)
    const statusCode = internals.utility.formatStatusCode(event.statusCode)

    const output = `${event.instance}: ${method} ${event.path} ${util.format(event.query)} ${statusCode} (${event.responseTime}ms)`
    const response = {
      id: event.id,
      timestamp: event.timestamp,
      tags,
      data: output
    }
    return internals.utility.formatOutput(response)
  },

  formatOps (event, tags) {
    const memory = Math.round(event.proc.mem.rss / (1024 * 1024))
    const output = `memory: ${memory}Mb, uptime (seconds): ${event.proc.uptime}, load: [${event.os.load}]`
    return internals.utility.formatOutput({timestamp: event.timestamp, tags, data: output})
  },

  formatDefault (event, tags) {
    const data = typeof event.data === 'object' ? util.format(event.data) : event.data || '(none)'
    return internals.utility.formatOutput({
      timestamp: event.timestamp,
      id: event.id,
      tags,
      data: `data: ${data}`
    })
  }
}

module.exports = class GoodStreamAdapter extends Stream.Writable {
  constructor (options) {
    super({objectMode: true, decodeStrings: false})
    this._streamAdapterOptions = _.defaultsDeep({}, options, internals.defaults)
  }

  _write (data, encoding, callback) {
    let method = 'info'
    let output = data
    const eventName = data.event
    if (eventName) {
      let result = this._processHapiEvent(data)
      method = result.method
      output = result.output
    }
    // Notify via LoggerProxy
    this.notify(method, output)
    setImmediate(callback)
  }

  _processHapiEvent (data) {
    let result = {
      method: this._streamAdapterOptions.goodEventLevels[data.event] || 'info',
      output: data
    }
    const tags = this._getTags(data)

    if (data.event === 'error' || data.error instanceof Error) {
      result.output = internals.utility.formatError(data)
      result.method = 'error'
    } else if (data.event === 'ops') {
      result.output = internals.utility.formatOps(data, tags)
    } else if (data.event === 'response') {
      result.output = internals.utility.formatResponse(data, tags)
    } else {
      // Handle 'request' event via request.log() and 'log' event via server.log()
      result.output = internals.utility.formatDefault(data, tags)
    }
    return result
  }

  _getTags (data) {
    let tags = []
    if (data.tags) {
      tags = [].concat(data.tags)
    }
    tags.unshift(data.event)
    return tags
  }
}
