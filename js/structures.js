var Index = paper.Point;

Index.prototype.toString = function() {
    return zeropad(this.x, 2) + "," + zeropad(this.y, 2);
}

function Triple(nOrTripleOrData, p, h) {

    if (p !== undefined && h !== undefined){
        this.n = nOrTripleOrData;
        this.p = p;
        this.h = h;
    }
    else if (nOrTripleOrData.n !== undefined) {
        this.n = nOrTripleOrData.n;
        this.p = nOrTripleOrData.p;
        this.h = nOrTripleOrData.h;
    }
    else if (nOrTripleOrData.charAt !== undefined){
        var parts = nOrTripleOrData.split(",");
        this.n = parseInt(parts[0]);
        this.p = parseInt(parts[1]);
        this.h = parseInt(parts[2]);
    }
    else {
        throw "Unable to construct Triple with " + nOrTripleData + " as first arg";
    }

    this.clone = function() {
        return new Triple(this.n, this.p, this.h);
    };

    this.sum = function() {
        return this.n + this.p + this.h;
    };

    this.map = function(cb) {
        return new Triple(cb(this.n), cb(this.p), cb(this.h));
    };

    this.subtract = function(triple, inplace) {
        if (!inplace) {
            return new Triple(this.n - triple.n, this.p - triple.p, this.h - triple.h);
        }
        this.n -= triple.n;
        this.p -= triple.p;
        this.h -= triple.h;
        return this;
    };

    this.add = function(triple, inplace) {
        if (!inplace) {
            return new Triple(this.n + triple.n, this.p + triple.p, this.h + triple.h);
        }
        this.n += triple.n;
        this.p += triple.p;
        this.h += triple.h;
        return this;
    };
    
    this.inverse = function() {
        return new Triple(-this.n, -this.p, -this.h);
    };
    
    this.toString = function() {
        return this.n + "," + this.p + "," + this.h;
    };
}



function Edge(start, end, typeVal) {
    this.start = start;
    this.end = end;
    this.line = {
        type: typeVal[0],
        val: typeVal[1]
    };
    
    //create an id where the start and the end doesn't matter
    this.getId = function () {
        var id = this.start.id + "-" + this.end.id;
        return sorted(id.split('-')).join('-');
    }

    this.clone = function() {
        return new Edge(this.start, this.end, [this.line.type, this.line.val]);
    }

    this.toString = function() {
        return this.getId();
    }

}

var things = [Index, Triple, Edge];
for(var i = 0; i < things.length; i++) {
    Object.defineProperty(things[i].prototype, "id", {
        get: function id() {
            return this.toString();
        },
        configurable: true,
    });
}

function IndexLine(startIndex, endIndex) {
    this.start = startIndex;
    this.end = endIndex;
}

function Line(m, c) {

    this.m = m;
    this.c = c;

    this.pointAtX = function(x) {
        // y = mx + c
        return new Point(x, this.m * x + c);
    };

    this.pointAtY = function(y) {
        // x = (y - c) / m
        return new Point((y - this.c) / this.m, y);
    };

}

function RingBuffer(size, banConsecutive) {

    this.size = size;
    this.values = new Array(size);
    this.pos = 0;


    this.pushBasic = function(v) {
        this.values[this.pos] = v;
        this.pos++;
        this.pos%= this.size;
        return true;
    };
    
    this.pushNoConsecutive = function(v) {
        if (v == this.peek()) {
            return false;
        }
        return this.pushBasic(v);
    };
    
    if (banConsecutive) {
        this.push = this.pushNoConsecutive;
    }
    else {
        this.push = this.pushBasic;
    }

    this.peek = function() {
        var i = (this.pos - 1 + this.size) % this.size;
        return this.values[i];
    };
    
    this.pop = function() {   
        if (this.pos == 0) {
            this.pos+= this.size;
        }
        this.pos--;
        var ret = this.values[this.pos];
        this.values[this.pos] = undefined;
        return ret;
    };
}
