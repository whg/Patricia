function requestOffsets(shapeId, data, cb) {
    console.log(data);
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
    console.log(data);
    allOuters.removeChildren();
    requestOffsets(0, data, function(data) {
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
