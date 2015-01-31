// function go(){
paper.install(window);
paper.setup(document.getElementById("canvas")); 

var sqrt3 = Math.sqrt(3);


var Index = Point;
Index.prototype.toString = function() {
    return this.x + "," + this.y;
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

function Edge(start, end, type) {
    this.start = start;
    this.end = end;
    this.type = type;
    
    //create an id where the start and the end doesn't matter
    this.getId = function () {
        var id = this.start.id + "-" + this.end.id;
        return sorted(id.split('-')).join('-');
    }

    this.clone = function() {
        return new Edge(this.start, this.end, this.type);
    }

    this.toString = function() {
        // return this.start.id + "-" + this.end.id;
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

function ILine(startIndex, endIndex) {
    this.start = startIndex;
    this.end = endIndex;
    return this;
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
    }
    
    this.pushNoConsecutive = function(v) {
        if (v == this.peek()) {
            return false;
        }
        return this.pushBasic(v);
    }
    
    if (banConsecutive) {
        this.push = this.pushNoConsecutive;
    }
    else {
        this.push = this.pushBasic;
    }

    this.peek = function() {
        var i = (this.pos - 1 + this.size) % this.size;
        return this.values[i];
    }
    
    this.pop = function() {   
        if (this.pos == 0) {
            this.pos+= this.size;
        }
        this.pos--;
        var ret = this.values[this.pos];
        this.values[this.pos] = undefined;
        return ret;
    }
    return this;
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
    var line = new ILine();
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
            strokeColor: '#bbb',
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
    var line = new ILine();
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

// drawAxes();
var axes = getAxes();

function yIndexFromSide(size) {
    return size * 2 + 1;
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

function worldToTriple(point, alt) {
    // given a point in screen coords, 
    // and the altitude of the triangles
    // return index Triple
    var axes = getAxes();
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

    this.values = function() {
        return Object.keys(this._values);
    };

    this.items = function() {
        var temp = {};
        for (var key in this._values) {
            temp[key] = this._values[key];
        }
        return temp;
    };
    
    this.toString = function() {
        return "Set( " + this.values().join(', ') + " )";
    };

    return this;
}

function SetWithUniverse(universe) {
    // default universe is the database
    extend(this, new Set());

    // this._universe = universe;

    // if (universe === undefined) {
    //     this._universe = db; //createDatabase();
    // }


    this.exists = function(e) {
        // return this._universe[e] !== undefined;
        return db[e] !== undefined;
    }

    this.add = function(e) {
        if (!this.has(e) && this.exists(e)) {
            this._values[e] = e;
            return true;
        }
        return false;
    };
    
    return this;
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
            new Edge(vertices[0], vertices[1], dir == 'F' ? 'N' : 'P'),
            new Edge(vertices[1], vertices[2], dir == 'F' ? 'P' : 'H'),
            new Edge(vertices[2], vertices[0], dir == 'F' ? 'H' : 'N'),
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

// console.log(Object.keys(db));
// var pts = {}; //= new Set(Object.keys(db));

function isValidTriple(triple) {
    return db[triple.id] !== undefined;
}


function getPerimeterEdges(pntSet) {
    var outerEdges = {};
    var vs = pntSet.values();

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

function cartesianProduct(paramArray) {

  function addTo(curr, args) {

    var i, copy, 
        rest = args.slice(1),
        last = !rest.length,
        result = [];

    for (i = 0; i < args[0].length; i++) {

      copy = curr.slice();
      copy.push(args[0][i]);

      if (last) {
        result.push(copy);

      } else {
        result = result.concat(addTo(copy, rest));
      }
    }

    return result;
  }


  return addTo([], Array.prototype.slice.call(arguments));
}

function cartesianProductOf() {
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
            if (sortedStarts.length === 0) {
                break;
            }
            
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

        } while (q++ < 1000);

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

    var routesProduct = cartesianProductOf.apply(undefined, branchRoutes);
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
        // console.log("length  = " + outline.length + ", outline lengths = " + outline.map(function(e) { return e.length; }));
        if (outline.length < mol) {
            
            minOutline = outline;
            mol = outline.length;
        }
    });
    // console.log("with multiple, perims.length = " + minOutline.length);
    // console.log("we have " + perims.length + " outlines");
    return minOutline;
}


function makeOutline(perims, outline) {
    var perim = perims[0];
    if (perim.length === 0) return;

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
    for (var i = 0; i < perims.length; i++) {
        var perim = perims[i];
        var edge = perim[0].clone();
        var edges = [];
        for (var j = 1; j < perim.length; j++) {
            if (perim[j].type === perim[j-1].type) {
                // edgesToRemove.push(j);
                // edges.push(perim[j-1]);
                edge.end = perim[j].end;
            }
            else {
                edges.push(edge);
                edge = perim[j].clone();
            }
        }
        edges.push(edge);
        console.log(edges);
        perims[i] = edges;
    }
    return perims;
}


function TShape(idOrData, order) {

    extend(this, new SetWithUniverse());

    if (idOrData.triples === undefined) {
        this.id = idOrData;
        this.order = order; //Object.keys(shapes).length;
    }
    else {
        this.id = idOrData.id;
        this.order = idOrData.order;
        var triples = idOrData.triples;
        for (var i = 0, l = triples.length; i < l; i++) {
            this.add(new Triple(triples[i]));
        }
        this._values
    }
    
    this.outline = new CompoundPath({
        strokeColor: 'black',
    });

    this.outline.fillColor = new Color(Math.random(), Math.random(), Math.random());

    this.draw = function(getMinOutline) {
        var outerEdges = getPerimeterEdges(this);

        var start = performance.now();
        var perim = pathFromPerimeterEdges(outerEdges, getMinOutline);
        console.log("pathFromPerimeterEdges took " + (performance.now() - start) + "");
        
        makeOutline(perim, this.outline);  
    };   

    this.mergeLines = function(getMinOutline) {
        var outerEdges = getPerimeterEdges(this);
        var perim = pathFromPerimeterEdges(outerEdges, getMinOutline);
        perim = mergeLines(perim);
        makeOutline(perim, this.outline);  
    };

    this.data = function() {
        return {
            "triples": Object.keys(this._values),
            "id": this.id,
            "order": this.order,
        };
    };


    // this.plot = function() {
    //     this.perims = pathFromPerimeterEdges(getPerimeterEdges(this));
    //     var outerEdges = getPerimeterEdges(this);
    //     var perim = pathFromPerimeterEdges(outerEdges);
    //     perim = mergeLines(perim);
    //     makeOutline(perim, this.outline);
    // };
    
    return this;
}




function InvertedIndex() {

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

    var shapes = {};
    this.layer = new Group();

    var ids = 0;
    this.nextId = function() {
        return ids++;
    };
    
    
    this.get = function(key) {
        return shapes[key];
    };

    this.add = function(key) {
        shapes[key] = new TShape(key, Object.keys(shapes).length);
        // shapes[key].outline.setLayer(layer);
        ui.updateShapes(this);
    };

    this.remove = function(key) {
        shapes[key].outline.remove();
        delete shapes[key];
        ui.updateShapes(this);

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
        var ret = {};
        for (var id in shapes) {
            ret[id] = id;
        }
        return ret;
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
            delete shapes[key];
        }
        shapes = {};
    };
    
    this.loadState = function(obj) {

        clear();

        for (var shapeId in obj) {
            shapes[shapeId] = new TShape(obj[shapeId]);
            shapes[shapeId].draw();
        }
    };
    
    this.plot = function() {
        console.log("plotting");
        var paths = [];
        for (var shapeId in shapes) {
            var shape = shapes[shapeId];
            shape.mergeLines(true);
            var lines = shape.outline.children;
            for (var i = 0; i < lines.length; i++) {
                paths.push(lines[i].segments);
            }
        }

        var req = $.ajax({
            url: "save.php",
            type: "POST",
            data: {
                "data": JSON.stringify(paths),
                "folder": "plots",
            },
        }).done(function(filepath) {

            console.log("sent file to plot");
        });

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
    
    return this;
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
  
    
    this.updateShapes = function(shapes) {
        var ids = shapes.keysInOrder();
        $("#shapes").html("");
        for (var i = 0, shape = null; i < ids.length; i++) {
            shape = shapes.get(ids[i]);
            $("#shapes").append("<li key='" + shape.id + "'>Shape " + shape.id + "</li>");
        }
    }

    return this;
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
        console.log("executed " + name + " with " + this.args);
    };

    return this;
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
        console.log("adfsasdfkljasd " + moveTriple);
        return this.forward(shapeIds, moveTriple.inverse());
    },
};

var EraseTriangleAction = {
    "forward": function(triple, shapeIds) {
        for (var i = 0; i < shapeIds.length; i++) {

            shapes.get(shapeIds[i]).remove(triple);

            if (shapes.get(shapeIds[i]).values().length === 0) {
                shapes.remove(shapeIds[i]);
            }
            else {
                shapes.get(shapeIds[i]).draw();
            }
            
            
        }
        invertedIndex.removeAll(triple.id);
        // shapes.get(shapeId).remove(triple);
        
        // // delete invertedIndex[triple];
        // invertedIndex.remove(triple.id, shapeId);
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
      
    },
};


function Invoker() {
    var commands = [];
    var pos = 0;

    this.push = function(action, direction, args) {

        var comm = new Command(action, direction, args);

        if (pos !== commands.length) {
            commands = commands.splice(0, pos);
        }

        commands.push(comm);
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

    this.add = function(keys, obj, func) {
        combos[makeKeyComboId(keys)] = function() { obj[func].apply(obj); };
    };

    this.call = function(event) {
        var keys = keysFromEvent(event);
        var id = makeKeyComboId(keys);
        if (combos[id] !== undefined) {
            combos[id]();
            event.preventDefault();
            return false;
        }
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
        // console.log(invertedIndex);
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        if (!isValidTriple(triple)) {
            return;
        }
        current.triple = triple;
        current.shape = shapes.highestFromArray(invertedIndex.at(current.triple.id));

        if (current.shape === undefined) {
            current.shape = shapes.nextId();

            invoker.push(CreateTriangleAction, "forward", [current.triple, current.shape]);
        }

        
        console.log("current shape = " + current.shape);
       
    }

    function removeTriangle(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        if (invertedIndex.has(current.triple.id) && triple.id !== current.triple.id) {
                // wm("removing at" + triple.id);
            if (shapes.get(current.shape).has(current.triple)) {
                    // wm("deleted at " + triple.id);
                var action = ExtendShapeAction;
                if (shapes.get(current.shape).values().length === 1) {
                    action = CreateTriangleAction;
                }
                invoker.push(action, "backward", [current.triple, current.shape]);
            }
            current.triple = triple;
        }   
        
    }

    function selectShapes(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        var sid = shapes.highestFromArray(invertedIndex.at(triple.id)); //invertedIndex[triple.id];
        console.log(sid);
        console.log(triple);
        if (sid === undefined) {
            for (var shape in current.selected._values) {
                shapes.get(shape).outline.selected = false;
            }

            current.selected.clear();
        }
        else {
            if (!modifierStates["shift"] && !current.selected.has(sid)) {
                for (var shape in current.selected._values) {
                    shapes.get(shape).outline.selected = false;
                }
                
                current.selected.clear();
            }
            
            current.selected.add(sid);
            shapes.get(sid).outline.selected = true;

            current.triple = triple;
        }
        
    }



    function moveShapes(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        
        if (triple.id !== current.triple.id && triangleDirection(triple) === triangleDirection(current.triple)) {
            var moveTriple = triple.subtract(current.triple);

            invoker.push(MoveShapeAction, "forward", [current.selected.values(), moveTriple]);

            current.triple = triple;
        }
        
    }

    function eraseTriangle(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);

        if (invertedIndex.has(triple.id)) {
            invoker.push(EraseTriangleAction, "forward", [triple, invertedIndex.at(triple.id).slice()]);
        }   
        
    }

    var mr = new Path.Rectangle(new Point(100, 100), new Point(200, 200));
    mr.strokeColor = "#0af";
    mr.strokeWidth = 1;
    mr.visible = false;
    var selectedTriples = new SetWithUniverse();
    var c1 = new Path.Circle(new Point(), 2);
    var c2 = new Path.Circle(new Point(), 2);
    c1.fillColor = "red";
    c2.fillColor = "green";
    
    function marqueShapes(event) {

        // for (var shape in current.selected._values) {
        //     shapes.get(shape).outline.selected = false;
        // }

        current.selected.clear();
        
        // mr = new Path.Rectangle(event.downPoint, event.point);
        // mr = new Path.Rectangle(event.downPoint, event.point);
        // mr.strokeColor = "#0f0";
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
        // p1 = Point.min(p1, p2);
        // p2 = Point.max(p1, p2);
        var pts = [[p1.x, p1.y], [p2.x, p1.y], [p2.x, p2.y], [p1.x, p2.y]];
        for (var i = 0; i < 4; i++) {
            mr.segments[i].point.x = pts[i][0];
            mr.segments[i].point.y = pts[i][1];
        }
        mr.visible = true;
        // return;
        // mr.segments[0].point.x = p1.x;
        // mr.segments[0].point.x = p1.x;
        // console.log(event);
        // console.log(mr);

        // var indexRect = new Rectangle(p1, p2);
        // console.log(indexRect);
        var range = p2.subtract(p1);
        console.log(c1.position);
        c1.position = p1;
        c2.position = p2;
        
        for (var i = 0; i < range.x; i+= alt) {
            for (var j = 0; j < range.y; j+= side*0.25) {
                var qp = p1.add(new Point(i, j));
                // var c = new Path.Circle(qp, 2);
                // c.fillColor = "red";

                var triple = worldToTriple(qp, alt);
                // if(!isValidTriple(triple)) {
                //     continue;
                // }
                
                if (invertedIndex.has(triple.id)) {
                    var shapeIds = invertedIndex.at(triple.id);
                    console.log(shapeIds);
                    for (var k = 0; k < shapeIds.length; k++) {
                        var sid = shapeIds[k];
                        current.selected.add(sid);
                        // shapes.get(sid).outline.selected = true;
                    }
                }
                
                // var verts = db[triple.id].vertices;                
                // var outside = false;
                // for (var k = 0; k < 3; k++) {
                //     if (!pointAtGridIndex(verts[k]).isInside(mr)) {
                //         // selectedTriples.add(triple);
                //         outside = true;
                //         break;
                //     }
                // }
                // if (!outside) {
                //     console.log("adding " + JSON.stringify(verts));
                //     selectedTriples.add(triple);
                // }

                
                // console.log(triangle);

                // console.log(triple);
                // selectedTriples.add(triple);
            }
        }
    }

    function marqueShapesUp(event) {
        mr.visible = false;
        return;
        console.log(JSON.stringify(Object.keys(selectedTriples._values)));
        shapes.clear();
        var i = 0;
        for (var tripleId in selectedTriples._values) {
            console.log(selectedTriples._values[tripleId]);
            CreateTriangleAction.forward(selectedTriples._values[tripleId], i++);
            // shapes.add(shapes.nextId());
        }
        selectedTriples.clear();
    }

    function createMouseMode(init, mouseDown, mouseDrag, mouseScroll, mouseUp) {
        return {
            init: init,
            mouseDown: mouseDown,
            mouseDrag: mouseDrag,
            mouseScroll: mouseScroll,
            mouseUp: mouseUp,
        };
    }



    var none = function() {};
    
    var modes = {
        "v": createMouseMode(none, none, pan, zoom, none),
        "a": createMouseMode(none, findShape, addTriangle, pan, none),
        "s": createMouseMode(none, selectShapes, marqueShapes, none, marqueShapesUp),
        "option": createMouseMode(none, none, pan, zoom, none),
        "d": createMouseMode(none, findShape, removeTriangle, pan, none),
        "m": createMouseMode(none, selectShapes, moveShapes, none, none),
        "e": createMouseMode(none, eraseTriangle, eraseTriangle, none, none),
    };

    var modifierStates = { "command": false, "control": false, "option": false, "shift": false };
    var modifiers = Object.keys(modifierStates);
    
    function atLeastOneModifier() {
        for (var key in modifierStates) {
            if (modifierStates[key]) {
                return true;
            }
        }
        return false;
    }

    var currentKey = "a";
    var lastKey = null;
    var pushedMode = false;

    var tool = new Tool();
    
    tool.onMouseDrag = function(event) {
        modes[currentKey].mouseDrag(event);
    }

    tool.onMouseDown = function(event) {
        modes[currentKey].mouseDown(event);
    }

    tool.onMouseScroll = function(event) {
        modes[currentKey].mouseScroll(event);

        paper.view.draw();
    }

    tool.onMouseUp = function(event) {
        modes[currentKey].mouseUp(event);
    }
    

    tool.onKeyDown = function onKeyDown(event) {

        var ret = true;

        console.log(event);
        // modifiers are treated seperately because they
        // don't repeat the call to onKeyDown
        if (event.key in modifierStates) {
            pushedMode = currentKey;
            modifierStates[event.key] = true;
        }
        else if (!pushedMode && currentKey === event.key && lastKey === event.key) {
            // we have repeated
            pushedMode = lastKey;
            // console.log("pushed " + lastKey + "(" + currentKey + ")");
        }
        else {

            //this means it's just a single press of a non modifier
            if (atLeastOneModifier()) {
                for (var key in modifierStates) {
                    event.modifiers[key] = modifierStates[key];
                }
                
                ret = keyHandler.call(event);

            }
        }

        if (modes[event.key] !== undefined) {
            lastKey = currentKey;
            currentKey = event.key;
        }
        // console.log(lastKey + " -> " +currentKey); // + " " + event);


        
        if(event.key == "backspace") {
            return false;
        }

        return ret; // might be false in which caaase don't do what you normally do
    }

    tool.onKeyUp = function onKeyUp(event) {
        if (pushedMode) {
            currentKey = pushedMode;
            console.log("poped, current key = " + currentKey);
            pushedMode = false;
        }
        if (modifierStates[event.key] !== undefined) {
            modifierStates[event.key] = false;
        }
        // event.preventDefault();
    }

    tool.scrollEvent = new ToolEvent(tool, "mousescroll", new MouseEvent());
    tool.scrollEvent.point = new Point();
    tool.scrollEvent.delta = new Point();

    $("#canvas").bind('mousewheel DOMMouseScroll', function(event){

        // console.log(event.originalEvent.deltaX + ", " + event.originalEvent.deltaY + ", " +event.originalEvent.wheelDelta);
        tool.scrollEvent.point.set(event.offsetX, event.offsetY);
        // tool.scrollEvent.delta = event.originalEvent.wheelDelta / 1900.0;
        tool.scrollEvent.delta.x = -event.originalEvent.deltaX * 0.5;
        tool.scrollEvent.delta.y = -event.originalEvent.deltaY * 0.5;
        tool.onMouseScroll(tool.scrollEvent);
        event.preventDefault();
    });

}


project.activeLayer.transformContent = false;



function setTriangleSize(s) {
    
    side = s;
    alt = Math.sqrt(3) * side * 0.5;
    nx = Math.floor(boundsSize.width / alt) + 1;
    ny = Math.floor(boundsSize.height / side * 2) + 1;

    gridGroup = drawGrid(gridGroup);

    db = createDatabase(new Size(nx, ny)); 
    
    // for (var shapeId in shapes._values) {
    //     debugger;
    //     shapes.get(shapeId).draw();
    // }

    shapes.removeOutside(db, invertedIndex);

    shapes.draw();
    current.triangleSize = s;
    project.view.draw();
}




var gridGroup = new Group();
// gridGroup = drawGrid(gridGroup);

var nx = 0, ny = 0, side = 0, alt = 0;
var boundsSize = new Size(1520, 1032);

var rect = new Path.Rectangle(new Point(0, 0), boundsSize);
rect.strokeColor = '#b00';

var db = {}; //createDatabase(new Size(nx, ny)); 
var invertedIndex = new InvertedIndex;
var shapes = new Shapes();
var ui = new UI();
var current = {
    triple: null,
    shape: null,
    selected: new Set(),
    triangleSize: 50,
};

current.selected.removecb = function(shapeId) {
    shapes.get(shapeId).outline.selected = false;
};

current.selected.addcb = function(shapeId) {
    shapes.get(shapeId).outline.selected = true;
};

var invoker = new Invoker();
var keyHandler = new KeyComboHandler();
keyHandler.add(["command", "shift", "z"], invoker, "redo"); //function() { invoker.redo(); });
keyHandler.add(["command", "z"], invoker, "undo"); //function() { invoker.undo(); });
keyHandler.add(["command", "p"], shapes, "plot");


var action = new Action(invoker, keyHandler);

setTriangleSize($("#trianglesize").val());

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
    $("#messages").append("<p>"+m+"</p>");
    if ($("#messages p").length > 10) {
        $('#messages p:lt(2)').remove();
    }
}



$("#download").click(function(e) {

    var data = shapes.getState();
    
    var anchor = $(this);
    var req = $.ajax({
        url: "save.php",
        async: false,
        type: "POST",
        data: {
            "data": JSON.stringify(data),
            "folder": "saves",
        },
    }).done(function(filepath) {

        anchor.attr("href", filepath);
        var parts = filepath.split("/");
        anchor.attr("download", parts[parts.length-1]);

    });

});


$("#upload").click(function(e){

    e.preventDefault();
   $("#fileupload").trigger('click');
});

function loadState(obj) {
    console.log("loading");
    console.log(obj);

    shapes.loadState(JSON.parse(obj));
    for (var shapeId in shapes.shapeIds()) {
        invertedIndex.addShape(shapes.get(shapeId));
    }
    ui.updateShapes(shapes);
}

$("input:file").change(function (){

    var file = $(this).prop("files")[0];
    var fileReader = new FileReader();
    fileReader.onload = function(event) {
        loadState(event.target.result);
    };

    fileReader.readAsText(file);
});


$("#trianglesize").on("mousemove",function(e){
    // console.log();
    var newsize = $(this).val();
    if (newsize !== current.triangleSize) {
        setTriangleSize(newsize);
    }
});

$("#slider").slider();
