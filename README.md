# Cache backend for StatsD [![Build Status](https://travis-ci.org/Ericbla/statsd-cache-backend.png?branch=master)](https://travis-ci.org/Ericbla/statsd-cache-backend)

## Overview ##
This is a pluggable backend for [StatsD](https://github.com/etsy/statsd), which
brings a thin persistency layer to statsd and exposes cached metrics through a Web API.

## Description ##
**TBD**

## Installation ##

    git clone https://github.com/Ericbla/statsd-cache-backend.git
    cd statsd-cache-backend
    npm install
    npm test


## Configuration ##
Configure the statsd config.js file:

  * Add this backend to backends list
```
"backends": ["/path-to-this-module/statsd-cache-backend.js"],
```

  * This backend supports the following config options:
```
statsdCacheBackend: {
    "httpPort" : 8080,                  # The HTTP port of the web REST service
    "apiPrefix" : "/api",               # An URL prefix for the API
    "metricTypes" : 'gauges, counters', # The coma separated list of metrics to consider
    "filers" : [ "^dev\." ],            # A list of regexp for the metrics to handel
    "storeFile" : "cacheStore.json",    # The filename for persistency of this backend
    "storeRate" : 360,                  # Save to file period (express in number of statsd flush period)
    "ttl" : 0                           # The Time To Live in the cache (withoutout refresh) in seconds (0 for infinite)
},
```

## API ##
  * GET /api/v1/metrics
    * Get all metrics
  * DELETE /api/v1/metrics
    * Delete all metrics
  * GET /api/v1/metrics/{metrics-regex-pattern}
    * Get all metrics matching the specified pattern
  * DELETE /api/v1/metrics/{metrics-regex-pattern}
    * Delete all metrics matching the specified pattern
  * GET /api/vi/metric/{metric-id}
    * Get a specific metric
  * DELETE /api/v1/metric/{metric-id}
    * Delete a specific metric
  * GET /api/v1/sum/{metrics-set-pattern}
    * Sum metrics values (only gauges are supported) of a set of metrics specified with simple pattern. Pattern is not a regex but support the * (star) character as a wildcard for any character other than **.** (dot)
  

## Dependencies ##
- [express](http://expressjs.com/)

## Development ##
- [Bugs](https://github.com/Ericbla/statsd-cache-backend/issues)

