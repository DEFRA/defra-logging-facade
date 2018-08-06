module.exports = {
  decorateError: (error, request) => {
    if (request) {
      error.params = request.query
      error.context = {
        action: `${request.method.toUpperCase()} ${request.url.path}`,
        userAgent: request.headers['user-agent']
      }
      error.session = request.state
    }
    return error
  }
}
