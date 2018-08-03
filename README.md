[![Build Status](https://travis-ci.org/DEFRA/defra-logging-facade.svg?branch=master)](https://travis-ci.org/DEFRA/defra-logging-facade)
[![Maintainability](https://api.codeclimate.com/v1/badges/5c85565bb7e8316b381c/maintainability)](https://codeclimate.com/github/DEFRA/defra-logging-facade/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/5c85565bb7e8316b381c/test_coverage)](https://codeclimate.com/github/DEFRA/defra-logging-facade/test_coverage)

The DEFRA logging facade has been designed to standardise the logging functionality for digital services.
It uses twelve-factor app principles and may be configured completely via environment variables. 


# Installation

```
npm install --save defra-logging-facade
```

# Usage

## Retrieving the default logger

```
const {logger} = require('defra-logging-facade')

logger.debug('Debug message')
logger.info('Info message')
logger.log('Another info message'
logger.warn('Warning message')
logger.error('Error message')

```

## Overriding console log methods
The DEFRA logging facade provides a simple migration path for existing projects using the console log methods
(console.log(), console.warn(), console.error()).  The facade implementation of these methods is compatible with the
existing console logging methods.

There are two ways to switch the existing console logging calls over to use the logging facade:

### Method 1 - By shadowing the console object, requires you to add the following require statement at the top of each .js file

```javascript
const {console} = require('defra-logging-facade')

console.debug('Debug message')
console.info('Info message')
console.log('Another info message')
console.warn('Warning message')
console.error('Error message')
```

### Method 2 - The facade can also intercept the console log methods on a process-wide basis.

```javascript
const {logger} = require('defra-logging-facade')
logger.interceptConsole()

console.debug('Debug message')
console.info('Info message')
console.log('Another info message')
console.warn('Warning message')
console.error('Error message')
```

## Integrating with hapi


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
              "error": "error",
              "ops": "debug",
              "request": "error",
              "response": "error"
            }
          }]
        }
      ]
    }
}
```


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
