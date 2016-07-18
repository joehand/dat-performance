#!/usr/bin/env node

var path = require('path')
var level = require('level')
var home = require('os-homedir')
var hypercore = require('hypercore')
var swarm = require('hyperdrive-archive-swarm')
var minimist = require('minimist')
var output = require('../lib/output')
var datTest = require('..')

var args = minimist(process.argv.splice(2), {
  boolean: ['exit'],
  default: {
    exit: true
  }
})
args.dirs = args._

var db = level(path.join(home(), '.datperformance.db'))
var core = hypercore(db)

if (!args.dirs.length) {
  var moduleDir = path.dirname(require.resolve('..')) // Hacky. Don't want to have to include all the data to npm
  var datasets = path.join(moduleDir, 'test', 'datasets')
  args.dirs = [
    path.join(datasets, 'basic')
    // path.join(datasets, 'videos'),
    // path.join(datasets, 'race_policing'),
    // path.join(datasets, 'xray')
  ]
}

datTest(args.dirs.slice(), function (err, results) {
  if (err) onerror(err)
  db.get('!datperformance!!key!', {valueEncoding: 'binary'}, function (_, key) {
    var feed = core.createFeed(key)
    feed.open(function () {
      results.forEach(function (result) {
        feed.append(result)
      })
    })
    db.put('!datperformance!!key!', feed.key)
    output(feed, args.dirs, function () {
      if (args.exit) {
        console.info('Results saved to hypercore: ', feed.key.toString('hex'))
        process.exit(0)
      }

      var sw = swarm(feed)
      console.info('Waiting for connections:', feed.key.toString('hex'))
      sw.on('connection', function (peer, type) {
        console.log('connected to', sw.connections, 'peers')
        peer.on('close', function () {
          console.log('peer disconnected')
        })
      })
    })
  })
})

function onerror (err) {
  console.error(err.message)
  process.exit(1)
}
