#!/usr/bin/env node

var minimist = require('minimist')

var args = minimist(process.argv.splice(2), {
  boolean: ['graph'],
  default: {
    graph: true
  }
})

if (args._[0] === 'share') require('../commands/share')(args)
else if (!args._[0]) require('../commands/test')(args)
else {
  console.error('Usage')
  console.error('dat-performance                 run default tests')
  console.error('dat-performance -dir=data/      run test on directory')
  console.error('dat-performance share           share test results in feed')
  process.exit(1)
}
