const Hapi = require('hapi')

let nextPort = 16161
module.exports = class FakeAirbrake {
  constructor (opts = {}) {
    const self = this
    const port = opts.port || nextPort++
    this._fakeAirbrakeServer = Hapi.server({
      port: port,
      host: 'localhost'
    })
    this.useDefaultResponse()

    this._fakeAirbrakeServer.events.on('start', function () {
      console.log('Fake airbrake is running on PORT : ' + self.getPort())
    })

    process.on('SIGINT', function () {
      self.stop()
    })

    this._fakeAirbrakeServer.route({
      method: ['GET', 'POST', 'PATCH', 'PUT'],
      path: '/{path*}',
      handler: (request, h) => {
        if (this._notificationHandler) {
          try {
            this._notificationHandler(request)
          } catch (e) {
            console.error('Error in notification handler', e)
          }
        }
        const body = { id: Math.floor(Math.random() * 100000) }
        return h.response(body).code(this._activeResponseCode)
      }
    })
  }

  async start () {
    await this._fakeAirbrakeServer.start()
  }

  async stop () {
    await this._fakeAirbrakeServer.stop({ timeout: 1000 })
  }

  useDefaultResponse () {
    this._activeResponseCode = 200
  }

  useErrorResponse (errorCode = 500) {
    this._activeResponseCode = errorCode
  }

  setNotificationHandler (callback) {
    this._notificationHandler = callback
  }

  getPort () {
    return this._fakeAirbrakeServer.info.port
  }
}
