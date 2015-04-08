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
