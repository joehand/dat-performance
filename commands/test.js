var path = require('path')
var graph = require('../lib/graph')
var DatPerformance = require('..')

module.exports = function (args) {
  if (args.dir) args.dir = [args.dir]
  else {
    var moduleDir = path.dirname(require.resolve('..')) // Hacky. Don't want to have to include all the data to npm
    var datasets = path.join(moduleDir, 'test', 'datasets')
    args.dir = [
      path.join(datasets, 'basic'),
      // path.join(datasets, 'videos')
      // path.join(datasets, 'race_policing'),
      // path.join(datasets, 'xray')
    ]
  }

  var datTest = DatPerformance()

  // copy dirs w/ slice so we can graph later
  datTest.test(args.dir.slice(), function (err, results) {
    if (err) onerror(err)
    if (!args.graph) return done()
    graph(datTest.feed, args.dir, done)

    function done() {
      console.info('Results saved to hypercore: ', datTest.feed.key.toString('hex'))
      process.exit(0)
    }
  })

  function onerror (err) {
    console.error(err.message)
    process.exit(1)
  }
}
