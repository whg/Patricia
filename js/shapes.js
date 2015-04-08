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

            var data = dataObj[shapeId];

            if (data.triples == false) { // empty object
                continue;
            }

            shapes[shapeId] = new TShape(data);
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

