function plotData(data) {
    var req = $.ajax({
        url: HOST + "/plot/",
        type: "POST",
        dataType: "json",
        crossDomain: true,
        data: {
            "data": JSON.stringify(data),
        },
    }).done(function(data) {

        console.log("sent file to plot");
        
        if ("error" in data) {
            alert(data["error"]);
        }
    });
}

function Plot() {

    this.all = function() {
        this.plotShapeIds(shapes.shapeIds());
    };

    this.selected = function() {
        this.plotShapeIds(Object.keys(current.selected._values));
    }
    
    this.plotShapeIds = function(shapeIds) {
        console.log("plotting");

        filterDuplicateLines(shapeIds);        
        var data = sortIntoPens(shapeIds);

        plotData(data);
    };
    
}
