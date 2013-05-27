/*
 * Keep track of last value for each each metric and provive an HTTP Web API
 * to serve them.
 *
 * To enable this backend, include this in the backends
 * configuration array:
 *
 *   backends: ['/path-to-this-module/statsd-cache-backend.js']
 *
 * This backend supports the following config options:
 *
 * statsdCacheBackend: {
 *   "httpPort" : 8080,                  # The HTTP port of the web REST service
 *   "apiPrefix" : "/api",               # An URL prefix for the API
 *   "metricTypes" : 'gauges, counters', # The coma separated list of metrics to consider
 *   "filers" : [ "^dev\." ],            # A list of regexp for the metrics to handel
 *   "storeFile" : "cacheStore.json",    # The filename for persistency of this backend
 *   "storeRate" : 360                   # Save to file period (express in number of statsd flush period)
 * }
 */

var express = require('express');
var fs = require('fs');
require('./response.js');

var debug;
var flushInterval;
var myBackendPort;
var allStats = {};
var service;
var metricTypes = [];
var filters = [];
var apiPrefix;
var storeFile;
var storeRate = 0;
var flushesAfterStore = 0;

var trace = function() {
	if (debug) {
		var date = new Date();
		var stamp = date.getHours() + ':' + date.getMinutes() + ':'
		  + date.getSeconds() + '.' + date.getMilliseconds();
		console.log(stamp, arguments[0], arguments[1] || '',
				arguments[2] || '', arguments[3] || '',
				(arguments.length > 4 ? '...' : ''));
	}
};
exports.trace = trace;

var save_stats = function(callback) {
    var data = JSON.stringify(allStats);
    fs.writeFile(storeFile, data, function(err) {
        if (err) {
            console.error('statsd-cache-backend: save_stats error: ', err);
        }
        trace('statsd-cache-backend: save_stats: done');
        if (callback) {
            callback(err);
        }
    });
};
exports.save_stats = save_stats;

var load_stats = function(callback) {
    fs.readFile(storeFile, function(err, data) {
        var loaded = 0;
        if (err) {
            console.error('statsd-cache-backend: load_stats error: ', err);
        } else {
            trace('statsd-cache-backend: load_stats: merging (starting with ' + allStats.length + ' metrics');
            var loadedStats = JSON.parse(data);
            if (loadedStats) {
                for (var metric in loadedStats) {
                    // Add to current stats if not alread exists
                    if (! allStats[metric]) {
                        loaded++;
                        allStats[metric] = loadedStats[metric];
                    }
                }
            }
            trace('statsd-cache-backend: load_stats: done (' + allStats.length + ' metrics now');
            
        }
        if (callback) {
            callback(err, loaded);
        }
    });
};
exports.load_stats = load_stats;

var filter_metrics = function (metrics, type) {
	var filtered = {};
	var theMetrics = {};
	if (type === 'gauge') {
		theMetrics = metrics.gauges
	} else if (type === 'counter') {
		theMetrics = metrics.counters
	}
	for (var metric in theMetrics) {
		var keep_metric = false;
		if (filters.length >= 1) {
			  for (var i = 0; i < filters.length; i++) {
				  var re = new RegExp(filters[i]);
				  if (re.test(metric)) {
					  keep_metric = true;
					  break;
				  }
			  }
		} else {
			// No filter, so keep all metrics
			keep_metric = true;
		}
		if (keep_metric === true) {
			filtered[metric] = {
					'type': type,
					'value': theMetrics[metric]
				};
			if (type === 'counter') {
				// Add a rate property
				filtered[metric].rate = metrics.counter_rates[metric];
			}
		}
	}
	return filtered;
};

