var events = require('events')
var path = require('path')
var os = require('os')
var util = require('util')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var tape = require('tape')
var spawn = require('tape-spawn')

var testHarness = tape.createHarness()

testHarness.createStream({ objectMode: true }).on('data', function (row) {
  // console.log(JSON.stringify(row))
})

var STOP_WORD = {
  share: 'Added',
  download: 'Downloaded',
  connect: 'Connected'
}

module.exports = DatTest

function DatTest (dir) {
  if (!(this instanceof DatTest)) return new DatTest(dir)
  events.EventEmitter.call(this)
  this.dir = dir
  this.timers = {
    start: {
      all: null,
      share: null,
      download: null
    },
    end: {}
  }
  this.stats = {}
  this.link = null

  this.downloadDir = path.join(os.tmpdir(), path.dirname(dir), Date.now().toString())
  rimraf.sync(this.downloadDir)
  mkdirp.sync(this.downloadDir)
}

util.inherits(DatTest, events.EventEmitter)

DatTest.prototype.runTest = function (cb, t) {
  var self = this
  rimraf.sync(path.join(self.dir, '.dat')) // TODO: warn this will happen?

  if (t) return t.test(self, test)
  return testHarness(self, test)

  function test (t) {
    var start = self.timers.start
    var end = self.timers.end
    start.all = start.share = process.hrtime()
    self.emit('share')
    var share = spawn(t, 'dat ' + self.dir, {end: false})
    share.stderr.empty()
    share.stdout.match(function (output) {
      var match = output.indexOf(STOP_WORD.share) > -1
      if (!match) return false
      end.share = process.hrtime(start.share)
      self.link = output.match(/[A-Za-z0-9]{64}/)[0].trim()
      downloader()
      return true
    })

    function downloader () {
      start.download = start.connect = process.hrtime()
      self.emit('download')
      var download = spawn(t, 'dat ' + self.link + ' ' + self.downloadDir, {end: false})
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
        rimraf.sync(path.join(self.dir, '.dat'))
        rimraf(self.downloadDir, function () {
          self.emit('end')
          cb(null, end)
          t.end()
        })
      })
    }
  }
}
