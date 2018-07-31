'use strict'
const Transport = require('winston-transport')
const AirbrakeClient = require('airbrake-js')
const util = require('util')

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

  async log (logInfo = {}, callback = () => {}) {
    try {
      if (this._client) {
        let info = Object.assign({level: 'error', message: new Error('Unspecified error')}, logInfo)

        setImmediate(() => {
          this.emit('logged', info)
        })

        let error = info.message
        if (Array.isArray(error)) {
          const firstError = error.find(el => el instanceof Error) || new Error()
          const other = error.filter(el => !(el instanceof Error))
          const otherText = util.format.apply(null, other)
          error = firstError
          if (otherText) {
            let msg = otherText
            if (error.message) msg += ` ${error.message}`
            error.message = msg
          }
        }

        const result = await this._client.notify({
          error: error,
          context: Object.assign({
            component: process.mainModule.filename,
            severity: AirbrakeTransport._toAirbrakeSeverity(info.level)
          }, error.context),
          environment: error.environment || {},
          params: error.params || {},
          session: error.session || {}
        })
        if (result.error) {
          // TODO: Requeue notification?
          throw result.error
        }
        return result
      }
    } catch (e) {
      process.stderr.write(util.format.apply(null, ['Failed to notify Airbrake', e]))
      // TODO: Test if this kills a server....
      // this.emit('error', e)
      // throw e
    } finally {
      callback()
    }
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
      case 'verbose':
        return 'info'
      case 'debug':
      case 'silly':
        return 'debug'
      default:
        return 'error'
    }
  }
}
