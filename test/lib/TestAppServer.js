const Hapi = require('hapi')
const Logger = require('../../lib/index')

let nextPort = 32323
module.exports = class TestAppServer {
  constructor (opts = {}) {
    const self = this
    const port = opts.port || nextPort++
    this._options = opts
    this._fakeAppServer = Hapi.server({
      port: port,
      host: 'localhost'
    })

    this._fakeAppServer.events.on('start', function () {
      console.log('Test app server is running on PORT : ' + self.getPort())
    })

    process.on('SIGINT', function () {
      self.stop()
    })

    this._fakeAppServer.route({
      method: ['GET', 'POST', 'PATCH', 'PUT'],
      path: '/ping/{responseCode*}',
      handler: (request, h) => {
        return h.response({response: request.params.responseCode}).code(parseInt(request.params.responseCode))
      }
    })
    this._fakeAppServer.route({
      method: ['GET', 'POST', 'PATCH', 'PUT'],
      path: '/broken',
      handler: () => {
        throw new Error('Broken')
      }
    })

    this.methods = this._fakeAppServer.methods
  }

  async inject (options) {
    return this._fakeAppServer.inject(options)
  }

  async start () {
    // Verbose, but designed to test both methods of initialisation
    let cfg = Logger
    if (this._options.logger) {
      cfg = {
        plugin: Logger,
        options: {
          logger: this._options.logger
        }
      }
    }
    await this._fakeAppServer.register(cfg)
    await this._fakeAppServer.start()
  }

  async stop () {
    await this._fakeAppServer.stop({timeout: 1000})
  }

  getPort () {
    return this._fakeAppServer.info.port
  }
}
