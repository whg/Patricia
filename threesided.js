var sqrt3 = Math.sqrt(3);

var side = 50;
var alt = sqrt3 * side * 0.5;


var nx = 13;
var ny = 18;
    
var boundsSize = new Size(nx*alt, ny*side);

var os = new Point(0, 0);

var Index = Point;
Index.prototype.toString = function() {
    return this.x + "," + this.y;
}

function Triple(n, p, h) {
    this.n = n;
    this.p = p;
    this.h = h;
    
    this.clone = function() {
        return new Triple(this.n, this.p, this.h);
    }
    
    this.sum = function() {
        return this.n + this.p + this.h;
    }
    
    this.map = function(cb) {
        return new Triple(cb(this.n), cb(this.p), cb(this.h));
    }
    
    this.toString = function() {
        return this.n + "," + this.p + "," + this.h;
    }
}


function sorted(a) { 
    var b = a.slice(0); 
    b.sort(); 
    return b; 
}

function Edge(start, end) {
    this.start = start;
    this.end = end;
    
    //create an id where the start and the end doesn't matter
    this.getId = function () {
        var id = this.start.id + "-" + this.end.id;
        return sorted(id.split('-')).join('-');
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

function Line(startIndex, endIndex) {
    this.start = startIndex;
    this.end = endIndex;
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




function drawAllPoints() {
    for(var i = 0; i < nx; i++) {
        for(var j = 0; j < ny; j++) {
            var index = new Index(i, j);
            
            if (isValidGridIndex(index)) {
                var sq = new Path.Circle(pointAtGridIndex(index) + os, 2.5);
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
    var line = new Line();
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

function drawGridLines(type, size) {
    var n = numLines(type, size);
    var line = firstLine(type, size);
    
    for (var i = 0; i < n; i++) {
        var p = new Path.Line({
            from: pointAtGridIndex(line.start) + os,
            to: pointAtGridIndex(line.end) + os,
            strokeColor: '#aaa'
        });
        line = nextLine(line, type, size);
    }
}

function drawGrid() {
    drawGridLines('N', new Index(nx, ny));
    drawGridLines('P', new Index(nx, ny));
    drawGridLines('H', new Index(nx, ny));
}


function _project(point, line) {
    /// use dot product to project a point on to a line

    var toP = point - pointAtGridIndex(line.start);
    var toEnd = pointAtGridIndex(line.end) - pointAtGridIndex(line.start);
    
    var l = toEnd.length;
    var dp = toP.dot(toEnd);
    dp/= l*l;
    
    var proj = toEnd * dp;
    proj = proj + pointAtGridIndex(line.start);
    return proj;
}

function distanceToLine(point, line) {
    /// signed distance between point and line
    /// negative distance if point.y < projected.y 
    
    var proj = _project(point, line);
    var len = (proj - point).length;
    
    if (point.y < proj.y) {
        len = -len;
    }
    
    return len;
}

function axisLine(type) {
    var line = new Line();
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
            from: pointAtGridIndex(axes[i].start) + os,
            to: pointAtGridIndex(axes[i].end) + os,
            strokeColor: '#00f'
        });
    }
}

// drawAxes();
var axes = getAxes();

function interceptForAxis(axis, number) {
    if (axis === 'P') {
        return (number + 1) * 2 - 1;
    }
    else if (axis === 'N') {
        return number * 2 + 1;
    }
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
            new Index(sides.h, sides.h + interceptForAxis('N', sides.n)),
            new Index(sides.h+1, interceptForAxis('P', sides.p) - (sides.h+1)),
            new Index(sides.h, interceptForAxis('P', sides.p) - sides.h)
        ];
    }
    else if (direction == 'B') {
        verts = [
            new Index(sides.h-1, sides.h - 1 + interceptForAxis('N', sides.n)),
            new Index(sides.h, interceptForAxis('P', sides.p) - sides.h),
            new Index(sides.h, sides.h + interceptForAxis('N', sides.n))
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
        Math.abs(worldToLocal(point, alt, axes.h)));
}


// a basic Set class
// usage:
//   var s = new Set();
//   s.add(5);
function Set() {
    this._values = {};
    
    this.has = function(e) {
        // this is the fastest way to do this
        // http://jsperf.com/regex-vs-indexof-vs-in
        return this._values[e] !== undefined;
    }
    this.add = function(e) {
        if (!this.has(e)) {
            this._values[e] = e;
            return true;
        }
        return false;
    }
    
    this.values = function() {
        return Object.keys(this._values);
    }
    
    this.toString = function() {
        console.log("Set( " + this.values().join(', ') + " )");
    }
    
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

function createTriangle(tid, vertices) {
    return {
        'id': tid,
        'vertices': vertices,
        'edges': [
            new Edge(vertices[0], vertices[1]),
            new Edge(vertices[1], vertices[2]),
            new Edge(vertices[2], vertices[0]),
        ],
    }
}

function createDatabase(size) {
    var db = {};
    var triples = triplesForDimension(new Size(nx, ny));
    for(var i = 0; i < triples.length; i++) {
        var verts = verticesForTriple(triples[i]);
        db[triples[i].id] = createTriangle(triples[i].id, verts);
    }
    return db;
}
 
var db = createDatabase(); 

var pts = new Set();

function getPerimeterEdges(pntSet) {
    var outerEdges = {};
    var vs = pntSet.values();
    
    //we want only one occurence of each edge,
    //add things to an object, if the key is there delete...
    //this makes it nicely linear in time
    for (var i = 0; i < vs.length; i++) {
        // console.log(vs[i]);
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
    var perim = pathFromPerimeterEdges(outerEdges);
    makeOutline(perim, outline);
}

// TODO: return multiple paths for shapes with holes
function pathFromPerimeterEdges(edges) {
    // takes the object created by getPerimeterEdges(),
    // namely, an object with edge ids as keys and
    // edge objects as values
    // return an the edges in the correct order
    
    var starts = {}, ends = {}, n = 0;
    for(var key in edges) {        
        var e = edges[key];
        starts[e.start.id] = e;
        ends[e.end.id] = e;
        n++;
    }
        
    var start = sorted(Object.keys(starts))[0];
    
    var perim = [starts[start]];
    for(var i = 1; i < n; i++) {
        var prevEdge = perim[i-1];
        var nextEdge = starts[prevEdge.end.id]
        perim.push(nextEdge);
    }
        
    return perim;
}


function makeOutline(perim, outline) {
    outline.removeSegments();
    outline.addSegment(pointAtGridIndex(perim[0].start) + os);
    // console.log(perim[0].start);
    for(var i = 0; i < perim.length; i++) {
        outline.addSegment(pointAtGridIndex(perim[i].end) + os);
        // console.log(perim[i].end);
    }
}

function Transport() {
    
}


function onMouseDrag(event) {
    // console.log(keydown);
    if(keydown) {
    var t;
    // t = indexPoints(event);
    // t = searchAll(event);
    // console.log("time = " + t);
    var triple = worldToTriple(event.point-os, alt);
    // console.log(triple);
    // pts.add(triple.str());
    pts.add(triple.id);
    times.push(t);
    
    var start = performance.now();
    getPerimeterEdges(pts);
    var end = performance.now();
    var time = end - start;
    // console.log("perim tixxxzme = " + time);

    // var vs = pts.values();
    // // console.log(vs);
    // for(var i = 0; i < vs.length; i++) {
    //     console.log(db[vs[i]].edges);
    // }
    }
    
    else {
        if(!keydown) {
            // project.activeLayer.translate()
            var q = event.point - mouseDownPoint;
            // console.log(q.x * 1.00001);
            // // var p = scale;       
            // var sc = 1 + (q.x*0.1);
            // tMatrix.set(sc, 0, 0, sc, scalePoint.x, scalePoint.x, scalePoint.y);
            // project.activeLayer.transform(tMatrix);

            // project.activeLayer.translate(scalePoint.negate());
            project.activeLayer.scale(1 + (q.x*0.1), scalePoint);
            // project.activeLayer.translate(scalePoint);
            mouseDownPoint = new Point(event.point.x, event.point.y);
        console.log(project.activeLayer.matrix);
    console.log(project.activeLayer.globalToLocal(event.point));
    console.log(project.activeLayer.localToGlobal(event.point));
        }
        else {
        var q = event.delta; //event.point - mouseDownPoint;
        //if(q === undefined) q = event.point - mouseDownPoint;
        tMatrix.set(1, 0, 0, 1, q.x, q.y);
        os = os + q;
        // project.activeLayer.translate(event.point - mouseDownPoint);
        mouseDownPoint = new Point(event.point.x, event.point.y);
        // console.log(project.activeLayer.matrix);
        debugger;
        project.activeLayer.transform(tMatrix);
        console.log(project.activeLayer.matrix);
        console.log(event.downPoint);
         }
    }
}

var mouseDownPoint, keydown, mouse, scalePoint;
var tMatrix = new Matrix();
keydown = false;
// onMouseDown = onMouseDrag;
function onMouseDown(event) {
    mouseDownPoint = new Point(event.point.x, event.point.y);
    scalePoint = new Point(event.point.x, event.point.y);
    //onMouseDrag(event);    
}

function onKeyDown(event) {
    keydown = true;
    // console.log(project.activeLayer.globalToLocal(mouse));
    
    // if(event.key == 'i') console.log("III");
    // for (let item of pts.values()) console.log(item);
    // console.log(pts);
    // var vs = pts.values();
    // console.log(vs);
    // for(var i = 0; i < vs.length; i++) {
    //     console.log(db[vs[i]].edges);
    // }
}

function onKeyUp(event) {
    keydown = false;
}

drawGrid();
var outline = new Path({
    strokeColor: 'black',
    fillColor: "#adc",
    // closed: true,
});

// debugger;
console.log(new Matrix()["scale"]);

// project.activeLayer.scale(d2);

// console.log();
// console.log(db);
            
// drawAllPoints();

// console.log(avg([12,243.4,3.2,4,5.5]));

// for(var i = 1; i < nx; i+=2) {
//     console.log(i);
//     var sq = new Path.Circle(pointAtIndex(new Index(i, ny)) + os, 2.5);
//     sq.fillColor = "#bbb";
// }
