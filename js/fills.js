function linesForShape(angle, spacing, shape) {
    // build lines at normal to line created from angle
    // we create a vector that starts at either the top right
    // or bottom right with an angle of `angle`
    // we step along this vector by `spacing`, drawing lines that
    // are perpendicular to it
    // all lines are the diagonal of the bounds of `shape`

    angle %= 180;

    var rect = shape.bounds;
    
    var start = rect.topLeft;
    var oppositeCorner = rect.bottomRight;
    
    if (angle > 90) {
        start = rect.bottomLeft;
        oppositeCorner = rect.topRight;       
    }


    var toCorner = oppositeCorner.subtract(start);
    var dir = new Point(Math.sin(angle * toRad), Math.cos(angle * toRad));
    var angleBetween = dir.getAngleInRadians(toCorner);
    var dirLength = toCorner.length * Math.cos(angleBetween);
    var lineSide = dir.multiply(toCorner.length);

    var lines = [];
    for (var i = spacing; i < dirLength; i+= spacing) {
        var d = dir.multiply(i);
        var point = start.add(d);
        var out = point.add(lineSide); 
        var q1 = out.rotate(90, point);
        var q2 = out.rotate(-90, point);
        lines.push(new Path.Line(q1, q2));

    }

    return lines;
}


function joinedHatchLinesForShape(angle, spacing, shape) {
    // hatch lines where the ends continue and draw part of the contour

    var lines = linesForShape(angle, spacing, shape);
    var points = [];

    for (var i = 0; i < lines.length; i++) {
        var intersections = shape.getIntersections(lines[i]);
        if (intersections.length === 0) {
            continue;
        }
        intersections = intersections.map(function(e) {
            return e.point;
        }).sort(function(a, b) {
            return a.y < b.y;
        });

        if (i % 2 == 1) {
            intersections.reverse();
        }
        points.push(intersections);
    }

    lines.forEach(function(l) {
        l.remove();
    });
    lines = []
    
    for (var i = 0; i < points.length; i++) {
        var j = 0
        for (; j < points[i].length-1; j+=2) {
            lines.push(new Path.Line(points[i][j], points[i][j+1]));
        }
        if (i < points.length-1) {
            var p1 = points[i][j-1];
            var p2 = points[i+1][0];

            if (p2.subtract(p1).length < alt) {
                lines.push(new Path.Line(p1, p2));                
            }
        }
        
    }
 
    return lines;
}

function hatchLinesForShape(angle, spacing, shape) {
    // your standard hatching
    // the lines are drawing in alternating order,
    // so the plotter doesn't waste time

    var lines = linesForShape(angle, spacing, shape);
    var points = [];
    for (var i = 0; i < lines.length; i++) {
        var intersections = shape.getIntersections(lines[i]);

        intersections = intersections.map(function(e) {
            return e.point;
        }).sort(function(a, b) {
            return a.y < b.y;
        });

        if (i % 2 == 1) {
            intersections.reverse();
        }

        points = points.concat(intersections);
    }

    lines.forEach(function(l) {
        l.remove();
    });
    lines = [];
    
    for (var i = 0; i < points.length; i+=2) {
        lines.push(new Path.Line(points[i], points[i+1]));    
    }
 
    return lines;
}

function zigzagLinesForShape(angle, spacing, shape) {

    var hatches = hatchLinesForShape(angle, spacing/2, shape);
    var result = new Path([hatches[0].segments[0]]);
    
    for (var i = 1; i < hatches.length; i++) {
        result.segments.push(hatches[i].segments[0]);
    }
    
    hatches.forEach(function(l) {
        l.remove();
    });

    return [result];
}