var sum_metrics = function (metrics_series) {
	var result = {};
	if (metricTypes.indexOf('gauges') < 0) {
		 // Gauges are not selected
		 return result;
	}
	// convert the metrics_series string to a regexp string
	var re_str = metrics_series.replace(/\./g, '\\.'); // Quote dots
	re_str = re_str.replace(/\*/g, '[^.]*'); // Replace wildcards
	re_str = '^' + re_str + '$'; // Anchore the regexp
	//trace('statsd-cache-backend: sum_metrics: ' + metrics_series + ' -> ' + re_str);
	var re = new RegExp(re_str);
	var sum = 0,
	    count = 0;
	var min = Number.MAX_VALUE,
	    max = Number.MIN_VALUE;
	for (var metric in allStats) {
		if (re.test(metric)) {
			if (allStats[metric].type !== 'gauge') {
				trace('statsd-cache-backend: sum_metrics: ' + metric + 'is not a gauge !');
				continue;
			}
			//console.log('sum_metrics: ' + metric + ' added');
			var value = allStats[metric].value;
			min = Math.min(min, value);
			max = Math.max(max, value);
			sum += value;
		    count++;
		}
	}
	 
	if (count > 0) {
		result[metrics_series] = {
				 'sum' : sum,
				 'min' : min,
				 'max' : max,
				 'avg' : sum / count,
				 'count' : count
		};
	}
	return result;
};

var flush_stats = function (ts, metrics) {
	trace('statsd-cache-backend: flush:');
	allStats.lastFlush = {
			'ts' : ts,
			'date' : new Date(ts * 1000).toLocaleString()
	};
	if (metricTypes.indexOf('gauges') >= 0) {
		filtered = filter_metrics(metrics, 'gauge');
		for (var metric in filtered) {
			allStats[metric] = filtered[metric];
		}
	}
	if (metricTypes.indexOf('counters') >= 0) {
		filtered = filter_metrics(metrics, 'counter');
		for (var metric in filtered) {
			allStats[metric] = filtered[metric];
		}
	}
	if (storeRate != 0) {
	   if (flushesAfterStore++ >= storeRate) {
	       flushesAfterStore = 0;
	       save_stats();
	   }
	}
};

var backend_status = function (writeCb) {
	trace('statsd-cache-backend: status:');
	for (var metric in allStats) {
		writeCb(null, 'statsd-cache-backend', metric, JSON.stringify(allStats[metric]));
	}
};

exports.init = function (startup_time, config, events) {
	debug = config.debug;
	config.statsdCacheBackend = config.statsdCacheBackend || {};
	myBackendPort = config.statsdCacheBackend.httpPort || 8080;
	var strTypes = config.statsdCacheBackend.metricTypes || 'gauges';
	apiPrefix = config.statsdCacheBackend.apiPrefix || '/api';
	metricTypes = strTypes.split(/\s*,\s*/g);
	filters = config.statsdCacheBackend.filters || [];
	storeRate = config.statsdCacheBackend.storeRate || 0;
	flushesAfterStore = 0;
	storeFile = config.statsdCacheBackend.storeFile || __dirname + '/cacheStore.json';
	flushInterval = config.flushInterval;
	// Load stats from persistency file (if any)
	load_stats();
	
	service = express();
  
	service.get(apiPrefix + '/v1/metrics', function (req, res) {
		res.respond(allStats, 200);
	});
  
	service.get(apiPrefix + '/v1/metric/:metric', function (req, res) {
		var metric = req.param('metric');
		if (! allStats[metric]) {
			res.respond('metric: ' + metric + ' not found', 404);
		} else {
			var result = {};
			result[metric] = allStats[metric];
			res.respond(result, 200);
		}
	});
  
	service.get(apiPrefix + '/v1/sum/:metric', function (req, res) {
		var metric = req.param('metric');
		var result = sum_metrics(metric);
		res.respond(result, 200);
	});
  
	trace('statsd-cache-backend: init: Runnint HTTP server on port ' + myBackendPort);
	service.listen(myBackendPort);
	
	if (events) {
        events.on('flush', flush_stats);
        events.on('status', backend_status);
  	}

  	return true;
};