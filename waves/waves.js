var HOST = "http://localhost:5000";

function box(x, y, w, h, n, randomness, dir) {
    if (!x) x = 0;
    if (!y) y = 0;
    if (!w) w = 100;
    if (!h) h = 100;
    if (!n) n = 100;
    if (!randomness) randomness = 0;
    if (!dir) dir = -1;


    var t = new Point(x, y);
    var debug = false;
    
    var rs = [
        new Path.Line(t.add(new Point(x, y)), t.add(new Point(x+w, y))),
        new Path.Line(t.add(new Point(x+w, y)), t.add(new Point(x+w, y+h))),
        new Path.Line(t.add(new Point(x+w, y+h)), t.add(new Point(x, y+h))),
        new Path.Line(t.add(new Point(x, y+h)), t.add(new Point(x, y))),
    ];

    if (debug) rs.forEach(function(p) { p.strokeColor = "black"; });

    var start, end, l;
    function initLine() {
        var _dir = dir;
        if (dir === -1) {
            _dir = Math.random();
        }
        start = t.add(new Point(x, y)); //Math.random()*200, 0));
        end = t.add(new Point(_dir*w*4 + x, y+h));
        l = new Path.Line(start, end);

    }
    // l.strokeColor = "red";

    if (debug) {
        var result = new Path();
        result.strokeColor = "black";
        result.add(l.segments[0].point);
    }

    function nextPoint() {
        for (var i = 0; i < rs.length; i++) {
            var isects = rs[i].getIntersections(l);
            if (isects.length > 0) {
                if (isects[0].point.subtract(l.segments[0].point).length < 1) {
                    continue;
                }

                var p = isects[0].point;
                var to = l.segments[0].point.subtract(p);
                var edge = rs[i].segments[0].point.subtract(p);


                var a = to.getAngle(edge);
                // console.log(a);

                if (a < 90) {
                    a = -(90 - a) * 2;
                } else {
                    a = (a - 90) * 2;
                }
                
                a += Math.random() * randomness - randomness * 0.5;

                var n = l.segments.length;
                var end = l.segments[0].point.rotate(a, p);
                l.segments[0].point = p;

                var dir = end.subtract(p);
                var end = p.add(dir.normalize().multiply(w+h));

                l.segments[1].point = end;

                if (debug) result.add(p);

                return p;
            }
        }
    }

    for (var i = 0; i < 10; i++) {
        initLine();
        var points = range(n).map(nextPoint);
        if (points[n-1] !== undefined) {
            return points;
        }
        
        // console.log(points);
    }
    return null;
    // return new Path(points);
        
}

// var img = new Raster("imgs/willandzand.jpg");
// var img = new Raster("imgs/maiaandme.png");
// var img = new Raster("imgs/maxsmile.jpg");

var filename = "imgs/mick 3.jpg"
if (window.location.hash) {
    filename = window.location.hash.substr(1);
}
var img = new Raster(filename);

var swi = null;
img.onLoad = function() {
    // swi = new SineWaveImage(img, 20);
    swi = new SquareImg(img, 40);
};


function SineWaveImage(img, gap) {

    this.data = img.getImageData();

    this.squashImage = function(data) {
        var bpp  = 4; // I think paper.js always uses 4 channels

        var result = new Array(data.width, attrs.nrows);
        for (var x = 0; x < data.width; x++) {
            for (var y = 0; y < attrs.nrows; y++) {
                var sum = 0;
                var ny = y * attrs.gap;
                for (var k = 0; k < attrs.gap; k++) {
                    sum+= data.data[((ny + k) * data.width + x) * bpp];
                }

                result[y * data.width + x] = sum / attrs.gap / 255.0;
            }
        }
        return result;
    }
    

    var attrs = {
        multiplier: 2,
        _gap: 25,
        amp: 1,
        width: img.size.width,
        height: img.size.height,
        xstep: 1,
    };
    
    Object.defineProperty(attrs, "gap", {
        set: function(v) {
            v = Math.round(v);
            this.nrows = Math.floor(this.height / v);
            this._gap = v;
        },
        get: function() {
            return this._gap;
        }
    });
    attrs.gap = gap;
    
    this.attrs = attrs;
    
    function transform(v) {
        return (1 - v) * attrs.multiplier;
    }

    function spaceout(v) {
        return v * attrs.gap + attrs.gap * 0.5;
    }
    
    this.group = new Group();
    
    this.draw = function() {

        var pos = this.group.position;
        this.group.removeChildren();

        for (var y = 0; y < attrs.nrows; y++) {
            var line = new Path();
            var phase = 0;
            for (var x = 0; x <= attrs.width; x+= attrs.xstep) {
                phase+= transform(this.squashed[Math.round(y * attrs.width + x)]);
                var ny = Math.sin(phase) * attrs.gap/2 * attrs.amp + spaceout(y);
                line.add(new Point(x, ny));
            }
            line.strokeColor = 'black';
            this.group.addChild(line);
        }

        this.group.position = pos;
    };

    this.squashed = this.squashImage(this.data);
    this.draw();
    img.visible = false;
}

