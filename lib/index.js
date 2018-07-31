'use strict'
const {createLogger, format, transports} = require('winston')
const {combine, simple, colorize} = format
const AirbrakeTransport = require('./transports/AirbrakeTransport')
const util = require('util')
const EventEmitter = require('events')

const pretty = format(info => {
  if (Array.isArray(info.message)) info.message = util.format.apply(null, info.message)
  return info
})

class LoggerProxy {
  constructor () {
    const self = this
    self._activeTransports = [
      new transports.Console({
        format: combine(
          colorize(),
          pretty(),
          simple()
        ),
        handleExceptions: true
      }),
      new AirbrakeTransport()
    ]

    self._logger = createLogger({
      exitOnError: false,
      transports: self._activeTransports
    })

    self.events = new EventEmitter()
    self._activeTransports.forEach(t => {
      t.on('logged', function (info) {
        setImmediate(() => {
          self.events.emit('logged', {
            transport: t.name,
            level: info[Symbol.for('level')],
            message: info.message,
            info: info
          })
        })
      })
    })

    // Set up short-cut methods to proxy the log method
    this._nativeConsole = {}

    ;['debug', 'info', 'warn', 'error'].forEach(function (method) {
      self[method] = (...args) => self.log(method, ...args)
      self._nativeConsole[method] = console[method].bind(console)

      // if (process.env.CONSOLE_LOG_INTERCEPT) {
      //   console[method] = (...args) => LoggerProxy.log(method, ...args)
      // }
    })
  }

  profile (id, ...args) {
    return this._logger.profile(id, ...args)
  }

  log (level, ...args) {
    try {
      this._logger.log({
        level: level,
        message: args
      })
    } catch (e) {
      process.stderr.write(util.format.apply(null, ['Unable to log error to one or more transports', e]))
    }
  }
}

module.exports = LoggerProxy
LoggerProxy.default = new LoggerProxy()
module.exports.plugin = {
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

      logger.log('error', error)
    })

    server.method('notify', (error) => {
      logger.log('error', error)
    })
  }
}
