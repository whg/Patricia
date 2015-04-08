// a basic Set class
// usage:
//   var s = new Set();
//   s.add(5);
function Set() {

    this._values = {};
    
    this.addcb = undefined;
    this.removecb = undefined;
    
    this.has = function(e) {
        // this is the fastest way to do this
        // http://jsperf.com/regex-vs-indexof-vs-in
        return this._values[e] !== undefined;
    };
    

    this.add = function(e) {
        if (!this.has(e)) {
            this._values[e] = e;
            if (this.addcb !== undefined) {
                this.addcb.call(this, e);
            }
            return true;
        }
        return false;
    };

    this.remove = function(e) {
        delete this._values[e];
        if (this.removecb !== undefined) {
            this.removecb.call(this, e);
        }
    };

    this.clear = function() {
        // is this._values = {} better?
        for (var key in this._values) {
            this.remove(key);
        }
        this._values = {};
    };

    this.keys = function() {
        return Object.keys(this._values);
    };

    this.values = function() {
        var r = [];
        for (var k in this._values) {
            r.push(this._values[k]);
        }
        return r;
    };

    this.items = function() {
        var temp = {};
        for (var key in this._values) {
            temp[key] = this._values[key];
        }
        return temp;
    };
    
    this.toString = function() {
        return "Set( " + this.keys().join(', ') + " )";
    };

}

function SetWithUniverse(universe) {
    // default universe is the database
    extend(this, new Set());


    this.exists = function(e) {
        return db[e] !== undefined;
    }

    this.add = function(e) {
        if (!this.has(e) && this.exists(e)) {
            this._values[e] = e;
            return true;
        }
        return false;
    };
    
}