function SquareImg(img, gap) {

    this.data = img.getImageData();
    this.points = box(0, 0, 100, 100);
    
    this.squashImage = function(data) {
        var bpp  = 4; // I think paper.js always uses 4 channels

        var result = new Array(data.width, attrs.nrows);
        for (var x = 0; x < attrs.ncols; x++) {
            for (var y = 0; y < attrs.nrows; y++) {
                var sum = 0;
                var nx = x * attrs.gap;
                var ny = y * attrs.gap;
                for (var n = 0; n < attrs.gap; n++) {
                    for (var m = 0; m < attrs.gap; m++) {
                        sum+= data.data[((ny + n) * data.width + nx+m) * bpp];
                    }
                }

                // scale to 100
                result[y * attrs.ncols + x] = 100 - sum / (attrs.gap * attrs.gap) / 2.55;
            }
        }
        return result;
    }
    

    var attrs = {
        multiplier: 2,
        _gap: 25,
        amp: 1,
        width: img.size.width,
        height: img.size.height,
        xstep: 1,
        random: 1,
        dir: 1,
    };
    
    Object.defineProperty(attrs, "gap", {
        set: function(v) {
            v = Math.round(v);
            this.nrows = Math.floor(this.height / v);
            this.ncols = Math.floor(this.width / v);
            this.boxScale = v / 100.0;
            this._gap = v;
        },
        get: function() {
            return this._gap;
        }
    });
    attrs.gap = gap;
    
    this.attrs = attrs;
    
    function transform(v) {
        return (1 - v) * attrs.multiplier;
    }

    function spaceout(v) {
        return v * attrs.gap + attrs.gap * 0.5;
    }

    this.update = function() {
        // this.points = box(0, 0, 100, 100, 100, attrs.random, attrs.dir * 0.1);
        // console.log(attrs.xstep * 5);
        var p = zigzagLinesForShape(attrs.dir*4, attrs.xstep*5, new Path.Rectangle(new Point(0, 0), new Size(100, 100)))[0];
        p.position = new Point(0, 0);
        // console.log(p.segments[0].point);
        this.points = p.segments;
    }
    this.update();
    
    this.group = new Group();
    
    this.draw = function() {



        var pos = this.group.position;
        this.group.removeChildren();
        var div = 1 + attrs.multiplier * 4;
        for (var y = 0; y < attrs.nrows; y++) {
            for (var x = 0; x < attrs.ncols; x++) {
                // var r = new Path.Rectangle(new Point(x*attrs.gap, y*attrs.gap), new Size(attrs.gap, attrs.gap));
                // r.fillColor = new Color(this.squashed[y * attrs.ncols + x] / 100.0);
                // this.points = box(0, 0, 100, 100, 100, attrs.random, attrs.dir * 0.1);
                var to = this.squashed[y * attrs.ncols + x];
                var n = 2 + Math.floor(to);
                var r = new Path();

                
                // for (var k = 0; k < n; k++) {
                //     var p = this.points[k];
                //     if (p === undefined) break;
                //     r.add(new Point(p.point));
                // }
                // console.log(r.segments[0].point);
                var r = new Path(this.points.slice(0, 2 + Math.floor(to/div)));
                r.pivot = new Point(0, 0);
                r.translate(new Point(x*attrs.gap, y*attrs.gap));
                r.scale(new Point(attrs.boxScale * attrs.amp));
                r.strokeColor = "black";

                this.group.addChild(r);
                // break;
            }
            // break;

        }
        this.group.pivot = new Point(0, 0);
        this.group.position = new Point(0, 0);
        // group.this.position = pos;
    };

    this.squashed = this.squashImage(this.data);
    this.draw();
    img.visible = false;
}


function UI() {

    extend(this, new BaseUI);

    function inputRangeUpdate(e, commit) {
        var name = $(this).attr("name");
        var value = parseInt($(this).val());
        console.log(name + ", " + value);
        swi.attrs[name] = value / 10.0;
        console.log(swi.attrs);
        if (name === "gap") {
            swi.squashed = swi.squashImage(swi.data);
        }
        else if (name === "dir" || name === "random" || name === "xstep") {
            swi.update();
        }
        swi.draw();
    }

    
    $("#controls").on("mousedown", "input[type=range]", function(e){
        console.log("bind");
        $(this).bind("mousemove", inputRangeUpdate);
    });

    $("#controls").on("mouseup", "input[type=range]", function(e){
        console.log("unbind");
        inputRangeUpdate.apply(this,[null, true]);
        $(this).unbind("mousemove", inputRangeUpdate);
    });
    
}

var downPos = undefined;
function getPos(event) {
    downPos = new Point(swi.group.position);
}
function moveSwi(event) {
    var diff = event.point.subtract(event.downPoint);
    swi.group.position = downPos.add(diff);
    console.log(swi.group.position);
}




project.activeLayer.transformContent = false;




var boundsSize = new Size(1520, 1032);
var boundingRect = new Path.Rectangle(new Point(0, 0), boundsSize);
boundingRect.strokeColor = '#b00';

var ui = new UI();
var keyHandler = new KeyComboHandler();

keyHandler.add("plot", ["command", "p"], function() {
    var data = {
        "1": swi.group.children.map(function(e) {
            return e.segments;
        }),
    }
    plotData(data);
});


var current = new Current();
var action = new Action(null, keyHandler);
action.addMode("draw", createMouseMode("a", getPos, moveSwi, pan, none));

action.selectMode("draw")


view.draw();



// var tool = new Tool();
// tool.onKeyDown = function(event) {
//     console.log(event);
// }
action.keyDownCallback = function(event) {
    console.log(event);
    if (event.key === "z") {
        swi.points = box(0, 0, 100, 100, 100, swi.attrs.randomness);
        swi.draw();
    }
}
