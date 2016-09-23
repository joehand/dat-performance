var events = require('events')
var fs = require('fs')
var path = require('path')
var util = require('util')
var differ = require('ansi-diff-stream')
var level = require('level-party')
var hypercore = require('hypercore')
var swarm = require('hyperdrive-archive-swarm')
var prettyHrtime = require('pretty-hrtime')
var home = require('os-homedir')
var ora = require('ora')
var prettyJSON = require('prettyjson')
var prettyBytes = require('pretty-bytes')
var prettyMs = require('pretty-ms')
var DatTest = require('./lib/dat-test')

module.exports = DatPerformance

function DatPerformance () {
  if (!(this instanceof DatPerformance)) return new DatPerformance()
  var self = this
  events.EventEmitter.call(this)
  self.db = level(path.join(home(), '.datperformance.db'))
  self.core = hypercore(self.db)
}

util.inherits(DatPerformance, events.EventEmitter)

DatPerformance.prototype._getFeed = function (cb) {
  var self = this
  self.db.get('!datperformance!!key!', {valueEncoding: 'binary'}, function (_, key) {
    self.feed = self.core.createFeed(key)
    self.key = self.feed.key
    self.db.put('!datperformance!!key!', self.feed.key)
    cb()
  })
}

DatPerformance.prototype.test = function (dirs, cb) {
  if (!dirs) throw new Error('Please specify directories to test')
  if (typeof dirs === 'string') dirs = [dirs]
  var self = this
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

  self._getFeed(run)

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
      self.feed.append(JSON.stringify(result), function (err) {
        if (err) return cb(err)
        results.push(result)
        next()
      })
    })
  }

  function testDir (dir, cb) {
    dir = path.resolve(dir)
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

    datTest.runTest(function (err, result) {
      if (err) cb(err)
      timers.test = null
      lines[lines.length - 1] = ''

      lines.push('Results',prettyResult(result))
      lines.push('')
      cb(null, result)
    })
  }

  function prettyResult (result) {
    var out = Object.assign({}, result)
    out.size.bytes = prettyBytes(out.size.bytes)
    out.share_time = prettyMs(out.share_time)
    out.connect_time = prettyMs(out.connect_time)
    out.download_time = prettyMs(out.download_time)
    out.total_time = prettyMs(out.total_time)
    return prettyJSON.render(out)
  }
}

DatPerformance.prototype.share = function (opts, cb) {
  if (typeof opts === 'function') return this.share(null, opts)
  var self = this

  self._getFeed(function (err) {
    if (err) return cb(err)
    var sw = swarm(self.feed, opts)
    console.log('sharing dat performance feed:',self.feed.key.toString('hex'))
    sw.on('connection', function () {
      // console.log('connection')
    })
  })
}
