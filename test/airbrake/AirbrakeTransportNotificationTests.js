'use strict'
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const {expect} = require('code')
const AirbrakeTransport = require('../../lib/transports/AirbrakeTransport')
const FakeAirbrake = require('../lib/FakeAirbrake')
const fakeAirbrakeServer = new FakeAirbrake()
const path = require('path')
const scriptName = path.basename(__filename)

function defaultResponseAssertions (request) {
  expect(request.params.path).to.equal('/api/v3/projects/1/notices')
  const payload = request.payload
  expect(payload.errors).to.be.a.array()
  expect(payload.errors.length).to.equal(1)
  expect(payload.errors[0].backtrace).to.be.a.array()
}

const airbrakeOpts = {
  airbrakeHost: `http://localhost:${fakeAirbrakeServer.getPort()}/`,
  airbrakeKey: '1234567890'
}
lab.experiment('Test airbrake transport', () => {
  lab.before(async () => {
    await fakeAirbrakeServer.start()
  })

  lab.test('notifies as expected when given a string', async () => {
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))

    const transport = new AirbrakeTransport(airbrakeOpts)
    let callbackInvoked = false
    await transport.log({
      message: 'A string message only'
    }, () => {
      callbackInvoked = true
    })
    expect(callbackInvoked).to.equal(true)
    defaultResponseAssertions(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('A string message only')
  })

  lab.test('notifies as expected when given an array of strings', async () => {
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))

    const transport = new AirbrakeTransport(airbrakeOpts)
    let callbackInvoked = false
    await transport.log({
      message: [
        'First string',
        'Second string'
      ]
    }, () => {
      callbackInvoked = true
    })
    expect(callbackInvoked).to.equal(true)
    defaultResponseAssertions(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('First string Second string')
  })

  lab.test('notifies as expected when given an Error object', async () => {
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))

    const transport = new AirbrakeTransport(airbrakeOpts)
    await transport.log({
      message: new Error('Test error object')
    })

    defaultResponseAssertions(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('Test error object')
    expect(payload.errors[0].backtrace[0].file).to.include(scriptName)
  })

  lab.test('notifies as expected when given an Array of strings with an Error object', async () => {
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))

    const transport = new AirbrakeTransport(airbrakeOpts)
    await transport.log({
      message: [
        'A string containing %s and a',
        'an embedded string',
        new Error('Test error object')
      ]
    })

    defaultResponseAssertions(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('A string containing an embedded string and a Test error object')
    expect(payload.errors[0].backtrace[0].file).to.include(scriptName)
  })

  lab.test('degrades when not given a message property', async () => {
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))

    const transport = new AirbrakeTransport(airbrakeOpts)
    await transport.log({anotherProperty: 'here'})

    defaultResponseAssertions(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('Unspecified error')
  })

  lab.test('degrades when not given an info object', async () => {
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))
    const transport = new AirbrakeTransport(airbrakeOpts)
    await transport.log(null)

    defaultResponseAssertions(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('Unspecified error')
  })

  lab.after(async () => {
    await fakeAirbrakeServer.stop()
  })
})
