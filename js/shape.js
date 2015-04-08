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

function TShape(idOrData, order) {

    extend(this, new SetWithUniverse());

    var that = this;

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
            this.appearence = clone(idOrData.appearence);
            // this.appearence.outline = idOrData.appearence.outline || 1;
            // this.appearence.fill = idOrData.appearence.fill || 1;
            // debugger;
        }
        console.log(this.id + ": " + this.appearence.outline);
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
            console.log("setting outline");
        },
        get: function() {
            console.log("getting outline...");
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
