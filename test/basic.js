var path = require('path')
var util = require('util')
var test = require('tape')
var datTest = require('../lib/dat-test')

test('Basic performance', function (t) {
  var dir = path.join(__dirname, 'datasets', 'basic')
  datTest(dir, function (err, timers) {
    t.error(err)
    t.ok(timers, 'Got results')
    t.pass(printTime('Share', timers.share))
    t.pass(printTime('Download', timers.download))
    t.pass(printTime('Total', timers.all))
    t.end()
  }, t)
})

function printTime (name, timer) {
  return util.format(name + ' time: %ds %dms', timer[0], timer[1] / 1000000)
}
