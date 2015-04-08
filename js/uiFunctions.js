function pan(event) {
    project.activeLayer.translate(event.delta);
}

function zoom(event) {
    project.activeLayer.scale(1 + (event.delta.y * 0.005), event.point);
}


function addTriangle(event, follow) {
    var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
    if (!isValidTriple(triple)) {
        return;
    }

    
    if (!shapes.get(current.shape).has(triple)) {
        invoker.push(ExtendShapeAction, "forward", [triple, current.shape]);
    }
    else if (follow){
        if (invertedIndex.has(triple.id) && triple.id !== current.triple.id) {
            invoker.push(ExtendShapeAction, "backward", [current.triple, current.shape]);
        }
    }
    current.triple = triple;
}

function addTriangleFollow(event) {
    return addTriangle(event, true);
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

function eraseTriangle(event) {
    var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);

    if (invertedIndex.has(triple.id)) {
        invoker.push(EraseTriangleAction, "forward", [triple, invertedIndex.at(triple.id).slice()]);
    }   
    
}

var marqueRect = new paper.Path.Rectangle(new paper.Point(100, 100), new paper.Point(200, 200));
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
