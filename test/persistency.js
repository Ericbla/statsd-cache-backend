/**
 * New node file
 */


var vows = require('vows');
var assert = require('assert');
var fs = require('fs');
var mybackend = require('../statsd-cache-backend.js');


vows.describe('Test persistency:').addBatch({
    'Init backend with NO config and NO stats': {
        topic: function () {
            mybackend.init("", {}, null, this.callback);
        },
		'ok' : function () {
			
		}
    }   
}).addBatch({
    'we can save stats on default store': {
        topic : function () {
            mybackend.save_stats(this.callback);
        },
        'with no error' : function (err) {
            assert.isUndefined(err);
        },
        'with store file created' : function(err) {
            assert.isNotNull(fs.statSync('cacheStore.json'));
        }
    },
	'we can load stats from default store': {
        topic : function () {
			mybackend.clear_stats();
            mybackend.load_stats(this.callback);
        },
        'with no error' : function (err, loaded) {
            assert.isNull(err, 'load no error');
			assert.isDefined(loaded, 'loaded count');
       },
        'with no metric' : function(err, loaded) {
            assert.equal(loaded, 0);
        }
    }
}).addBatch({
    'stopping backend': {
        topic: function () {
            mybackend.shutdown(this.callback);
        },
		'ok' : function () {
			
		}
    }   
})

.export(module); // Export the Suite

