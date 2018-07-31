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

## Basic usage

```
const logger = require('defra-logging-facade').default;

logger.debug('Debug message')
logger.info('Info message')
logger.warn('Warning message')
logger.error('Error message')

log.log('error', 'Error message')
```

## Integrating with hapi


To integrate hapi with the default logger:
```
const Logger = require('defra-logging-facade')

const start = async() => {
  ...
  await server.register({
    plugin: Logger
  })
  ...
}

```
To integrate hapi with a custom logger:
```
const Logger = require('defra-logging-facade')

const start = async() => {
  ...
  await server.register({
    plugin: Logger
  })
  ...
}

```

## Contributing to this project

Please read the [contribution guidelines](/CONTRIBUTING.md) before submitting a pull request.

## Credits

Original source for this work came from [Data Returns PI](https://github.com/DEFRA/data-returns-pi-frontend)
Original implementation of Winston Airbake transport from [winston-airbrake](https://github.com/dstevensio/winston-airbrake)

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

>Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
