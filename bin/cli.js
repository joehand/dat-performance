#!/usr/bin/env node

var datTest = require('../lib/dat-test')

var dir = process.argv[2]
if (!dir) {
  console.error('Directory required')
  process.exit(1)
}

datTest(dir, function (err, timers) {
  if (err) {
    console.error(err.message)
    process.exit(1)
  }
  console.info('Share time: %ds %dms', timers.share[0], timers.share[1] / 1000000)
  console.info('Download time: %ds %dms', timers.download[0], timers.download[1] / 1000000)
  console.info('Total time: %ds %dms', timers.all[0], timers.all[1] / 1000000)
})
