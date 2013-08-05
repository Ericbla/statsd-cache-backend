var apieasy = require('api-easy');
var assert = require('assert');
var suite = apieasy.describe('Test API:');
var mybackend = require('../statsd-cache-backend.js');

var init_backend = function() {
	return {
		'Init backend with NO config and NO stats': {
			topic: function () {
				mybackend.init("", {}, null, this.callback);
			},
			'ok' : function () {
			
			}
		}
	};
};

var shutdown_backend = function() {
	return {
		'Shutdown backend': {
			topic: function () {
				mybackend.shutdown(this.callback);
			},
			'ok' : function () {
			
			}
		}
	};
};
 
suite.use('localhost', 123456)
.setHeader('Accept', 'application/json')
.addBatch(init_backend())
.next()
.discuss('When searching all metrics')
.get('/api/v1/metrics')
.expect(200, 'should return an empty response', function (err, res, body) {
		var obj;
		assert.doesNotThrow(function() { obj = JSON.parse(body) }, SyntaxError, 'must be vaild JSON');
		assert.isObject(obj, 'must be an object');
		assert.equal(Object.getOwnPropertyNames(obj).length, 0, 'must be empty');
		
	})
.undiscuss()
.discuss('When searching a set of metrics')
.get('/api/v1/metrics/toto.*')
.expect(200, 'should return an empty response', function (err, res, body) {
		var obj;
		assert.doesNotThrow(function() { obj = JSON.parse(body) }, SyntaxError, 'must be vaild JSON');
		assert.isObject(obj, 'must be an object');
		assert.equal(Object.getOwnPropertyNames(obj).length, 0, 'must be empty');
	})
.get('/api/v1/metrics/.*')
.expect(200, 'should return an empty response', function (err, res, body) {
		var obj;
		assert.doesNotThrow(function() { obj = JSON.parse(body) }, SyntaxError, 'must be vaild JSON');
		assert.isObject(obj, 'must be an object');
		assert.equal(Object.getOwnPropertyNames(obj).length, 0, 'must be empty');
	})
.addBatch(shutdown_backend())
   
// Export tests for Vows
.export(module);
