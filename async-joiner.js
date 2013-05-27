/*
 * AsyncJoiner is a simple object that can fire a callback when
 * its done() function as been called a configured number of times
 */


var AsyncJoiner = function(count, callback, args, context) {
    this.count = count || 1;
    this.done_count = 0;
    this.cb = callback;
	this.context = context || this;
	this.args = args || [];
};

AsyncJoiner.prototype.done = function() {
	this.done_count++;
    if (this.done_count >= this.count) {
        if (this.cb && typeof this.cb == 'function') {
            this.cb.apply(this.context, this.args);
        }
    }
};

exports.AsyncJoiner = AsyncJoiner;
