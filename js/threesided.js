
paper.install(window);
paper.setup(document.getElementById("canvas")); 

var sqrt3 = Math.sqrt(3);
var HOST = "http://localhost:5000";

var Index = Point;

function zeropad(number, length) {
    var s = String(number);
    var npad = Math.max(0, length - s.length + 1);
    return Array(npad).join("0") + s;
}

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


function sorted(a) { 
    var b = a.slice(0); 
    return b.sort(); 
}

function extend(subclass, superclass) {
    for (var key in superclass) {
        subclass[key] = superclass[key];
    }
    return subclass;
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}


function mergeObjects() {
    var r = {};
    for (var ak in arguments) {
        var obj = arguments[ak];
        for (var key in obj) {
            r[key] = obj[key];
        }
    }
    return r;
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

function lineAtPointWithAngle(point, angle) {
    var m = gradientFromAngle(angle);
    return Line(m, point.y - m * point.x);
}

var toRad = 0.0174532925199;

function gradientFromAngle(angle) {
    return Math.tan(angle * toRad);
}

function linesForShape(angle, spacing, shape) {
    // build lines at normal to line created from angle
    // we create a vector that starts at either the top right
    // or bottom right with an angle of `angle`
    // we step along this vector by `spacing`, drawing lines that
    // are perpendicular to it
    // all lines are the diagonal of the bounds of `shape`

    angle %= 180;

    var rect = shape.bounds;
    
    var start = rect.topLeft;
    var oppositeCorner = rect.bottomRight;
    
    if (angle > 90) {
        start = rect.bottomLeft;
        oppositeCorner = rect.topRight;       
    }


    var toCorner = oppositeCorner.subtract(start);
    var dir = new Point(Math.sin(angle * toRad), Math.cos(angle * toRad));
    var angleBetween = dir.getAngleInRadians(toCorner);
    var dirLength = toCorner.length * Math.cos(angleBetween);
    var lineSide = dir.multiply(toCorner.length);

    var lines = [];
    for (var i = spacing; i < dirLength; i+= spacing) {
        var d = dir.multiply(i);
        var point = start.add(d);
        var out = point.add(lineSide); 
        var q1 = out.rotate(90, point);
        var q2 = out.rotate(-90, point);
        lines.push(new Path.Line(q1, q2));

    }

    return lines;
}


function joinedHatchLinesForShape(angle, spacing, shape) {
    // hatch lines where the ends continue and draw part of the contour

    var lines = linesForShape(angle, spacing, shape);
    var points = [];

    for (var i = 0; i < lines.length; i++) {
        var intersections = shape.getIntersections(lines[i]);
        if (intersections.length === 0) {
            continue;
        }
        intersections = intersections.map(function(e) {
            return e.point;
        }).sort(function(a, b) {
            return a.y < b.y;
        });

        if (i % 2 == 1) {
            intersections.reverse();
        }
        points.push(intersections);
    }

    lines.forEach(function(l) {
        l.remove();
    });
    lines = []
    
    for (var i = 0; i < points.length; i++) {
        var j = 0
        for (; j < points[i].length-1; j+=2) {
            lines.push(new Path.Line(points[i][j], points[i][j+1]));
        }
        if (i < points.length-1) {
            var p1 = points[i][j-1];
            var p2 = points[i+1][0];

            if (p2.subtract(p1).length < alt) {
                lines.push(new Path.Line(p1, p2));                
            }
        }
        
    }
 
    return lines;
}

function hatchLinesForShape(angle, spacing, shape) {
    // your standard hatching
    // the lines are drawing in alternating order,
    // so the plotter doesn't waste time

    var lines = linesForShape(angle, spacing, shape);
    var points = [];
    for (var i = 0; i < lines.length; i++) {
        var intersections = shape.getIntersections(lines[i]);

        intersections = intersections.map(function(e) {
            return e.point;
        }).sort(function(a, b) {
            return a.y < b.y;
        });

        if (i % 2 == 1) {
            intersections.reverse();
        }

        points = points.concat(intersections);
    }

    lines.forEach(function(l) {
        l.remove();
    });
    lines = [];
    
    for (var i = 0; i < points.length; i+=2) {
        lines.push(new Path.Line(points[i], points[i+1]));    
    }
 
    return lines;
}

function zigzagLinesForShape(angle, spacing, shape) {

    var hatches = hatchLinesForShape(angle, spacing/2, shape);
    var result = new Path([hatches[0].segments[0]]);
    
    for (var i = 1; i < hatches.length; i++) {
        result.segments.push(hatches[i].segments[0]);
    }
    
    hatches.forEach(function(l) {
        l.remove();
    });

    return [result];
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


function indexToGrid(index) {
    var y = index.y * 2 + (index.x+1) % 2
    return new Index(index.x, y);
}

function pointAtIndex(index) {
    var g = indexToGrid(index);
    return new Point(g.x* alt, g.y * side * 0.5);
}

function isValidGridIndex(index) {
    return (index.x + index.y) % 2 === 1;
}

function pointAtGridIndex(index) {
    return new Point(index.x * alt, index.y * side * 0.5);
}

function pointToGridIndex(gridPoint) {
    return new Point(Math.floor(gridPoint.x / alt), Math.floor(gridPoint.y * 2 / side));
}

function drawAllPoints() {
    for(var i = 0; i < nx; i++) {
        for(var j = 0; j < ny; j++) {
            var index = new Index(i, j);

            if (isValidGridIndex(index)) {
                var sq = new Path.Circle(pointAtGridIndex(index), 2.5);
                sq.fillColor = "#ccc";
            }
        }
    }
}

function numLines(type, size) {
    if (type === 'H') {
        return size.x;
    }
    else {
        return Math.floor((size.x + size.y - 2) / 2);
    }
}

function firstLine(type, size) {
    var line = new IndexLine();
    line.start = new Index(0, 1);
    if (type === 'H') {
        line.end = new Index(0, size.y  - size.y % 2 - 1);
    }
    else if (type === 'N') {
        var sxm = (size.x + 1) % 2;        
        line.start = new Index(size.x - 2 - sxm, 0);
        line.end = new Index(size.x - 1, 1 + sxm);
    }
    else if (type === 'P') {
        line.end = new Index(1, 0);
    }   

    return line;
}

function incXP(index, size) {
    if (index.x < size.x - 1) index.x++;
    else index.y++;
    return index;
}

function incYP(index, size) {
    if (index.y < size.y - 1) index.y++;
    else index.x++;
    return index;
}

function incXN(index, size) {
    if (index.x > 0) index.x--;
    else index.y++;
    return index;
}

function incYN(index, size) {
    if (index.y < size.y - 1) index.y++;
    else index.x--;
    return index;
}

function twice(func, a1, a2) {
    var v = func(a1, a2);
    return func(v, a2);
}


function nextLine(line, type, size) {
    if (type === 'H') {
        line.start.y = line.start.x % 2;
        line.start.x++;

        if(line.end.y === size.y - 1) line.end.y--;
        else line.end.y++;

        line.end.x++;
    }
    else if (type === 'N') {
        line.start = twice(incXN, line.start, size);
        line.end = twice(incYN, line.end, size);
    }
    else if (type === 'P') {
        line.start = twice(incYP, line.start, size);
        line.end = twice(incXP, line.end, size);
    }
    return line;
}

function drawGridLines(type, size, group) {
    var n = numLines(type, size);
    var line = firstLine(type, size);

    for (var i = 0; i < n; i++) {
        var p = new Path.Line({
            from: pointAtGridIndex(line.start),
            to: pointAtGridIndex(line.end),
            strokeColor: current.gridStrokeColour,
            strokeScaling: false,
        });
        line = nextLine(line, type, size);
        group.addChild(p);
    }
}

function drawGrid(group) {
    group.removeChildren();
    drawGridLines('N', new Index(nx, ny), group);
    drawGridLines('P', new Index(nx, ny), group);
    drawGridLines('H', new Index(nx, ny), group);
    return group;
}

function _project(point, line) {
    /// use dot product to project a point on to a line
    
    var toP = point.subtract(pointAtGridIndex(line.start));
    var toEnd = pointAtGridIndex(line.end).subtract(pointAtGridIndex(line.start));

    var l = toEnd.length;
    var dp = toP.dot(toEnd);
    dp/= l*l;

    var proj = toEnd.multiply(dp);
    proj = proj.add(pointAtGridIndex(line.start));
    return proj;
}

function distanceToLine(point, line) {
    /// signed distance between point and line
    /// negative distance if point.y < projected.y 

    var proj = _project(point, line);
    var len = (proj.subtract(point)).length;

    if (point.y < proj.y) {
        len = -len;
    }

    return len;
}

function axisLine(type) {
    var line = new IndexLine();
    line.start = new Index(0, 1);
    if (type === 'H') {
        line.end = new Index(0, 3);
    }
    else if (type === 'N') {
        line.end = new Index(1, 2);
    }
    else if (type === 'P') {
        line.end = new Index(1, 0);
    }   

    return line;
}

function getAxes() {
    return new Triple(axisLine('N'), axisLine('P'), axisLine('H'));
}

function getAxesArray() {
    var axes = getAxes();
    return [axes.n, axes.p, axes.h];
}

function drawAxes() {
    var axes = getAxesArray();
    for (var i = 0; i < axes.length; i++) {
        new Path.Line({
            from: pointAtGridIndex(axes[i].start),
            to: pointAtGridIndex(axes[i].end),
            strokeColor: '#00f'
        });
    }
}


function interceptForEdge(edge) {
    // technically not an intercept for H
    // doesn't matter if we use start or end
    var start = edge.start;
    if (edge.type === "P") {
        return (start.x + start.y - 1) / 2;
    }
    else if (edge.type === "N") {
        return (start.y - start.x - 1) / 2;
    }
    else if (edge.type === "H") {
        return start.x;
    }
}

function yIndexFromSide(side) {
    return side * 2 + 1;
}


function triangleDirection(triple) {
    if (triple.sum() % 2 === 0) {
        return 'F';
    }
    return 'B';
}

function indexToSides(triple) {
    //given an [n,p,h] tuple return another [n,p,h]
    //tuple which is the sides of the triangle
    var direction = triangleDirection(triple);

    var ret = triple.clone();

    if (direction === 'F') {
        ret.p++;
    }
    else if (direction === 'B'){
        ret.n++;
        ret.h++;
    }
    return ret;
}

function verticesForTriple(triple) {

    var sides = indexToSides(triple);
    var direction = triangleDirection(triple);

    var verts;
    if (direction === 'F') {
        verts = [ 
            new Index(sides.h, sides.h + yIndexFromSide(sides.n)),
            new Index(sides.h+1, yIndexFromSide(sides.p) - (sides.h+1)),
            new Index(sides.h, yIndexFromSide(sides.p) - sides.h)
        ];
    }
    else if (direction == 'B') {
        verts = [
            new Index(sides.h-1, sides.h - 1 + yIndexFromSide(sides.n)),
            new Index(sides.h, yIndexFromSide(sides.p) - sides.h),
            new Index(sides.h, sides.h + yIndexFromSide(sides.n))
        ];   
    }
    return verts;
}


function worldToLocal(point, alt, axis) {
    // return an index used in tri coordinates
    var d = distanceToLine(point, axis);
    return Math.floor(d/alt);
}

var axes = getAxes();

function worldToTriple(point, alt) {
    // given a point in screen coords, 
    // and the altitude of the triangles
    // return index Triple
    
    // var axes = getAxes();
    return new Triple(
        worldToLocal(point, alt, axes.n),
        Math.abs(worldToLocal(point, alt, axes.p)),
        Math.floor(point.x / alt));
}


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


function triplesForDimension(size) {
    // calculate and return an array of all the triangles
    // for a given size (in indices not real world)
    // the logic is that we move down each column
    var ret = [];
    var n = 0, p = 0, h = 0;
    for (var h = 0; h < size.width - 1; h++) {
        p = Math.floor(h / 2);
        n = -p - 1;

        for (var j = 0; j < size.height - 2; j++) {

            ret.push(new Triple(n, p, h));

            if (j % 2 === h % 2) {
                n++;
            }
            else {
                p++;
            }
        }
    }
    return ret;
}

function createTriangle(triple, vertices) {
    var dir = triangleDirection(triple);
    return {
        "id": triple.id,
        "vertices": vertices,
        "edges": [
            new Edge(vertices[0], vertices[1], dir == 'F' ? ['N', triple.n] : ['P', triple.p]),
            new Edge(vertices[1], vertices[2], dir == 'F' ? ['P', triple.p+1] : ['H', triple.h + 1]),
            new Edge(vertices[2], vertices[0], dir == 'F' ? ['H', triple.h] : ['N', triple.n + 1]),
        ],
    }
}

function createDatabase(size) {

    if (size === undefined) {
        size = new Size(nx, ny);
    }
    
    var db = {};
    var triples = triplesForDimension(size);
    
    for(var i = 0; i < triples.length; i++) {
        var verts = verticesForTriple(triples[i]);
        db[triples[i].id] = createTriangle(triples[i], verts);

    }
    return db;
}

function isValidTriple(triple) {
    return db[triple.id] !== undefined;
}


function getPerimeterEdges(pntSet) {
    var outerEdges = {};
    var vs = pntSet.keys();

    //we want only one occurence of each edge,
    //add things to an object, if the key is there delete...
    //this makes it nicely linear in time
    for (var i = 0; i < vs.length; i++) {
        
        for (var j = 0; j < 3; j++) {

            var edge = db[vs[i]].edges[j];

            if (outerEdges[edge.id] === undefined) {
                outerEdges[edge.id] = edge;
            } 
            else {
                delete outerEdges[edge.id];
            }
        }
    }
    return outerEdges;
}


function cartesianProduct() {
  return Array.prototype.reduce.call(arguments, function(a, b) {
    var ret = [];
    a.forEach(function(a) {
      b.forEach(function(b) {
        ret.push(a.concat([b]));
      });
    });
    return ret;
  }, [[]]);
}

function range(from, to) {
    var ret = [];
    for (var i = from; i < to; i++) {
        ret.push(i);
    }
    return ret;
}


function pathFromPerimeterEdges(edges, getMin) {
    // takes the object created by getPerimeterEdges(),
    // namely, an object with edge ids as keys and
    // edge objects as values
    // returns a list of edge lists
    //
    // if `getMin` is true, the function tries all paths to see
    // which is the shortest. this can take a while.
    
    
    function IndexHolder(elem) {
        this.elem = elem;
        this.data = {};
        this.branches = {};
        this.counter = 0;

        this.clone = function() {
            var ret = new IndexHolder(this.elem);
            for (var key in this.data) {
                ret.data[key] = this.data[key].slice();
            }
            return ret;
        }
        
        this.pushEdge = function(edge) {
            var index = edge[this.elem];
            if (this.data[index.id] !== undefined) {
                this.data[index.id].push(edge);
            }
            else {
                this.data[index.id] = [edge];
            }
        };

        this.popIndex = function(index) {
            var ret = undefined;
            var id = index.id;
            
            if (this.data[id] !== undefined) {
                
                var branch = 0;
                
                if (this.branches[id] !== undefined) {
                    branch = this.branches[id].splice(0, 1);
                    if (this.branches[id].length === 0){
                        delete this.branches[id];
                    }
                }

                var r = this.data[id].splice(branch, 1);

                if (r.length > 0) {
                    ret = r[0];
                }
                if (this.data[id].length === 0){
                    delete this.data[id];
                }

            }
            return ret;
        };
    }

    var starts = new IndexHolder("start");
    for (var key in edges) {
        var e = edges[key];
        starts.pushEdge(e);
    }

    var branches = {};    
    for (var key in starts.data) {
        if (starts.data[key].length == 2) {
            branches[key] = [[0, 0], [1, 0]];
        }
        else if (starts.data[key].length === 3) {
            branches[key] = [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0], [2, 0, 0], [2, 1, 0]];
        }
    }
    
    
    function getPerim(starts) {
    
        var q = 0, qq = 0, l = Object.keys(edges).length;
    
        var perims = [];
        do {
            var sortedStarts = sorted(Object.keys(starts.data));
            
            var firstEdge = starts.data[sortedStarts[0]][0];

            var nextEdge;
            var prevEdge = starts.popIndex(firstEdge.start)
            var perim = [prevEdge];
            
            do {
            
                nextEdge = starts.popIndex(prevEdge.end);
                perim.push(nextEdge);
                prevEdge = nextEdge;
            
            } while (nextEdge.end.id !== firstEdge.start.id);

            perims.push(perim);

        } while (Object.keys(starts.data).length !== 0);

        return perims;
    }

    if (Object.keys(branches).length === 0 || !getMin) {
        var r = getPerim(starts);
        return r;
    }

    var branchIndices = Object.keys(branches);
    var branchRoutes = [];
    for (var i = 0; i < branchIndices.length; i++) {
        branchRoutes.push(branches[branchIndices[i]]);
    }

    var routesProduct = cartesianProduct.apply(undefined, branchRoutes);
    var routesMap = routesProduct.map(function(e) {
        var ret = {};
        for (var i = 0; i < e.length; i++) {
            ret[branchIndices[i]] = e[i].slice();
        }
        return ret;
    });

    
    var outlines = [];
    for (var i = 0; i < routesMap.length; i++) {
        var startsWithBranches = starts.clone();
        startsWithBranches.branches = routesMap[i];
        
        var outline = getPerim(startsWithBranches);

        if (outline.length === undefined) continue;
        if (outline.length === 1) {
            return outline;
        }
        outlines.push(outline);
    }

    var mol = 1000, minOutline = undefined;
    
    outlines.forEach(function(outline) {
        if (outline.length < mol) {
            
            minOutline = outline;
            mol = outline.length;
        }
    });

    return minOutline;
}


function makeOutline(perims, outline) {
    // given perims (a 2D array) of grid indices,
    // fill the paper.js outline
    
    var perim = perims[0];
    if (perim.length === 0) {
        return;
    }

    outline.removeChildren();
    for (var i = 0; i < perims.length; i++) {
        var p = Path.Line();
        p.removeSegments();
        p.addSegment(pointAtGridIndex(perims[i][0].start));
        for (var j = 0; j < perims[i].length; j++) {
            p.addSegment(pointAtGridIndex(perims[i][j].end));
            
        }
        outline.addChild(p);

    }
}


function mergeLines(perims) {
    // the perims have consecutive triangle edges,
    // this merges lines of the same orientation so they
    // are smooth when drawn
    
    for (var i = 0; i < perims.length; i++) {

        var perim = perims[i];
        var edge = perim[0].clone();        
        var edges = [];
        
        for (var j = 1; j < perim.length; j++) {
            if (perim[j].line.type === perim[j-1].line.type) {
                edge.end = perim[j].end;
            }
            else {
                edges.push(edge);
                edge = perim[j].clone();
            }
        }
        edges.push(edge);
        perims[i] = edges;
    }
    return perims;
}

function filterDuplicateLines(shapeIds) {
    // we don't want to redraw lines of outlines that touch each other
    // heere we remove the edges from each shape's perimeter if it has been drawn before
    // we keep `db`, an array of Sets that store the use of each edge
    
    var db = [];
    for (var i = 1; i < 9; i++) {
        db[i] = new Set();
    }
    
    for (var i = 0; i < shapeIds.length; i++) {
        var shape = shapes.get(shapeIds[i]);

        if (!shape.outline.visible) {
            continue;
        }
        
        var perims = shape.getPerims();
        var pen = shape.appearence.outline;
        var newperims = [];
        
        for (var j = 0; j < perims.length; j++) {
            
            var np = [];
            var k = 0;

            do {
                edge = perims[j][k++];
            } while(db[pen].has(edge.id) && k < perims[j].length);

            db[pen].add(edge.id);
            np.push(edge);

            for (; k < perims[j].length; k++) {
                edge = perims[j][k];
                if (db[pen].has(edge.id)) {
                    if (np.length !== 0) {
                        newperims.push(np);
                        np = [];
                    }
                }
                else {
                    np.push(edge);
                    db[pen].add(edge.id);
                }
                
            }
            if (np.length !== 0){
                newperims.push(np);
            }
        }

        makeOutline(mergeLines(newperims), shape.outline);
    }

    view.draw();
}

function sortIntoPens(shapeIds) {
    // take each shape and sort the outlines and fills in order of
    // their pens, so all drawings of one pen are drawn together
    
    var pens = {};
    for (var i = 1; i < 9; i++) {
        pens[i] = [];
    }
    
    for (var i = 0; i < shapeIds.length; i++) {
        
        var shape = shapes.get(shapeIds[i]);
        if (shape.outline.visible) {

            var outlines = shape.outline.children;
            var outlinepen = shape.appearence.outline;

            for (var j = 0; j < outlines.length; j++) {
                pens[outlinepen].push(outlines[j].segments);
            }
        }

        if (shape.fill.visible) {
            var fillpen = shape.appearence.fill;
            var lines = shape.fill.children.map(function(e) {
                return e.segments;
            });
            pens[fillpen] = pens[fillpen].concat(lines);
        }
    }

    for (var i = 1; i < 9; i++) {
        if (pens[i].length === 0) {
            delete pens[i];
        }
    }
    
    return pens;
}

function TShape(idOrData, order) {

    extend(this, new SetWithUniverse());

    if (idOrData.triples === undefined) {
        this.id = idOrData;
        this.order = order;
        this.name = "Shape " + this.id;
    }
    else {
        this.id = idOrData.id;
        this.order = idOrData.order;
        this.name = idOrData.name;
        var triples = idOrData.triples;
        for (var i = 0, l = triples.length; i < l; i++) {
            this.add(new Triple(triples[i]));
        }
        if (idOrData.appearence) {
            this.appearence = idOrData.appearence;
        }
    }

    
    this.outline = new CompoundPath({
        strokeColor: 'black',
        // visible: false,
    });

    this.fill = new Group({
        strokeColor: 'black',
        // visible: false,
    });

    this.appearence = this.appearence || {
        spacing: Math.random()*5+2,
        angle: Math.random()*180,
        filltype: "hatch",
        _fill: 1,
        _outline: 1,
    };

    this.cloneAppearence = function(appearence) {
        for (var key in appearence) {
            this.appearence[key] = appearence[key];
        }
        //use the getters and setters
        this.appearence.fill = appearence.fill;
        this.appearence.outline = appearence.outline;
    }
    // we want to know when fill and outline in appearence
    // are set, so define getters and setters
    
    var that = this;
    Object.defineProperty(this.appearence, "fill", {
        set: function(v) {
            that.fill.visible = v !== "none";
            this._fill = v;
        },
        get: function() {
            return this._fill;
        }
    });

    Object.defineProperty(this.appearence, "outline", {
        set: function(v) {
            that.outline.visible = v !== "none";
            this._outline = v;
        },
        get: function() {
            return this._outline;
        }
    });

    this.clearDrawing = function() {
        this.outline.remove();
        this.fill.remove();
    }
    
    this.makeLines = function(lines) {
        var a = this.appearence;
        
        if (lines === undefined) {
            if (a.filltype === "hatch") {
                lines = hatchLinesForShape(a.angle, a.spacing, this.outline);
            }
            else if (a.filltype === "joinedhatch") {
                lines = joinedHatchLinesForShape(a.angle, a.spacing, this.outline);
            }
            else if(a.filltype === "zigzag") {
                lines = zigzagLinesForShape(a.angle, a.spacing, this.outline);
            }
            else if (a.filltype === "offset") {
                lines = [];
                offsetsForShape(this);
            }

        }
        
        this.fill.removeChildren();
        this.fill.addChildren(lines);
        this.fill.strokeColor = "black";
    }

    this.getPerims = function(getMinOutline) {
        
        var outerEdges = getPerimeterEdges(this);
        var perims = pathFromPerimeterEdges(outerEdges, getMinOutline);
        return perims;
    };
    
    this.draw = function(getMinOutline) {
        // var start = performance.now();

        var perims = this.getPerims(getMinOutline);
        this.perims = mergeLines(perims);

        // always do this even if it's not visible so we can do offseting
        makeOutline(this.perims, this.outline);
        
        if (this.fill.visible) {
            this.makeLines();
        }
        
        // console.log("draw took " + (performance.now() - start) + "");
    };   

    this.mergeLines = function(getMinOutline) {
        var outerEdges = getPerimeterEdges(this);
        var perim = pathFromPerimeterEdges(outerEdges, getMinOutline);
        this.perim = mergeLines(perim);
        makeOutline(perim, this.outline);  
    };

    this.data = function() {
        return {
            "triples": Object.keys(this._values),
            "id": this.id,
            "order": this.order,
            "name": this.name,
            "appearence": this.appearence,
        };
    };

}


function InvertedIndex() {
    // holds arrays for each triple in the grid.
    // the array contains which shape is present at that triple.
    // makes queries much faster than searching shapes.

    var index = {};

    this.add = function(tripleId, shapeId) {
        if (index[tripleId] === undefined) {
            index[tripleId] = [shapeId];
        }
        else {
            index[tripleId].push(shapeId);
        }
    };

    this.remove = function(tripleId, shapeId) {
        if (typeof(shapeId) !== "number") {
            shapeId = Number.parseInt(shapeId);
        }
        
        // let's presume tripleId exists in index
        var i = index[tripleId].indexOf(shapeId);
        if (i >= 0) {
            index[tripleId].splice(i, 1);

            if (index[tripleId].length === 0) {
                delete index[tripleId];
            }
        }
    };

    this.removeAll = function(tripleId) {
        delete index[tripleId];
    };

    this.addShape = function(shape) {
        for (var tripleId in shape._values) {
            this.add(tripleId, shape.id);
        }
    };

    this.removeShape = function(shape) {
        for (var tripleId in shape._values) {
            this.remove(tripleId, shape.id);
        }
    };

    this.has = function(tripleId) {
        return index[tripleId] !== undefined && index[tripleId].length > 0;
    };

    this.at = function(tripleId) {
        return index[tripleId];
    };

    this.values = function() {
        return index;
    };
}


function Shapes() {
    // the main container keeping hold of all the shapes

    var shapes = {};
    this.layer = new Group();

    var ids = 1;
    this.nextId = function() {
        return ids++;
    };
    
    
    this.get = function(key) {
        return shapes[key];
    };

    this.add = function(key) {
        var shape = new TShape(key, ids);
        shapes[key] = shape;
        ui.addShape(shape);
    };

    this.remove = function(key) {
        shapes[key].clearDrawing();
        ui.removeShape(key);
        delete shapes[key];

    };

    this.draw = function() {
        for (var key in shapes) {
            shapes[key].draw();
        }
    }

    this.keysInOrder = function() {
        return Object.keys(shapes).sort(function(a,b){
            return shapes[a].order - shapes[b].order;
        });
    };

    this.shapeIds = function() {
        return Object.keys(shapes);
    };

    this.highestFromArray = function(arr) {

        if (arr === undefined) return undefined;
        
        var maxOrder = -1, highestShape = undefined;

        for (var i = 0; i < arr.length; i++) {

            var shapeId = arr[i];
            if (shapes[shapeId].order > maxOrder) {
                highestShape = shapeId;
                maxOrder = shapes[shapeId].order;
            }
        }
        return highestShape;
    };

    this.getState = function() {
       var data = {};
        for (var shapeId in shapes) {
            data[shapeId] = shapes[shapeId].data();
        }
        return data;
        
    };

    this.clear = function() {
        for (var key in shapes) {
            this.remove(key);
        }
        shapes = {};
    };
    
    this.loadState = function(dataObj) {

        this.clear();

        var highestId = 0;
        for (var shapeId in dataObj) {
            shapes[shapeId] = new TShape(dataObj[shapeId]);
            shapes[shapeId].draw();
            highestId = Math.max(highestId, shapeId);
        }
        ids = highestId + 1;
    };
    

    this.removeOutside = function(db, invertedIndex) {
        for (var shapeId in shapes) {
            var shape = shapes[shapeId];
            for (var indexId in shape._values) {
                var tripleId = shape._values[indexId];
                if (db[tripleId] === undefined) {
                    shape.remove(tripleId);
                    invertedIndex.remove(tripleId, shapeId);
                }
            }
        }
    };
    
}



function UI() {
    
    $("#shapes").sortable({
        update: function(event, ui) {

            var ordered = $(this).sortable("toArray", { "attribute": "key" });
            for (var i = 0; i < ordered.length; i++) {
                var key = ordered[i];
                shapes.layer.insertChild(i, shapes.get(key).outline);
                shapes.get(key).order = i;
            }
            project.view.draw();
        },
        change: function(event, ui) {
            
        }
    });

    var template = $("#shapes").html();
    $("#shapes").html("");

    this.addShape = function(shape) {
        $("#shapes").append(template);
        var added =  $("#shapes li:last-child");
        
        added.find("span").text(shape.name);
        added.find("input[type=text]").val(shape.name);
        added.attr("key", shape.id);
        
        // update values of sliders
        added.find("input[name=spacing]").val(shape.appearence.spacing);
        added.find("input[name=angle]").val(shape.appearence.angle);

    };

    function getItem(shapeId) {
        return $("#shapes").find("li[key=" + shapeId + "]");
    }

    this.removeShape = function(shapeId) {
        getItem(shapeId).remove();
    }

    var currentExpandedShape = false;
    function highlightDiv(div, highlight) {
        // div.css("border-left", "4px solid " + (highlight ? "#3dc57e" : "#fff"));
        div.toggleClass("selected", highlight);
    }
    this.setCurrentShape = function(shapeId) {
        if (currentExpandedShape) {
            var div = getItem(currentExpandedShape).find("div.shape");
            highlightDiv(div, false);
        }
        var div = getItem(shapeId).find("div.shape");
        highlightDiv(div, true);
        // li.css("background", "#faa");
        currentExpandedShape = shapeId;
    };


    $("#shapes").on('submit','form.setname',function(e){
        var arrow = $(this).siblings(".arrow");
        toggleDetails(arrow);
        e.preventDefault();
    });

    $("#shapes").on("input", ".title", function(e){
        var input = $(this).find("input[type=text]").val();
        var shapeId = $(this).parents("li").attr("key");

        shapes.get(shapeId).name = input;
        $(this).parents("li").find("span").text(input);
        // console.log(e);
    });


    
    function toggleDetails(arrow) {
        arrow.toggleClass("arrow-down");
        arrow.siblings("span").toggle();
        arrow.siblings("form").find("input").toggle();

        var details = arrow.parent().next();
        
        details.toggle();
    }

    function inputRangeUpdate(e, commit) {
        var name = $(this).attr("name");
        var value = parseInt($(this).val());
        var shapeId = parseInt($(this).parents("li").attr("key"));
        var shape = shapes.get(shapeId);

        if (shape.appearence[name] != value) {
            
            shapes.get(shapeId).appearence[name] = value;
            console.log("name = " + name + ", shape = " + shapeId + ", value = " + value);
            shapes.get(shapeId).draw();
            view.draw();
        }

        if (commit && startedValue !== value) {        
            invoker.push(ChangeAppearenceAction, "forward", [shapeId, name, startedValue, value]);
        }
        
    }
    var startedValue = null;
    
    $("#shapes").on("mousedown", "input[type=range]", function(e){
        console.log("bind");
        startedValue = parseInt($(this).val());
        $(this).bind("mousemove", inputRangeUpdate);
    });

    $("#shapes").on("mouseup", "input[type=range]", function(e){
        console.log("unbind");
        inputRangeUpdate.apply(this,[null, true]);
        $(this).unbind("mousemove", inputRangeUpdate);
    });
    
    $("#shapes").on("click", ".arrow", function() {
        toggleDetails($(this));
    });

    $("#shapes").on("change", "select", function() {

        var name = $(this).attr("name");
        var value = $(this).val();
        var shapeId = $(this).parents("li").attr("key");
        var fromValue = shapes.get(shapeId).appearence[name];

        invoker.push(ChangeAppearenceAction, "forward", [shapeId, name, fromValue, value]);
        console.log("name = " + name + ", shape = " + shapeId + ", value = " + value);
    });

    // $("#shapes").on("stop", "input[type=range]", function() {
        // console.log(this);
    // });


    ////////////////////////////////////////
    // download & upload
    
    $("#download").click(function(e) {

        var data = shapes.getState();
        
        var anchor = $(this);
        var req = $.ajax({
            url: HOST + "/save/",
            type: "POST",
            dataType: "json",
            crossDomain: true,
            data: {
                "data": JSON.stringify(data),
            },
        }).done(function(data) {

            window.location = "http://127.0.0.1:5000/download/" + data.fileid;
            
        });
        
        e.preventDefault();
        return false;
    });


    $("#upload").click(function(e){
        e.preventDefault();
        $("#fileupload").trigger('click');
    });

    function loadState(obj) {
        console.log("loading");
        console.log(obj);

        shapes.loadState(JSON.parse(obj));
        var shapeIds = shapes.shapeIds();
        shapeIds.forEach(function(shapeId) {
            var shape = shapes.get(shapeId);
            invertedIndex.addShape(shape);
            ui.addShape(shape);
        });
        

    }

    $("input:file").change(function (){

        var file = $(this).prop("files")[0];
        var fileReader = new FileReader();
        fileReader.onload = function(event) {
            loadState(event.target.result);
            invoker.clear();
            view.draw();
        };

        fileReader.readAsText(file);
    });


    $("#gridsize").on("mousemove",function(e){
        var newsize = $(this).val();
        if (newsize !== current.triangleSize) {
            setTriangleSize(newsize);
        }
    });

    $("#gridcolour").on("mousemove",function(e){
        current.gridStrokeColour = new Color($(this).val() * 0.01);
        gridGroup.strokeColor = current.gridStrokeColour;
        view.draw();

    });


    ////////////////////////////////////////////////////////
    // toolbar
    
    $(".tool").click(function(event) {
        var name = fromTitle($(this).attr("title"));
        action.selectMode(name);
    });

    function toTitle(s) {
        return s[0].toUpperCase() + s.substr(1);
    }

    function fromTitle(s) {
        return s.toLowerCase();
    }
    
    var highlightedTool = null;
    this.updateTool = function(modeName) {
        
        if (highlightedTool) {
            $(".tool[title="+toTitle(highlightedTool)+"]").toggleClass("selected", false);
        }

        $(".tool[title="+toTitle(modeName)+"]").toggleClass("selected", true);
        highlightedTool = modeName;
        console.log(modeName);
        console.log(highlightedTool);
    };

    ////////////////////////////////////////////////////////
    // history

    this.updateHistory = function(m) {
        $("#history").append("<p>" + m + "</p>");
        if ($("#history p").length > 10) {
            $('#history p:lt(2)').remove();
        }
    };


    ////////////////////
    this.updateStatus = function(status) {
        if (status) {
            $("#server-status").text("Connected");
            $("#plotter-status").text(status.plotter ? "Connected" : "None");
        }
        else {
            $("#server-status").text("None");
            $("#plotter-status").text("None");
        }
    }
}

function Plot() {

    this.all = function() {
        this.plotShapeIds(shapes.shapeIds());
    };

    this.selected = function() {
        this.plotShapeIds(Object.keys(current.selected._values));
    }
    
    this.plotShapeIds = function(shapeIds) {
        console.log("plotting");

        filterDuplicateLines(shapeIds);
        
        var data = sortIntoPens(shapeIds);
        console.log("data = " + data);

        var req = $.ajax({
            url: HOST + "/plot/",
            type: "POST",
            dataType: "json",
            crossDomain: true,
            data: {
                "data": JSON.stringify(data),
            },
        }).done(function(data) {

            console.log("sent file to plot");
            
            if ("error" in data) {
                alert(data["error"]);
            }
        });

    };
    
}

function requestOffsets(shapeId, data, cb) {
     var req = $.ajax({
        url: HOST + "/offsets/",
        type: "POST",
        dataType: "json",
        crossDomain: true,
        data: {
            "shapeId": shapeId,
            "data": JSON.stringify(data),
        },
    }).done(function(data) {
        cb.call(null, data);
        console.log(data);
    });
}

function segmentToXY(segment) {
    return {
        x: segment.point.x,
        y: segment.point.y
    };
}

function offsetsForShape(shape) {
    
    shape.mergeLines(true);
    var outlines = shape.outline.children.map(function(path) {
        return path.segments.map(segmentToXY);
    });
    
    console.log(outlines);
    var spacing = 5;
    
    var data = {
        "outer": outlines[0],
        "inner": outlines.splice(1),
        "spacing": shape.appearence.spacing,
        "maxlines": 50,
    };

    function donecb(data) {
        if (data.success) {
            var shape = shapes.get(data.shapeId);
            var lines = data.offsets.map(function(offset) {
                var p = new Path({
                    segments: offset,
                });
                p.addSegment(offset[0]);
                return p;
            });
            shape.makeLines(lines);
            view.draw();
        }
        else {
            alert(data.error);
        }
        requestMade = false;
    }

    requestOffsets(shape.id, data, donecb);
    
}

function plotOuterOffsets() {
    var lines = allOuters.children.map(function(e) {
        return e.segments;
    });

    var req = $.ajax({
        url: HOST + "/plot/",
        type: "POST",
        crossDomain: true,
        data: {
            "data": JSON.stringify({1: lines}),
        },
    });
}

var allOuters = new Group();
function offsetsForAllOuter(spacing, drawGroup, maxLines, boundingRect) {

    var shapeIds = shapes.shapeIds();

    //the outside of the shapes becomes the inside of the whole box
    var data = {};
    data["inner"] = shapeIds.map(function(shapeId) {
        var shape = shapes.get(shapeId);
        // shape.draw(true);
        var outer = shape.outline.children[0].clone();
        // outer.reverse();
        return outer.segments.map(segmentToXY);
    });


    data["outer"] = [];
    if (boundingRect !== undefined) {
        data["outer"] = boundingRect.segments.map(segmentToXY);
    }

    if (maxLines === undefined) {
        maxLines = 20;
    }
    data["maxlines"] = maxLines;
    // data["outer"] = shapeIds.map(function(shapeId) {
    //     var shape = shapes.get(shapeId);
    //     var outer = shape.outline.children[0].clone();
    //     // outer.reverse();
    //     return outer.segments.map(segmentToXY);
    // })[0];

    // data["inner"] = [boundingRect.segments.map(segmentToXY)];
    data["spacing"] = spacing;

    allOuters.removeChildren();
    requestOffsets(data, function(data) {
         if (data.success) {
             var lines = data.offsets.map(function(offset) {
                 var p = new Path({
                     segments: offset,
                     strokeColor: '#888',
                 });
                 p.addSegment(offset[0]);
                 return p;
             });

             // allOuters.removeChildren();
             allOuters.addChildren(lines);
             view.draw();
        }
    });
    
}

var MergeShapeAction = {
  "forward": function(mergeIntoId, shapeIdsAndTriples) {

      var mergeIntoShape = shapes.get(mergeIntoId);

      for (var i = 0; i < shapeIdsAndTriples.length; i++) {

          var triples = shapeIdsAndTriples[i].triples;;

          triples.forEach(function(triple) {
              ExtendShapeAction.forward(triple, Number.parseInt(mergeIntoId));
          });
          
          var shapeId = Number.parseInt(shapeIdsAndTriples[i].shapeId);          
          DeleteShapeAction.forward(shapeId);
      }

      mergeIntoShape.draw();
      view.draw();
  },
    "backward":  function(mergeOutOfId, shapeIdsAndTriples) {
      var mergeOutOfShape = Number.parseInt(shapes.get(mergeOutOfId));

      for (var i = 0; i < shapeIdsAndTriples.length; i++) {

          var shapeId = Number.parseInt(shapeIdsAndTriples[i].shapeId);
          var triples = shapeIdsAndTriples[i].triples;;
          
          triples.forEach(function(triple, j) {
              
              if (j == 0) {
                  CreateTriangleAction.forward(triple, shapeId);
              }
              else {
                  ExtendShapeAction.forward(triple, shapeId);
              }

              ExtendShapeAction.backward(triple, mergeOutOfId);
          });
      }

      view.draw();
        
    }
};

function mergeShapes() {
    var shapeIds = sorted(current.selected.keys());
    if (shapeIds.length < 1) {
        return;
    }
    
    var mergeIntoId = shapeIds.splice(0, 1)[0];
    var shapeIdsAndTriples = shapeIds.map(function(id) {
        return {
            shapeId: id,
            triples: shapes.get(id).values().map(function(t) {
                return new Triple(t);
            }),
        };
    });

    current.selected.clear();

    invoker.push(MergeShapeAction, "forward", [mergeIntoId, shapeIdsAndTriples]);

}

var DeleteShapeAction = {
    "forward": function(shapeId, triples) {

        if (triples === undefined) {
            triples = shapes.get(shapeId).values();
        }
        
        triples.forEach(function(triple, i) {
            if (i == triples.length-1) {
                CreateTriangleAction.backward(triple, shapeId);
            }
            else {
                ExtendShapeAction.backward(triple, shapeId);
            }
        });
    },
    "backward": function(shapeId, triples) {
        triples.forEach(function(triple, i) {
            if (i == 0) {
                CreateTriangleAction.forward(triple, shapeId);
            }
            else {
                ExtendShapeAction.forward(triple, shapeId);
            }
        });
    }
};

var DeleteShapesAction = {
    "forward": function(shapeIds, triplesArray) {
        shapeIds.forEach(function(id, i) {
            DeleteShapeAction.forward(id, triplesArray[i]);
        });
    },
    "backward": function(shapeIds, triplesArray) {
        shapeIds.forEach(function(id, i) {
            DeleteShapeAction.backward(id, triplesArray[i]);
        });  
    }
};

var DuplicateShapeAction = {
  "forward": function(triplesArray, fromIds, toIds) {

      triplesArray.forEach(function(triples, i) {
   
          triples.forEach(function(triple, j) {
              if (j == 0) {
                  CreateTriangleAction.forward(triple, toIds[i]);
              }
              else {
                  ExtendShapeAction.forward(triple, toIds[i]);
              }
          });
          shapes.get(toIds[i]).cloneAppearence(shapes.get(fromIds[i]).appearence);

      });

  },
    "backward": function(triplesArray, fromIds, toIds) {

        toIds.forEach(function(id) {
            DeleteShapeAction.forward(id);
        })
    }
    
      
};

function duplicateSelected() {
    var shapeIds = current.selected.keys();
    current.selected.clear();

    var toIds = shapeIds.map(function(sid) {
        return shapes.nextId();
    });

    var triplesArray = shapeIds.map(function(sid) {
        return shapes.get(sid).values();
    });

    invoker.push(DuplicateShapeAction, "forward", [triplesArray, shapeIds, toIds]);

    toIds.forEach(function(id) {
        current.selected.add(id);
    });
    
    action.tool.onMouseMove = action.moveShapes;
    action.tool.onMouseDown = function() {
        action.restoreDefaultTools()
        action.tool.onMouseMove = null;
    };
}

function Command(action, direction, args) {
    this.action = action;
    this.direction = direction;
    this.args = new Array(args.length);
    for (var i = 0; i < args.length; i++) {
        this.args[i] = args[i];
    }

    function reverse(dir) {
        if (dir === "forward") return "backward";
        return "forward";
    }

    this.execute = function(reversed) {

        var dir = this.direction;
        if (reversed) {
            dir = reverse(dir);
        }

        var name = this.action[dir].apply(this.action, this.args);
        // console.log("executed " + name + " with " + this.args);
    };

}

///////////////////////////////////////////////////////////////////////////
// Actions

var CreateTriangleAction = {
    "forward": function(triple, shapeId){

        shapes.add(shapeId);
        // invertedIndex[triple] = shapeId;
        // addTriangle(event);
        ExtendShapeAction.forward(triple, shapeId);

        return "Create";
    },
    "backward": function(triple, shapeId){
        shapes.remove(shapeId);
        // delete invertedIndex[triple];
        invertedIndex.remove(triple.id, shapeId);
        return "Delete";
    },
    "name": "Create Triangle",
};

var ExtendShapeAction = {
    "forward": function(triple, shapeId) {

        //it's new so update the inverted index
        shapes.get(shapeId).add(triple);
        // invertedIndex[triple] = shapeId;
        invertedIndex.add(triple.id, shapeId);
        wm("extend shape at " + triple);

        current.triple.id = triple;
        shapes.get(shapeId).draw();

        return "Extend";

    },
    
    "backward": function(triple, shapeId) {

        shapes.get(shapeId).remove(triple);
        // delete invertedIndex[triple];
        invertedIndex.remove(triple.id, shapeId);
        shapes.get(shapeId).draw();
        wm("shink shape at " + triple.id);
        return "Shrink";
    },
    "name": "Extend Shape",
};

var MoveShapeAction = {
    "forward": function(shapeIds, moveTriple){

        var shape, items, triple;

        for (var i = 0; i < shapeIds.length; i++) {
            shape = shapes.get(shapeIds[i]);
            items = shape.items();
            invertedIndex.removeShape(shape);
            shape.clear();
            for (var key in items) {
                triple = items[key].add(moveTriple);
                shape.add(triple);
                invertedIndex.add(triple.id, shape.id);

            }
            shape.draw();
        }

        return "Move";
    },
    "backward": function(shapeIds, moveTriple){
        // console.log("adfsasdfkljasd " + moveTriple);
        return this.forward(shapeIds, moveTriple.inverse());
    },
    "name": "Move Shape",
};

var EraseTriangleAction = {
    "forward": function(triple, shapeIds) {
        for (var i = 0; i < shapeIds.length; i++) {

            shapes.get(shapeIds[i]).remove(triple);

            if (shapes.get(shapeIds[i]).keys().length === 0) {
                shapes.remove(shapeIds[i]);
            }
            else {
                shapes.get(shapeIds[i]).draw();
            }
            
            
        }
        invertedIndex.removeAll(triple.id);
        return "Erase";
    },
    "backward": function(triple, shapeIds) {
        for (var i = 0; i < shapeIds.length; i++) {
            if (shapes.get(shapeIds[i]) === undefined) {
               shapes.add(shapeIds[i]); 
            }
            shapes.get(shapeIds[i]).add(triple);
            invertedIndex.add(triple.id, shapeIds[i]);
            shapes.get(shapeIds[i]).draw();
        }
        return "De-Erase";
    },
    "name": "Erase Triangle",
};

var CloneAppearenceAction = {
    "forward": function(shapeId, fromAppearence, toAppearence) {
        shapes.get(shapeId).cloneAppearence(toAppearence);
        shapes.get(shapeId).draw();
    },
    "backward": function(shapeId, fromAppearence, toAppearence) {
        shapes.get(shapeId).cloneAppearence(fromAppearence);
        shapes.get(shapeId).draw();
    },
};

function changeAttribute(shapeId, attribute, value) {
    var shape = shapes.get(shapeId);
    shape.appearence[attribute] = value;
    shape.draw();
    view.draw();
}

var ChangeAppearenceAction = {
    "forward": function(shapeId, attribute, fromValue, toValue) {
        changeAttribute(shapeId, attribute, toValue);
        return "Clone Appearence";
    },
    "backward": function(shapeId, attribute, fromValue, toValue) {
        changeAttribute(shapeId, attribute, fromValue);
        return "De-Clone Appearence";
    },
    "name": "Change Appearence",
};


function Invoker() {
    var commands = [];
    var pos = 0;

    this.push = function(action, direction, args) {
        // console.log(args);
        var comm = new Command(action, direction, args);

        if (pos !== commands.length) {
            commands = commands.splice(0, pos);
        }

        commands.push(comm);
        // ui.updateHistory(action.name);
        comm.execute();
        pos++;
    };

    this.undo = function() {
        if (pos < 1) wm("nothing to undo");
        else {
            commands[--pos].execute(true);
        }
    };

    this.redo = function() {
        if (pos === commands.length) wm("can't redo");
        else {
            commands[pos++].execute();
        }
    };

    this.clear = function() {
        commands = [];
        pos = 0;
    }
}

function KeyComboHandler() {
    var combos = {};

    function keysFromEvent(event) {
        var keys = [];
        for (var mod in event.modifiers) {
            if (event.modifiers[mod]) {
                keys.push(mod);
            }
        }
        keys.push(event.key);
        return keys;
    }

    
    function makeKeyComboId(keys) {
        return sorted(keys).join("+");
    }

    this.add = function(keys, objOrFunc, funcname) {
        var func = undefined;
        if (typeof(objOrFunc) === 'function') {
            func = objOrFunc;
        }
        else {
            func = function() { objOrFunc[funcname].apply(objOrFunc); };
        }
        
        combos[makeKeyComboId(keys)] = func;
    };

    this.call = function(event) {
        var keys = keysFromEvent(event);
        var id = makeKeyComboId(keys);
        if (combos[id] !== undefined) {
            combos[id]();
            event.preventDefault();
            return false;
        }
        return true;
    };

    
    return this;
}


function Action(invoker, keyHandler) {

    function pan(event) {
        project.activeLayer.translate(event.delta);
    }

    function zoom(event) {
        project.activeLayer.scale(1 + (event.delta.y * 0.005), event.point);
    }

    
    function addTriangle(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        if (!isValidTriple(triple)) {
            return;
        }
        
        if (!shapes.get(current.shape).has(triple)) {
            invoker.push(ExtendShapeAction, "forward", [triple, current.shape]);
        }
        else {
            if (invertedIndex.has(triple.id) && triple.id !== current.triple.id) {
                invoker.push(ExtendShapeAction, "backward", [current.triple, current.shape]);
            }
        }
        current.triple = triple;
    }

    function findShape(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        if (!isValidTriple(triple)) {
            return;
        }

        current.triple = triple;
        current.shape = shapes.highestFromArray(invertedIndex.at(current.triple.id));

        if (current.shape === undefined) {
            var shapeId = shapes.nextId();

            invoker.push(CreateTriangleAction, "forward", [current.triple, shapeId]);

            //do this after so we can update the ui
            current.shape = shapeId;
        }
       
    }

    function removeTriangle(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        if (invertedIndex.has(current.triple.id) && triple.id !== current.triple.id) {

            if (shapes.get(current.shape).has(current.triple)) {

                var action = ExtendShapeAction;
                if (shapes.get(current.shape).keys().length === 1) {
                    action = CreateTriangleAction;
                }
                invoker.push(action, "backward", [current.triple, current.shape]);
            }
            current.triple = triple;
        }   
        
    }

    function selectShapes(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        var sid = shapes.highestFromArray(invertedIndex.at(triple.id));

        if (sid === undefined) {
            current.selected.clear();
        }
        else {
            if (!modifierStates["shift"]) {
                
                if (!current.selected.has(sid)){
                    current.selected.clear();
                } else {
                    current.selected.add(sid);
                }
            }
            else {
                if (current.selected.has(sid)) {
                    current.selected.remove(sid);
                }
                else {
                    current.selected.add(sid);
                }

            }
            current.selected.add(sid);            
            current.triple = triple;
            current.shape = sid;
        }
    }



    function moveShapes(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        
        if (triple.id !== current.triple.id && triangleDirection(triple) === triangleDirection(current.triple)) {
            var moveTriple = triple.subtract(current.triple);

            invoker.push(MoveShapeAction, "forward", [current.selected.keys(), moveTriple]);

            current.triple = triple;
        }
        
    }
    this.moveShapes = moveShapes;

    function eraseTriangle(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);

        if (invertedIndex.has(triple.id)) {
            invoker.push(EraseTriangleAction, "forward", [triple, invertedIndex.at(triple.id).slice()]);
        }   
        
    }

    var marqueRect = new Path.Rectangle(new Point(100, 100), new Point(200, 200));
    marqueRect.strokeColor = "#0af";
    marqueRect.strokeWidth = 1;
    marqueRect.visible = false;
    
    function marqueShapes(event) {

        current.triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);

        // make the marque
        var p1 = project.activeLayer.globalToLocal(event.downPoint);
        var p2 = project.activeLayer.globalToLocal(event.point);

        if (p2.x < p1.x) {
            var temp = new Point(p1);
            p1 = p2;
            p2 = temp;    
        }
        if (p1.y > p2.y) {
            var temp = p1.y;
            p1.y = p2.y;
            p2.y = temp;
        }

        var pts = [[p1.x, p1.y], [p2.x, p1.y], [p2.x, p2.y], [p1.x, p2.y]];
        for (var i = 0; i < 4; i++) {
            marqueRect.segments[i].point.x = pts[i][0];
            marqueRect.segments[i].point.y = pts[i][1];
        }
        marqueRect.visible = true;

        // now find all the shapes
        var range = p2.subtract(p1);
        
        for (var i = 0; i <= range.x; i+= alt) {
            for (var j = 0; j <= range.y; j+= side*0.25) {

                var qp = p1.add(new Point(i, j));
                var triple = worldToTriple(qp, alt);
                
                if (invertedIndex.has(triple.id)) {
                    var shapeIds = invertedIndex.at(triple.id);

                    for (var k = 0; k < shapeIds.length; k++) {
                        var sid = shapeIds[k];
                        if (current.selected.has(sid) && modifierStates["shift"]) {
                            current.selected.remove(sid);
                        }
                        else {
                            current.selected.add(sid);
                        }
                    }
                }
            }
        }
    }
    
    function marqueShapesUp(event) {
        marqueRect.visible = false;
    }


    var offsetRect = new Path.Rectangle(new Point(), new Point());

    function offsetRectDrag(event) {
        offsetRect.remove();
        var p1 = project.activeLayer.globalToLocal(event.downPoint);
        var p2 = project.activeLayer.globalToLocal(event.point);
        offsetRect = new Path.Rectangle(p1, p2);
        offsetRect.strokeColor = "#0f4";
        offsetRect.strokeWidth = 1;
        
    }
    
    function offsetRectUp(event) {
        console.log(event);
        offsetsForAllOuter(4, allOuters, 30, offsetRect);
        offsetRect.remove();
    }

    function cloneCurrentAppearence(event) {
        
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        var cloneTo = shapes.highestFromArray(invertedIndex.at(triple.id));
        console.log(cloneTo);
        if (modifierStates["command"]) {
            current.shape = cloneTo;
        }
        else if (cloneTo !== undefined) {
            var cloneFromAppearence = clone(shapes.get(current.shape).appearence);
            var currentAppearence = clone(shapes.get(cloneTo).appearence);
            invoker.push(CloneAppearenceAction, "forward", [cloneTo, currentAppearence, cloneFromAppearence]);
        }
        
    }

    function escape() {
        current.selected.clear();
    }

    function deleteSelected() {

        console.log("deleted");
        var shapeIds = current.selected.values();
        current.selected.clear();
        if (shapeIds.length === 0) {
            return;
        }
        
        var triplesArray = shapeIds.map(function(id) {
            return shapes.get(id).values().map(function(t) {
                return new Triple(t);
            });
        });

        invoker.push(DeleteShapesAction, "forward", [shapeIds, triplesArray]);

    }

    function callEventFactory(eventType) {
        
        return function(event) {
            if (modifierStates["option"] && current.mode.option) {
                console.log(modifierStates["option"]);
                current.mode.option[eventType].apply(null, [event]);
            }
            else {
                current.mode[eventType].apply(null, [event])
            }
            if (eventType == "onMouseScroll") {
                view.draw();
            }
        }
    }

    function createMouseMode(key, mouseDown, mouseDrag, mouseScroll, mouseUp, option) {
        return {
            key: key,
            onMouseDown: mouseDown,
            onMouseDrag: mouseDrag,
            onMouseScroll: mouseScroll,
            onMouseUp: mouseUp,
        };
    }
    var none = function() {};
    
    this.modes = {
        "view": createMouseMode("v", none, pan, zoom, none),
        "draw": createMouseMode("a", findShape, addTriangle, pan, none),
        "select": createMouseMode("s", selectShapes, marqueShapes, pan, marqueShapesUp),
        "shink": createMouseMode("d", findShape, removeTriangle, pan, none),
        "move": createMouseMode("m", selectShapes, moveShapes, pan, none),
        "erase": createMouseMode("e", eraseTriangle, eraseTriangle, pan, none),
        "offsetRect": createMouseMode("b", none, offsetRectDrag, none, offsetRectUp),
        "clone": createMouseMode("c", cloneCurrentAppearence, cloneCurrentAppearence, pan, none),
    };

    for (var modeKey in this.modes) {
        this.modes[modeKey].option = this.modes["view"];
    }

    var modeKeys = {};
    for (var name in this.modes) {
        modeKeys[this.modes[name].key] = name;
        this.modes[name].name = name;
    }

    this.selectMode = function(nameOrKey) {
        var mode = this.modes[modeKeys[nameOrKey]];
        if (mode !== undefined) {
            current.mode = mode;
        }
        else {
            // we are presuming name is valid
            current.mode = this.modes[nameOrKey];
        }
        
        ui.updateTool(current.mode.name);
    };

    var modifierStates = { "command": false, "control": false, "option": false, "shift": false };
    var modifiers = Object.keys(modifierStates);
    

    this.tool = new Tool();
    
    var mouseEvents = ["onMouseDown", "onMouseUp", "onMouseDrag", "onMouseScroll"];

    this.restoreDefaultTools;
    (this.restoreDefaultTools = function() {
        mouseEvents.forEach(function(eventType){
            this.tool[eventType] = callEventFactory(eventType);
        });
    })();


    function atLeastOneModifier() {
        for (var key in modifierStates) {
            if (modifierStates[key]) {
                return true;
            }
        }
        return false;
    }
    
    var that = this;
    this.tool.onKeyDown = function onKeyDown(event) {

        var ret = true;

        // windows?
        if (event.key === "control") {
            event.key = "command";
        }
        
        // console.log(event);

        if (event.key in modifierStates) {
            modifierStates[event.key] = true;
        }
        else if (atLeastOneModifier()) {
            for (var key in modifierStates) {
                event.modifiers[key] = modifierStates[key];
            }

            ret = keyHandler.call(event);
        }
        else if (modeKeys[event.key] !== undefined) {
            // current.mode = that.modes[modeKeys[event.key]];
            that.selectMode(event.key);
        }

        if (event.key === "escape") {
            escape();
        }

        if (event.key === "backspace") {
            deleteSelected();
            ret = false;
        }
        

        return ret; // might be false in which case don't do what you normally do
    }

    this.tool.onKeyUp = function onKeyUp(event) {

        if (modifierStates[event.key] !== undefined) {
            modifierStates[event.key] = false;
        }
    }

    // make the scroll event, so it behaves like the others
    
    this.tool.scrollEvent = new ToolEvent(tool, "mousescroll", new MouseEvent());
    this.tool.scrollEvent.point = new Point();
    this.tool.scrollEvent.delta = new Point();

    $("#canvas").bind('mousewheel DOMMouseScroll', function(event){
        that.tool.scrollEvent.point.set(event.offsetX, event.offsetY);
        that.tool.scrollEvent.delta.x = -event.originalEvent.deltaX * 0.5;
        that.tool.scrollEvent.delta.y = -event.originalEvent.deltaY * 0.5;
        that.tool.onMouseScroll(that.tool.scrollEvent);
        event.preventDefault();
    });

}

