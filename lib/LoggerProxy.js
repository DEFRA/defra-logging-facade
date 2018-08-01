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
  constructor (options = {
    transports: {
      console: {
        format: combine(colorize(), pretty(), simple()),
        handleExceptions: true
      },
      airbrake: {}
    }
  }) {
    const self = this
    self._activeTransports = this._createTransports(options)
    self._logger = createLogger({
      exitOnError: false,
      transports: self._activeTransports
    })
    self.events = new EventEmitter()
    self._initEvents(self._activeTransports)

    // Set up short-cut methods to proxy the log method
    ;['debug', 'info', 'log', 'warn', 'error'].forEach(function (method) {
      self[method] = (...args) => self.notify(method, ...args)
    })

    this.interceptConsole()
  }

  _createTransports (options) {
    const supported = {
      console: transports.Console,
      airbrake: AirbrakeTransport
    }

    const instances = []
    for (let transport in options.transports) {
      const transportOptions = options.transports[transport]
      const constructor = supported[transport]
      if (constructor) {
        const instance = new supported[transport](transportOptions)
        instances.push(instance)
      }
    }
    return instances
  }

  _initEvents (transports) {
    const self = this
    transports.forEach((t) => {
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
  }

  interceptConsole () {
    this._nativeConsole = {}

    ;['log', 'info', 'warn', 'error'].forEach(function (method) {
      this._nativeConsole[method] = console[method].bind(console)
      console[method] = (...args) => this[method](...args)
    }.bind(this))
  }

  profile (id, ...args) {
    return this._logger.profile(id, ...args)
  }

  notify (level, ...args) {
    this._logger.log({
      level: LoggerProxy._winstonLevel(level),
      message: args
    })
  }

  static _winstonLevel (level) {
    switch (level) {
      case 'debug':
      case 'info':
      case 'warn':
      case 'error':
        return level
      default:
        return 'info'
    }
  }
}

module.exports = LoggerProxy
module.exports.default = new LoggerProxy()
