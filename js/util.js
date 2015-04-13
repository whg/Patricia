function zeropad(number, length) {
    var s = String(number);
    var npad = Math.max(0, length - s.length + 1);
    return Array(npad).join("0") + s;
}

function sorted(a) { 
    var b = a.slice(0); 
    return b.sort(); 
}

function extend(subclass, superclass) {
    for (var key in superclass) {
        subclass[key] = superclass[key];
    }
    return subclass;
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}


function mergeObjects() {
    var r = {};
    for (var ak in arguments) {
        var obj = arguments[ak];
        for (var key in obj) {
            r[key] = obj[key];
        }
    }
    return r;
}

function _project(point, line) {
    /// use dot product to project a point on to a line
    
    var toP = point.subtract(pointAtGridIndex(line.start));
    var toEnd = pointAtGridIndex(line.end).subtract(pointAtGridIndex(line.start));

    var l = toEnd.length;
    var dp = toP.dot(toEnd);
    dp/= l*l;

    var proj = toEnd.multiply(dp);
    proj = proj.add(pointAtGridIndex(line.start));
    return proj;
}

function distanceToLine(point, line) {
    /// signed distance between point and line
    /// negative distance if point.y < projected.y 

    var proj = _project(point, line);
    var len = (proj.subtract(point)).length;

    if (point.y < proj.y) {
        len = -len;
    }

    return len;
}


var toRad = 0.0174532925199;

function gradientFromAngle(angle) {
    return Math.tan(angle * toRad);
}

function cartesianProduct() {
  return Array.prototype.reduce.call(arguments, function(a, b) {
    var ret = [];
    a.forEach(function(a) {
      b.forEach(function(b) {
        ret.push(a.concat([b]));
      });
    });
    return ret;
  }, [[]]);
}

function range(from, to) {
    if (to === undefined) {
        to = from;
        from = 0;        
    }
    var ret = [];
    for (var i = from; i < to; i++) {
        ret.push(i);
    }
    return ret;
}


function lineAtPointWithAngle(point, angle) {
    var m = gradientFromAngle(angle);
    return Line(m, point.y - m * point.x);
}
