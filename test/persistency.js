/**
 * New node file
 */


var vows = require('vows');
var assert = require('assert');
var fs = require('fs');
var mybackend = require('../statsd-cache-backend');


// Create a Test Suite
vows.describe('Persistency').addBatch({
    'once the module is initialized': {
        topic: function () {
            mybackend.init("", {}, null);
        },
        'we can save state': {
            topic : function () {
                mybackend.save_stats(this.callback);
            },
            'with no error' : function (err) {
                assert.isNull(err);
            },
            'with store file created' : function(err) {
                assert.isNotNull(fs.fsStatSync('../cacheStore.json'));
            }
        }
    }
    
}).export(module); // Export the Suite

