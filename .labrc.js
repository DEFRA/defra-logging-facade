module.exports = {
  coverage: true,
  threshold: 90,
  lint: true,

  // lcov reporter required for travisci/codeclimate
  reporter: ['console', 'html', 'lcov'],
  output: ['stdout', 'coverage.html', 'lcov.info']
}
