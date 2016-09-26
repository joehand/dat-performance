# Dat Performance

Measure sharing and download time for Dat performance.

## Install

```
npm install dat-perfomance -g
```

## Usage

* `dat-performance`: runs default tests
* `dat-performance --dir=<directory>`: runs performance tests on the specified directory.
* `dat-performance share`: share your dat performance results feed.

### Options

* `--graph`: show results graph when done with tests.

Results are saved to a local database in `~/.datperformance.db` with the directory information, results, and module versions:

```
Results
versions:
  dat:                      3.5.1
  hyperdrive:               7.6.0
  hyperdrive-archive-swarm: 4.1.4
size:
  files: 6
  bytes: 2.08 MB
folder:        /Users/joe/node_modules/dat-perfmon/test/datasets/basic
share_time:    125ms
connect_time:  30ms
download_time: 298ms
total_time:    1.1s
date:          Mon Sep 26 2016 11:10:17 GMT-0700 (PDT)
```

## API


## License

MIT
