var events = require('events')
var path = require('path')
var os = require('os')
var util = require('util')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var Dat = require('dat-js')
var hdVer = require('hyperdrive/package.json').version
var datVer = require('dat-js/package.json').version
var hdSVer = require('hyperdrive-archive-swarm/package.json').version

module.exports = DatTest

function DatTest (dir) {
  if (!(this instanceof DatTest)) return new DatTest(dir)
  events.EventEmitter.call(this)
  var self = this
  self.dir = dir
  self.timers = {
    start: {
      all: null,
      share: null,
      download: null
    },
    end: {}
  }
  self.stats = {}
  self.link = null
  Object.defineProperty(self, 'result', { get: self._result })

  self.downloadDir = path.join(os.tmpdir(), path.dirname(dir), Date.now().toString())
  rimraf.sync(self.downloadDir)
  mkdirp.sync(self.downloadDir)
}

util.inherits(DatTest, events.EventEmitter)

DatTest.prototype.runTest = function (cb, t) {
  var self = this
  rimraf.sync(path.join(self.dir, '.dat')) // TODO: warn this will happen?

  var start = self.timers.start
  var end = self.timers.end
  start.all = process.hrtime()

  self._share(function (err) {
    if (err) return cb(err)
    self._download(function (err) {
      if (err) return cb(err)

      end.all = process.hrtime(start.all)
      self.dat.close(function () {
        rimraf.sync(path.join(self.dir, '.dat'))
        rimraf.sync(self.downloadDir)
        self.emit('end')
        cb(null, self.result)
      })
    })
  })
}

DatTest.prototype._result = function () {
  var self = this
  var out = {
    versions: {
      dat: datVer,
      hyperdrive: hdVer,
      'hyperdrive-archive-swarm': hdSVer,
    },
    size: {
      files: self.dat ? self.dat.stats.filesTotal : null,
      bytes: self.dat ? self.dat.stats.bytesTotal : null
    },
    folder: self.dir,
    share_time: toMiliSec(self.timers.end.share),
    connect_time: toMiliSec(self.timers.end.connect),
    download_time: toMiliSec(self.timers.end.download),
    total_time: toMiliSec(self.timers.end.all),
    date: new Date()
  }

  return out

  function toMiliSec (hrArray) {
    return (hrArray[0] * 1000000 + hrArray[1] / 1000) / 1000
  }
}

DatTest.prototype._share = function (cb) {
  var self = this
  var start = self.timers.start
  var end = self.timers.end

  self.emit('share')
  start.share = process.hrtime()

  var dat = self.dat = Dat({dir: self.dir, watchFiles: false})
  dat.share(function (err) {
    if (err) return cb(err)
    self.link = dat.archive.key.toString('hex')
    end.share = process.hrtime(start.share)
    cb()
  })
}

DatTest.prototype._download = function (cb) {
  var self = this
  var start = self.timers.start
  var end = self.timers.end

  self.emit('download')
  start.download = start.connect = process.hrtime()

  var dat = Dat({dir: self.downloadDir, key: self.link})
  dat.download(function (err) {
    if (err) return cb(err)
  })
  dat.once('swarm-update', function () {
    end.connect = process.hrtime(start.connect)
  })
  dat.once('download-finished', function () {
    end.download = process.hrtime(start.download)
    dat.close(function () {
      cb()
    })
  })
}
