[![Build Status](https://travis-ci.org/DEFRA/defra-logging-facade.svg?branch=master)](https://travis-ci.org/DEFRA/defra-logging-facade)
[![Maintainability](https://api.codeclimate.com/v1/badges/5c85565bb7e8316b381c/maintainability)](https://codeclimate.com/github/DEFRA/defra-logging-facade/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/5c85565bb7e8316b381c/test_coverage)](https://codeclimate.com/github/DEFRA/defra-logging-facade/test_coverage)
[![Licence](https://img.shields.io/badge/Licence-OGLv3-blue.svg)](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3)

The DEFRA logging facade has been designed to standardise the logging functionality for digital services.
It uses twelve-factor app principles and may be configured completely via environment variables. 

## Cloning
Cloning via SSH from behind a corporate firewall which blocks port 22:
```bash
git clone ssh://git@ssh.github.com:443/DEFRA/defra-logging-facade
```

# Installation

Via github:
```
npm install --save https://github.com/DEFRA/defra-logging-facade.git#master
```

It is recommended that tie to a specific commit/version as follows:
```
npm install --save https://github.com/DEFRA/defra-logging-facade.git#commit_or_version
```


# Usage

## Recommended Usage

It is strongly recommended that projects use the default logger unless there is a need to configure a logger in a 
specific manner (e.g. a special logger object to server as a audit trail).  Thhe default logger is configured solely 
using environment variables.  For further details of the environment variables available, see below.

```
const {logger} = require('defra-logging-facade')

logger.debug('Debug message')
logger.info('Info message')
logger.log('Another info message'
logger.warn('Warning message')
logger.error('An error occurred', err)
```
> **Note**: Only use the .error() severity when the error is unexpected/unrecoverable and represents a real operational
> problem with the service.  Client request errors, for example, should never be logged with the .error() method. 

## Overriding console log methods
The DEFRA logging facade provides a simple migration path for existing projects using the console log methods
(console.log(), console.warn(), console.error()).  The facade implementation of these methods is compatible with the
existing console logging methods.

There are two ways to switch the existing console logging calls over to use the logging facade:

The facade can also intercept the console log methods on a process-wide basis:
```javascript
const {logger} = require('defra-logging-facade')
logger.interceptConsole()
```

If you want to avoid intercepting the console on a process-wide basis but are too lazy to refactor existing console.log()
calls, you can shadow the console object, by adding the following require statement at the top of each .js file
```javascript
const {console} = require('defra-logging-facade')
```



## Integrating with hapi

### Simple hapi integration
The defra-logging-facade provides a simple hapi plugin for dealing with log events from hapi.  This plugin does not require
the hapi good logging framework or any additional plugins.

To integrate hapi with the default logger:
```javascript
const {HapiErrorLoggerPlugin} = require('defra-logging-facade')

const start = async () => {
  await server.register(HapiErrorLoggerPlugin)
  await server.start()
}
```
To integrate hapi with a custom logger:
```javascript
const {Logger, HapiErrorLoggerPlugin} = require('defra-logging-facade')
const customLogger = new Logger({transports: {}})

const start = async () => {
  await server.register({
    plugin: HapiErrorLoggerPlugin,
    options: {
      logger: this._options.logger
    }
  })
  await server.start()
}
```

### Advanced Hapi Integration
The DEFRA logging facade can also be integrated with [good](https://github.com/hapijs/good) process monitoring package
for [hapi](https://github.com/hapijs/hapi).

The following example demonstrates how you might configure good reporters to use the logging facade.  Note that arguments
are optional.  If no arguments are supplied, the logging levels for each event match those shown below.

```json
{
    "ops": {
      "interval": 10000
    },
    "reporters": {
      "console": [
        {
          "module": "good-squeeze",
          "name": "Squeeze",
          "args": [
            {
              "log": "*",
              "request": "*",
              "response": "*",
              "error": "*",
              "ops": "*"
            }
          ]
        },
        {
          "module": "defra-logging-facade",
          "args": [{
            "goodEventLevels": {
              "log": "info",
              "error": "error",
              "ops": "debug",
              "request": "info",
              "response": "info"
            }
          }]
        }
      ]
    }
}
```

**Note**

It is common for hapi projects to want to display custom content to the user in the event of a server error (some 
uncaught exception thrown by a route handler, for example).  This is often achieved through a custom onPreResponse handler.  

Using a custom onPreResponse handler to forward to a custom view will suppress the error event so you must log the error manually.

The `logger.serverError(error, request)` method is provided for this purpose.  The request object may be passed along with
the Error in order to provide additional debugging data to airbrake/errbit.


```javascript
const {logger} = require('defra-logging-facade')
server.ext('onPreResponse', (request, h) => {
  if (request.response.isBoom) {
    // An error occurred processing the request
    const statusCode = Math.floor(request.response.output.statusCode) || 500
    
    if (statusCode / 100 === 4) {
      // Custom handling for 4xx codes
    } else if (statusCode / 100 === 5) {
      // 5xx Server failure, log an error to airbrake/errbit - the response object is actually an instanceof Error
      logger.serverError(request.response, request)
      return h.view('500').code(statusCode)
    }
  }
  return h.continue
})

``` 


# Environment Variable Reference

General:

| Variable           | Description   
| -------------      |-------------
| LOG_LEVEL          | The lowest severity of message which will be processed by any transport, **default: `info`** 


For airbrake/errbit integration:

| Variable              | Description   
| -------------         |-------------
| AIRBRAKE_HOST         | The airbrake server to notify (e.g https://airbrakeserver.example.com) **required** 
| AIRBRAKE_PROJECT_KEY  | The project key configured on the server to identify your service **required**
| AIRBRAKE_LOG_LEVEL    | The lowest severity of message which will be sent to airbrake, **default: `error`** 


# Contributing to this project

Please read the [contribution guidelines](/CONTRIBUTING.md) before submitting a pull request.

# License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

>Contains public sector information licensed under the Open Government license v3

## About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
