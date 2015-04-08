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
    
    action.tool.onMouseMove = moveShapes;
    action.tool.onMouseDown = function() {
        action.restoreDefaultTools()
        action.tool.onMouseMove = null;
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

