#!/usr/bin/env node

var path = require('path')
var minimist = require('minimist')
var output = require('../lib/output')
var DatPerformance = require('..')

var args = minimist(process.argv.splice(2), {
  boolean: ['exit'],
  default: {
    exit: true
  }
})

args.dirs = args._

if (!args.dirs.length) {
  var moduleDir = path.dirname(require.resolve('..')) // Hacky. Don't want to have to include all the data to npm
  var datasets = path.join(moduleDir, 'test', 'datasets')
  args.dirs = [
    path.join(datasets, 'basic'),
    path.join(datasets, 'videos')
    // path.join(datasets, 'race_policing'),
    // path.join(datasets, 'xray')
  ]
}

var datTest = DatPerformance()

datTest.testDirs(args.dirs.slice(), function (err, results) {
  if (err) onerror(err)
  output(datTest.feed, args.dirs, function () {
    if (args.exit) {
      console.info('Results saved to hypercore: ', datTest.feed.key.toString('hex'))
      process.exit(0)
    }
  })
})

function onerror (err) {
  console.error(err.message)
  process.exit(1)
}
