var sparkly = require('sparkly')
var pump = require('pump')
var through = require('through2')

module.exports = function (feed, results, cb) {
  var data = {}
  var max = {}
  var min = {}
  var src = feed.createReadStream({live: false})
  pump(src, through.obj(function (chunk, enc, cb) {
    chunk = JSON.parse(chunk.toString())
    if (!data[chunk.folder]) {
      data[chunk.folder] = {
        share: [],
        download: [],
        total: []
      }
    }
    if (chunk.total_time > max[chunk.folder]) max[chunk.folder] = chunk.total_time
    if (chunk.share_time < min[chunk.folder]) min[chunk.folder] = chunk.share_time
    data[chunk.folder].share.push(chunk.share_time)
    data[chunk.folder].download.push(chunk.download_time)
    data[chunk.folder].total.push(chunk.total_time)
    cb(null)
  }), function () {
    Object.keys(data).forEach(function (key) {
      if (results.join(' ').indexOf(key) === -1) return
      var times = data[key]
      console.log('\n', key, '\n')
      var total = sparkly(times.total.slice(Math.max(times.total.length - 50, 1)))
      var share = sparkly(times.share.slice(Math.max(times.share.length - 50, 1)))
      var download = sparkly(times.download.slice(Math.max(times.download.length - 50, 1)))
      console.log('Total', total)
      console.log('Share', share)
      console.log('Down ', download, '\n')
    })
    cb()
  })
}

