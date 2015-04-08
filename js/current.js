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
