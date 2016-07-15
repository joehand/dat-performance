var fs = require('fs')
var path = require('path')
var datTest = require('./lib/dat-test')

var datasets = path.join(__dirname, 'test', 'datasets')

testDir(path.join(datasets, 'basic'))

function testDir(dir, next) {
  console.info('Starting', dir)
  datTest(dir, function (err, timers) {
    if (err) onerror(err)
    console.info('\nResults')
    console.info('Share time: %ds %dms', timers.share[0], timers.share[1] / 1000000)
    console.info('Download time: %ds %dms', timers.download[0], timers.download[1] / 1000000)
    console.info('Total time: %ds %dms', timers.all[0], timers.all[1] / 1000000)
    console.info('\n\n')
    if (next) next()
  })
}

function onerror (err) {
  console.error(err.message)
  process.exit(1)
}