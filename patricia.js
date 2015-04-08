

var sqrt3 = Math.sqrt(3);
var HOST = "http://localhost:5000";

project.activeLayer.transformContent = false;

var allOuters = new Group();
var gridGroup = new Group();
var axes = getAxes();
var nx = 0, ny = 0, side = 0, alt = 0;
var boundsSize = new Size(1520, 1032);

var boundingRect = new Path.Rectangle(new Point(0, 0), boundsSize);
boundingRect.strokeColor = '#b00';

var db = {}; //createDatabase(new Size(nx, ny)); 
var invertedIndex = new InvertedIndex;
var shapes = new Shapes();
var ui = new UI();
var plot = new Plot();

var invoker = new Invoker();
var keyHandler = new KeyComboHandler();
keyHandler.add("redo", ["command", "shift", "z"], invoker, "redo");
keyHandler.add("undo", ["command", "z"], invoker, "undo");
keyHandler.add("plot", ["command", "p"], plot, "all")
keyHandler.add("plotSelected", ["command", "shift", "p"], plot, "selected");
keyHandler.add("merge", ["command", "m"], mergeShapes);
keyHandler.add("duplicate", ["command", "d"], duplicateSelected);
keyHandler.add("download", ["command", "s"], ui, "download");
keyHandler.add("upload", ["command", "o"], ui, "upload");
keyHandler.add("export", ["command", "e"], ui, "exportCanvas");

keyHandler.add("plotoffsets", ["command", "x"], function() {
    plotOuterOffsets();
});

var action = new Action(invoker, keyHandler);
action.modes = {
    "drawfollow": createMouseMode("f", findShape, addTriangleFollow, pan, none),
    "select": createMouseMode("s", selectShapes, marqueShapes, pan, marqueShapesUp),
    "shink": createMouseMode("d", findShape, removeTriangle, pan, none),
    "move": createMouseMode("m", selectShapes, moveShapes, pan, none),
    "erase": createMouseMode("e", eraseTriangle, eraseTriangle, pan, none),
    "offsetRect": createMouseMode("b", none, offsetRectDrag, none, offsetRectUp),
    "clone": createMouseMode("c", cloneCurrentAppearence, cloneCurrentAppearence, pan, none),
};
action.initModes();

action.addMode("draw", createMouseMode("a", findShape, addTriangle, pan, none));

var current = new Current();
action.selectMode("draw")

setTriangleSize($("#gridsize").val());
gridGroup.strokeColor = new Color($("#gridcolour").val() * 0.01);
view.draw();

testPlotterConnection();