function Current() {
    this.triple = null;
    var shape = null;
    this.selected = new Set();
    this.triangleSize = 50;
    this.gridStrokeColour = new Color($("#gridcolour").val() * 0.01);

    Object.defineProperty(this, 'shape', {
        get: function() {
            return shape;
        },
        set: function(v) {
            ui.setCurrentShape(v);
            shape = v;
        },
        configurable: true,
    });

    this.selected.removecb = function(shapeId) {
        shapes.get(shapeId).outline.selected = false;
    };

    this.selected.addcb = function(shapeId) {
        shapes.get(shapeId).outline.selected = true;
    };

    return this;
}

project.activeLayer.transformContent = false;



function setTriangleSize(s) {
    
    side = s;
    alt = Math.sqrt(3) * side * 0.5;
    nx = Math.floor(boundsSize.width / alt) + 1;
    ny = Math.floor(boundsSize.height / side * 2) + 1;

    gridGroup = drawGrid(gridGroup);

    db = createDatabase(new Size(nx, ny)); 

    shapes.removeOutside(db, invertedIndex);

    shapes.draw();
    current.triangleSize = s;
    project.view.draw();
}


var gridGroup = new Group();
// gridGroup = drawGrid(gridGroup);

var nx = 0, ny = 0, side = 0, alt = 0;
var boundsSize = new Size(1520, 1032);

