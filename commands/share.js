var DatPerformance = require('..')

module.exports = function (args) {
  if (args.webrtc) {
    try {
      args.webrtc = require('electron-webrtc')()
    } catch (e) { console.error('npm install electron-webrtc to use webrtc option')}
  }
  DatPerformance(args.webrtc).share({webrtc: args.webrtc}, onerror)

  function onerror (err) {
    console.error(err.message)
    process.exit(1)
  }
}
