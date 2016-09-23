var path = require('path')
var test = require('tape')
var DatTest = require('../lib/dat-test')

test('Basic performance', function (t) {
  var dir = path.join(__dirname, 'datasets', 'basic')
  var datTest = DatTest(dir)

  datTest.runTest(function (err, results) {
    t.error(err)
    t.ok(results, 'got results')
    t.end()
  })

  datTest.once('share', function () {
    t.pass('share event')
  })

  datTest.once('download', function () {
    t.pass('download event')
  })

  datTest.once('end', function () {
    t.pass('end event')
  })
})