var boundingRect = new Path.Rectangle(new Point(0, 0), boundsSize);
boundingRect.strokeColor = '#b00';

var db = {}; //createDatabase(new Size(nx, ny)); 
var invertedIndex = new InvertedIndex;
var shapes = new Shapes();
var ui = new UI();
var plot = new Plot();

var invoker = new Invoker();
var keyHandler = new KeyComboHandler();
keyHandler.add(["command", "shift", "z"], invoker, "redo"); //function() { invoker.redo(); });
keyHandler.add(["command", "z"], invoker, "undo"); //function() { invoker.undo(); });
keyHandler.add(["command", "p"], plot, "all")
keyHandler.add(["command", "shift", "p"], plot, "selected");

keyHandler.add(["command", "m"], function() {
    // console.log(shapes.shapeIds());
    shapes.shapeIds().forEach(function(id) {
        shapes.get(id).mergeLines();
    });
});

keyHandler.add(["command", "a"], function() {
    filterDuplicateLines(shapes.shapeIds());
});

keyHandler.add(["command", "x"], function() {
    plotOuterOffsets();
    console.log("requested");
});

keyHandler.add(["command", "m"], function() {
    mergeShapes();
});

keyHandler.add(["command", "d"], function() {
    duplicateSelected();

});


var action = new Action(invoker, keyHandler);

var current = new Current();
action.selectMode("draw")

setTriangleSize($("#gridsize").val());
gridGroup.strokeColor = new Color($("#gridcolour").val() * 0.01);
view.draw();

/*

MODES

constructive mode - everthing drag
notes


so many amazing things about paper.js
strokescaling = false, was a life saver!
.transformContent = false took me ages to figure out!
compoundPath is a joy to work with

it's 30% slower to do the constant slicing on getPerimiter, but it can haldle holes a lot nicer
*/

function wm(m) {
    $("#messages").append("<p>" + m + "</p>");
    if ($("#messages p").length > 10) {
        $('#messages p:lt(2)').remove();
    }
}


var testPlotterConnection = null;
(testPlotterConnection = function() {
    $.ajax(HOST + "/test/", {
        error: function(xhr, status, error) {
            console.log("ERROR: " + status + ", " + error);
        }
    }).done(function(json) {
        var data = JSON.parse(json);
        ui.updateStatus(data);
    }).fail(function(e){
        ui.updateStatus(false);
        console.log("fail");
    });
})();

// window.onerror = function(message, url, lineNumber) {
//    console.log(message);
// };

// var testConnectionInterval = setInterval(testPlotterConnection, 5000);
