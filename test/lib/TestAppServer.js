const Hapi = require('hapi')

let nextPort = 32323
module.exports = class TestAppServer {
  constructor (opts = {}) {
    const self = this
    this._options = opts
    const port = this._options.port || nextPort++
    this._fakeAppServer = Hapi.server({
      port: port,
      host: 'localhost'
    })

    this._fakeAppServer.events.on('start', function () {
      process.stdout.write(`Test app server is running on port ${self.getPort()}\n`)
    })

    process.on('SIGINT', function () {
      self.stop()
    })

    this._fakeAppServer.route({
      method: ['GET', 'POST', 'PATCH', 'PUT'],
      path: '/ping/{responseCode*}',
      handler: (request, h) => {
        return h.response({ response: request.params.responseCode }).code(parseInt(request.params.responseCode))
      }
    })
    this._fakeAppServer.route({
      method: ['GET', 'POST', 'PATCH', 'PUT'],
      path: '/broken',
      handler: () => {
        throw new Error('NOT AN ERROR - JUST TESTING')
      }
    })
    this._fakeAppServer.route({
      method: ['GET', 'POST', 'PATCH', 'PUT'],
      path: '/fireRequestLog',
      handler: (request, h) => {
        request.log('info', 'A simple request log item')
        return h.response({ response: 200 }).code(200)
      }
    })
    this._fakeAppServer.route({
      method: ['GET', 'POST', 'PATCH', 'PUT'],
      path: '/fireRequestErrorLog',
      handler: (request, h) => {
        request.log('error', new Error('Testing error handling!'))
        return h.response({ response: 200 }).code(200)
      }
    })
    this._fakeAppServer.route({
      method: ['GET', 'POST', 'PATCH', 'PUT'],
      path: '/fireServerLog',
      handler: (request, h) => {
        this._fakeAppServer.log('something', 'Something happened')
        return h.response({ response: 200 }).code(200)
      }
    })
    this._fakeAppServer.route({
      method: ['GET', 'POST', 'PATCH', 'PUT'],
      path: '/fireServerErrorLog',
      handler: (request, h) => {
        this._fakeAppServer.log('error', new Error('Testing error handling!'))
        return h.response({ response: 200 }).code(200)
      }
    })

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

    this._fakeAppServer.route({
      method: ['GET', 'POST', 'PATCH', 'PUT'],
      path: '/timeout/{duration}',
      handler: async (request, h) => {
        const duration = parseInt(request.params.duration) || 5000
        await delay(duration)
        return h.response({ response: 200 }).code(200)
      }
    })

    this.methods = this._fakeAppServer.methods
  }

  async inject (options) {
    return this._fakeAppServer.inject(options)
  }

  async start () {
    for (let pluginCfg of this._options.plugins || []) {
      await this._fakeAppServer.register(pluginCfg)
    }
    await this._fakeAppServer.start()
  }

  async stop () {
    await this._fakeAppServer.stop({ timeout: 1000 })
  }

  getPort () {
    return this._fakeAppServer.info.port
  }
}
