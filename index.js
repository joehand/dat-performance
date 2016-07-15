var fs = require('fs')
var path = require('path')
var differ = require('ansi-diff-stream')
var prettyHrtime = require('pretty-hrtime')
var ora = require('ora')
var datTest = require('./lib/dat-test')

var diff = differ()
var datasets = path.join(__dirname, 'test', 'datasets')

testDir(path.join(datasets, 'basic'))

function testDir(dir, next) {
  var lines = []
  var msg = 'Starting '
  var start = process.hrtime()
  var spinner = ora({text: 'Running'})

  setInterval(function () {
    diff.write(print())
  }, 200)
  diff.pipe(process.stdout)
  spinner.start()

  function print () {
    lines[0] = msg + dir
    lines[1] = 'Elapsed time: ' + prettyHrtime(process.hrtime(start)) + '\n'
    return lines.join('\n')
  }

  datTest(dir, function (err, timers) {
    if (err) onerror(err)
    lines[0] = 'Results ' + dir
    lines.push('Share time: ' + prettyHrtime(timers.share))
    lines.push('Download time: ' + prettyHrtime(timers.download))
    lines.push('Total time: ' + prettyHrtime(timers.all) + '\n')
    if (next) next()
    else {
      diff.write(lines.join('\n'))
      console.log(jsonResults(dir, timers))
      process.exit(0)
    }
  })
}

function jsonResults (folder, timers) {
  var out = {
    folder: folder,
    results: {
      share: toMiliSec(timers.share),
      download: toMiliSec(timers.download),
      total: toMiliSec(timers.all)
    }
  }

  return JSON.stringify(out)

  function toMiliSec (hrArray) {
    return (hrArray[0] * 1000000 + hrArray[1] / 1000) / 1000
  }
}

function onerror (err) {
  console.error(err.message)
  process.exit(1)
}