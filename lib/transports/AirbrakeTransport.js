'use strict'
const Transport = require('winston-transport')
const AirbrakeClient = require('airbrake-js')
const util = require('util')
const _ = require('lodash')

module.exports = class AirbrakeTransport extends Transport {
  constructor (opts = {}) {
    const options = Object.assign({level: process.env.AIRBRAKE_LOG_LEVEL || 'error'}, opts)
    super(options)
    this.name = 'airbrake'
    this._options = options

    this._airbrakeHost = opts.airbrakeHost || process.env.AIRBRAKE_HOST
    this._airbrakeKey = opts.airbrakeKey || process.env.AIRBRAKE_PROJECT_KEY

    if (this._airbrakeHost && this._airbrakeKey) {
      this._client = new AirbrakeClient({
        unwrapConsole: true,
        projectId: 1,
        host: this._airbrakeHost,
        projectKey: this._airbrakeKey,
        environment: process.env.NODE_ENV || 'NODE_ENV Not Set'
      })
    }
  }

  async log (logInfo, callback = () => {}) {
    try {
      if (this._client) {
        setImmediate(() => {
          this.emit('logged', info)
        })
        const info = Object.assign({level: 'error'}, logInfo)
        const error = AirbrakeTransport._extractError(info)
        const result = await this._client.notify(AirbrakeTransport._createNotification(info, error))
        if (AirbrakeTransport._isUnexpectedError(result)) {
          throw result.error
        }
        return result
      }
    } catch (e) {
      process.stderr.write(util.format.apply(null, ['Failed to notify Airbrake', e]))
    } finally {
      callback()
    }
  }

  static _extractError (info) {
    let error = info.message || 'Unspecified error'
    if (error instanceof Error) {
      error = AirbrakeTransport._cloneError(error)
    } else if (Array.isArray(error)) {
      const nonErrorText = util.format.apply(null, error.filter(el => !(el instanceof Error)))
      error = error.find(el => el instanceof Error)
      if (!error) {
        error = new Error(nonErrorText || 'Unspecified error')
      } else if (nonErrorText) {
        error = AirbrakeTransport._cloneError(error)
        error.message = `${nonErrorText} ${error.message}`
      }
    } else {
      error = new Error(error)
    }
    error.message = AirbrakeTransport._stripAnsiColours(error.message)
    return error
  }

  static _stripAnsiColours (txt) {
    return txt.replace(/\x1b\[[0-9;]*m/g, '') // eslint-disable-line no-control-regex
  }

  static _createNotification (info, error) {
    return {
      error: error,
      context: Object.assign({
        component: process.mainModule.filename,
        severity: AirbrakeTransport._toAirbrakeSeverity(info.level)
      }, error.context),
      environment: error.environment || {},
      params: error.params || {},
      session: error.session || {}
    }
  }

  static _isUnexpectedError (result) {
    const ignored = ['airbrake: error is filtered']
    return result.error && !ignored.includes(result.error.message)
  }

  static _cloneError (error) {
    let err = new error.constructor(error.message)
    const props = ['stack', 'code', 'errno', 'syscall'].concat(Object.keys(error))
    for (let prop of props) {
      err[prop] = _.cloneDeep(error[prop])
    }
    return err
  }

  /**
   * Airbrake supports the following severities (defaults to error):
   *   debug, info, notice, warning, error, critical, alert, emergency
   *
   * Errors with a severity of debug, info, notice, or warning will not trigger error emails or integration notifications.
   * @param level
   * @returns {string}
   * @private
   */
  static _toAirbrakeSeverity (level) {
    switch (level) {
      case 'warn':
        return 'warning'
      case 'info':
        return 'info'
      case 'verbose':
      case 'debug':
      case 'silly':
        return 'debug'
      default:
        return 'error'
    }
  }
}
