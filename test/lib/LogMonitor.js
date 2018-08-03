module.exports = class LogMonitor {
  constructor (logger) {
    this._logs = []
    logger.events.on('logged', (logEvent) => {
      this._logs.push(logEvent)
    })
  }

  reset () {
    this._logs = []
  }

  async all () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this._logs.length > 0) {
          resolve(this._logs)
        }
        reject(new Error('No logs found'))
      }, 100)
    })
  }

  async lastLog () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this._logs.length > 0) {
          resolve(this._logs[this._logs.length - 1])
        }
        reject(new Error('No logs found'))
      }, 300)
    })
  }
}
