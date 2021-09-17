'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const AirbrakeTransport = require('../../lib/transports/AirbrakeTransport')

lab.experiment('Test airbrake transport configuration', () => {
  lab.beforeEach(() => {
    delete process.env.AIRBRAKE_HOST
    delete process.env.AIRBRAKE_PROJECT_KEY
    delete process.env.AIRBRAKE_LOG_LEVEL
    delete process.env.NODE_ENV
  })

  lab.test('is disabled if host and key not set', async () => {
    const transport = new AirbrakeTransport()
    expect(transport.name).to.equal('airbrake')
    expect(transport._airbrakeHost).to.be.undefined()
    expect(transport._airbrakeKey).to.be.undefined()
    expect(transport._client).to.be.undefined()
  })

  lab.test('is enabled via environment variable', async () => {
    process.env.AIRBRAKE_HOST = 'https://127.0.0.1:12345'
    process.env.AIRBRAKE_PROJECT_KEY = '1234567890'
    const transport = new AirbrakeTransport()
    expect(transport._airbrakeHost).to.equal(process.env.AIRBRAKE_HOST)
    expect(transport._airbrakeKey).to.equal(process.env.AIRBRAKE_PROJECT_KEY)
    expect(transport._client).to.not.be.undefined()
  })

  lab.test('is enabled via configuration', async () => {
    const opts = {
      airbrakeHost: 'https://127.0.0.1:12345',
      airbrakeKey: '1234567890'
    }
    const transport = new AirbrakeTransport(opts)
    expect(transport._airbrakeHost).to.equal(opts.airbrakeHost)
    expect(transport._airbrakeKey).to.equal(opts.airbrakeKey)
    expect(transport._client).to.not.be.undefined()
  })

  lab.test('is set by explicit arguments in precedence to environment', async () => {
    const opts = {
      airbrakeHost: 'https://127.0.0.1:12345',
      airbrakeKey: '1234567890'
    }
    process.env.AIRBRAKE_HOST = 'https://envvarsetting:12345'
    process.env.AIRBRAKE_PROJECT_KEY = 'envvarsettingkey'

    const transport = new AirbrakeTransport(opts)
    expect(transport._airbrakeHost).to.equal(opts.airbrakeHost)
    expect(transport._airbrakeKey).to.equal(opts.airbrakeKey)
    expect(transport._client).to.not.be.undefined()
  })

  lab.test('defaults to only sending errors', async () => {
    const transport = new AirbrakeTransport()
    expect(transport.level).to.equal('error')
  })

  lab.test('level set via environment variable', async () => {
    process.env.AIRBRAKE_LOG_LEVEL = 'warn'
    const transport = new AirbrakeTransport()
    expect(transport.level).to.equal('warn')
  })

  lab.test('level set by configuration', async () => {
    process.env.AIRBRAKE_LOG_LEVEL = 'warn'
    const transport = new AirbrakeTransport({
      level: 'info'
    })
    expect(transport.level).to.equal('info')
  })

  lab.test('this fails', () => {
    expect(false).toBeTruthy()
  })
})
