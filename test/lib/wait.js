const util = require('util')
module.exports.until = (condition, max = 10000) => {
  return new Promise(function (resolve, reject) {
    const start = new Date()
    const ref = setInterval(function () {
      if (condition && condition()) {
        clearInterval(ref)
        resolve()
      } else if (new Date() - start > max) {
        clearInterval(ref)
        reject(new Error(util.format.apply(null, ['Condition not satisfied within allowed time', condition])))
      }
    }, 100)
  })
}

module.exports.for = (millis = 1000) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, millis)
  })
}
