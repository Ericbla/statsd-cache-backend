# Cache backend for StatsD

## Overview
This is a pluggable backend for [StatsD](https://github.com/etsy/statsd), which
brings a thin persistency layer to statsd and exposes cached metrics through a Web API.

## Description
TBD

## Installation

    git clone https://github.com/Ericbla/statsd-cache-backend.git
    cd statsd-cache-backend
    npm install
    npm test


## Configuration
Configure the statsd config.js file:
  * Add this backend to backends list
```
backends: ['/path-to-this-module/statsd-cache-backend.js']
```

  * This backend supports the following config options:
```
statsdCacheBackend: {
    "httpPort" : 8080,                  # The HTTP port of the web REST service
    "apiPrefix" : "/api",               # An URL prefix for the API
    "metricTypes" : 'gauges, counters', # The coma separated list of metrics to consider
    "filers" : [ "^dev\." ],            # A list of regexp for the metrics to handel
    "storeFile" : "cacheStore.json",    # The filename for persistency of this backend
    "storeRate" : 360                   # Save to file period (express in number of statsd flush period)
}
```


## Dependencies
- [express](http://expressjs.com/)

## Development
- [Bugs](https://github.com/Ericbla/statsd-cache-backend/issues)

