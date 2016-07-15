var path = require('path')
var os = require('os')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var tape = require('tape')
var spawn = require('tape-spawn')

var test = tape.createHarness()

test.createStream({ objectMode: true }).on('data', function (row) {
  // console.log(JSON.stringify(row))
})

var STOP_WORD = {
  share: 'Added',
  download: 'Downloaded',
  connect: 'Connected'
}

module.exports = datPerformance

function datPerformance (shareDir, cb, t) {
  rimraf.sync(path.join(shareDir, '.dat')) // TODO: warn this will happen?
  var downloadDir = path.join(os.tmpdir(), shareDir)
  rimraf.sync(downloadDir)
  mkdirp.sync(downloadDir)
  var start = {
    all: null,
    share: null,
    download: null
  }
  var end = {}
  var link

  function sharer (t) {
    start.all = start.share = process.hrtime()
    var share = spawn(t, 'dat ' + shareDir, {end: false})
    share.stderr.empty()
    share.stdout.match(function (output) {
      var match = output.indexOf(STOP_WORD.share) > -1
      if (!match) return false
      end.share = process.hrtime(start.share)
      link = output.match(/[A-Za-z0-9]{50}/)[0].trim()
      downloader()
      return true
    })

    function downloader () {
      start.download = start.connect = process.hrtime()
      var download = spawn(t, 'dat ' + link + ' ' + downloadDir, {end: false})
      download.stderr.empty()
      download.stdout.match(function (output) {
        if (!share) return false
        var connected = output.indexOf(STOP_WORD.connect) > -1
        if (connected) end.connect = process.hrtime(start.connect)
        var match = output.indexOf(STOP_WORD.download) > -1
        if (!match) return false
        end.download = process.hrtime(start.download)
        download.kill()
        share.kill()
        return true
      })
      download.end(function () {
        end.all = process.hrtime(start.all)
        rimraf(downloadDir, function () {
          cb(null, end)
          t.end()
        })
      })
    }
  }

  if (t) return t.test(shareDir, sharer)
  return test(shareDir, sharer)
}
