var fs = require('fs')
var differ = require('ansi-diff-stream')
var prettyHrtime = require('pretty-hrtime')
var ora = require('ora')
var DatTest = require('./lib/dat-test')

module.exports = testDirs

function testDirs (dirs, cb) {
  var diff = differ()
  var lines = []
  var testNum = dirs.length
  var spinner = ora({text: 'Running'})
  var msg = {
    top: 'Starting ',
    test: null
  }
  var timers = {
    total: process.hrtime(),
    test: null
  }
  var results = []
  var printInterval = null

  run()

  function run () {
    msg.top = 'Running ' + testNum + ' tests'
    printInterval = setInterval(function () {
      diff.write(print())
    }, 200)
    diff.pipe(process.stdout)
    next()
    spinner.start()
  }

  function print () {
    lines[0] = msg.top
    lines[1] = 'Elapsed time: ' + prettyHrtime(process.hrtime(timers.total)) + '\n'
    if (timers.test) {
      lines[lines.length - 1] = '\n' + msg.test + '\n'
      lines[lines.length - 1] += 'Test duration: ' + prettyHrtime(process.hrtime(timers.test))
    }
    return lines.join('\n')
  }

  function done () {
    clearInterval(printInterval)
    msg.top = 'Finished ' + testNum + ' tests'
    diff.write(print())
    // spinner.color = 'green'
    // spinner.text = 'Serving'
    spinner.stop()
    cb(null, results)
  }

  function next () {
    var dir = dirs.shift()
    if (!dir) return done()

    try {
      fs.statSync(dir).isDirectory()
    } catch (e) {
      return cb('Directory does not exist: ', dir)
    }
    testDir(dir, function (err, result) {
      if (err) return cb(err)
      results.push(result)
      next()
    })
  }

  function testDir (dir, cb) {
    var datTest = DatTest(dir)
    timers.test = process.hrtime()
    msg.test = 'Testing ' + dir

    datTest.once('share', function () {
      spinner.text = 'Sharing'
    })

    datTest.once('download', function () {
      spinner.text = 'Downloading'
    })

    datTest.once('end', function () {
      spinner.text = 'Done'
    })

    datTest.runTest(function (err) {
      if (err) cb(err)
      var end = datTest.timers.end
      timers.test = null
      lines[lines.length - 1] = ''
      lines.push('Results ' + dir)
      lines.push('Share time: ' + prettyHrtime(end.share))
      lines.push('Download time: ' + prettyHrtime(end.download))
      lines.push('Total time: ' + prettyHrtime(end.all))
      lines.push('')
      lines.push('')
      cb(null, jsonResults(dir, end))
    })
  }

  function jsonResults (folder, timers) {
    var out = {
      folder: folder,
      share_time: toMiliSec(timers.share),
      download_time: toMiliSec(timers.download),
      total_time: toMiliSec(timers.all),
      date: new Date()
    }

    return JSON.stringify(out)

    function toMiliSec (hrArray) {
      return (hrArray[0] * 1000000 + hrArray[1] / 1000) / 1000
    }
  }
}
