

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
