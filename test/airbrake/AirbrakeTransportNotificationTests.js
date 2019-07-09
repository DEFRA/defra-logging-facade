'use strict'
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const AirbrakeTransport = require('../../lib/transports/AirbrakeTransport')
const FakeAirbrake = require('../lib/FakeAirbrake')
const fakeAirbrakeServer = new FakeAirbrake()
const path = require('path')
const scriptName = path.basename(__filename)
const colors = require('colors')
const assert = require('assert')

function testFakeAirbrakeRequest (request) {
  expect(request.params.path).to.equal('api/v3/projects/1/notices')
  const payload = request.payload
  expect(payload.errors).to.be.a.array()
  expect(payload.errors.length).to.equal(1)
  expect(payload.errors[0].backtrace).to.be.a.array()
}

const airbrakeOpts = {
  airbrakeHost: `http://localhost:${fakeAirbrakeServer.getPort()}`,
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
    testFakeAirbrakeRequest(notificationRequest)
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
    testFakeAirbrakeRequest(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('First string Second string')
  })

  lab.test('notifies as expected when given an Array of strings with an Error object', async () => {
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))

    const transport = new AirbrakeTransport(airbrakeOpts)
    await transport.log({
      message: ['A string containing %s and a', 'an embedded string', new Error('Test error object')]
    })

    testFakeAirbrakeRequest(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('A string containing an embedded string and a Test error object')
    expect(payload.errors[0].backtrace[0].file).to.include(scriptName)
  })

  lab.test('notifies as expected when given an Error object', async () => {
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))

    const transport = new AirbrakeTransport(airbrakeOpts)
    await transport.log({
      message: new Error('Test error object')
    })

    testFakeAirbrakeRequest(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('Test error object')
    expect(payload.errors[0].backtrace[0].file).to.include(scriptName)
  })

  lab.test('correctly translates winston log level to airbrake log level', async () => {
    const mapping = {
      'error': 'error',
      'warn': 'warning',
      'info': 'info',
      'verbose': 'debug',
      'debug': 'debug',
      'silly': 'debug'
    }

    for (let level in mapping) {
      let severity = mapping[level]
      let msg = 'A message of level ' + level + ' should map to airbrake severity ' + severity
      let notificationRequest = null
      fakeAirbrakeServer.useDefaultResponse()
      fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))

      const transport = new AirbrakeTransport(airbrakeOpts)
      await transport.log({
        message: msg,
        level: level
      })

      testFakeAirbrakeRequest(notificationRequest)
      const payload = notificationRequest.payload
      expect(payload.errors[0].message).to.equal(msg)
      expect(payload.context.severity).to.equal(severity)
    }
  })

  lab.test('degrades given an empty message array', async () => {
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))

    const transport = new AirbrakeTransport(airbrakeOpts)
    await transport.log({ message: [] })

    testFakeAirbrakeRequest(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('Unspecified error')
  })

  lab.test('degrades when not given a message property', async () => {
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))

    const transport = new AirbrakeTransport(airbrakeOpts)
    await transport.log({ anotherProperty: 'here' })

    testFakeAirbrakeRequest(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('Unspecified error')
  })

  lab.test('degrades when not given an info object', async () => {
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))
    const transport = new AirbrakeTransport(airbrakeOpts)
    await transport.log(null)

    testFakeAirbrakeRequest(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('Unspecified error')
  })

  lab.test('doesn\'t alter the Error object', async () => {
    const expectedNotification = 'Example error text with ANSI colours'
    const inputText = colors.red(expectedNotification)
    const errorObj = new Error(inputText)
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))
    const transport = new AirbrakeTransport(airbrakeOpts)
    await transport.log({ message: errorObj })

    // Check the error object passed to the transport is unmodified
    expect(errorObj).to.be.an.error()
    expect(errorObj.message).to.equal(inputText)

    // Check the text given in the notification
    testFakeAirbrakeRequest(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal(expectedNotification)
  })

  lab.test('doesn\'t alter the Error object when in an Array', async () => {
    const inputText = colors.blue('Example error text with ANSI colours')
    const errorObj = new Error(inputText)
    let notificationRequest = null
    fakeAirbrakeServer.useDefaultResponse()
    fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))
    const transport = new AirbrakeTransport(airbrakeOpts)
    await transport.log({ message: ['Some preceding text', errorObj] })

    // Check the error object passed to the transport is unmodified
    expect(errorObj).to.be.an.error()
    expect(errorObj.message).to.equal(inputText)

    // Check the text given in the notification
    testFakeAirbrakeRequest(notificationRequest)
    const payload = notificationRequest.payload
    expect(payload.errors[0].message).to.equal('Some preceding text Example error text with ANSI colours')
  })

  lab.test('handles different types of Error object', async () => {
    class CustomErrorWithNonStandardConstructor extends Error {
      constructor (options) {
        assert.ok(typeof options === 'object', 'Options should be an object')
        super(options.message)
      }
    }

    const errors = [
      new Error('Standard error object'),
      new RangeError('RangeError object'),
      new ReferenceError('ReferenceError object'),
      new SyntaxError('SyntaxError object'),
      new TypeError('TypeError object'),
      new CustomErrorWithNonStandardConstructor({
        message: 'Test non-standard error object'
      })
    ]

    // Generate an AssertionError and add to the list
    try {
      assert.strictEqual(false, true, 'Expected false to be true (for testing purposes only...)')
    } catch (e) {
      errors.push(e)
    }

    for (let errorObj of errors) {
      const errorMsg = errorObj.message

      let notificationRequest = null
      fakeAirbrakeServer.useDefaultResponse()
      fakeAirbrakeServer.setNotificationHandler((request) => (notificationRequest = request))
      const transport = new AirbrakeTransport(airbrakeOpts)
      await transport.log({ message: ['Some preceding text', errorObj] })

      // Check the error object passed to the transport is unmodified
      expect(errorObj).to.be.an.error()
      expect(errorObj.message).to.equal(errorMsg)

      // Check the text given in the notification
      testFakeAirbrakeRequest(notificationRequest)
      const payload = notificationRequest.payload
      expect(payload.errors[0].message).to.equal('Some preceding text ' + errorMsg)
    }
  })

  lab.after(async () => {
    await fakeAirbrakeServer.stop()
  })
})
