function BaseUI() {
    this.updateTool = function() {};
    this.highlightAction = function() {};
}

function UI() {

    extend(this, new BaseUI);
    
    $("#shapes").sortable({
        update: function(event, ui) {

            var ordered = $(this).sortable("toArray", { "attribute": "key" });
            for (var i = 0; i < ordered.length; i++) {
                var key = ordered[i];
                shapes.layer.insertChild(i, shapes.get(key).outline);
                shapes.get(key).order = i;
            }
            project.view.draw();
        },
        change: function(event, ui) {
            
        }
    });

    var template = $("#shapes").html();
    $("#shapes").html("");

    this.addShape = function(shape) {
        $("#shapes").append(template);
        var added =  $("#shapes li:last-child");
        
        added.find("span").text(shape.name);
        added.find("input[type=text]").val(shape.name);
        added.attr("key", shape.id);
        
        // update values of sliders
        added.find("input[name=spacing]").val(shape.appearence.spacing);
        added.find("input[name=angle]").val(shape.appearence.angle);

    };

    function getItem(shapeId) {
        return $("#shapes").find("li[key=" + shapeId + "]");
    }

    this.removeShape = function(shapeId) {
        getItem(shapeId).remove();
    }

    var currentExpandedShape = false;
    function highlightDiv(div, highlight) {
        // div.css("border-left", "4px solid " + (highlight ? "#3dc57e" : "#fff"));
        div.toggleClass("selected", highlight);
    }
    this.setCurrentShape = function(shapeId) {
        if (currentExpandedShape) {
            var div = getItem(currentExpandedShape).find("div.shape");
            highlightDiv(div, false);
        }
        var div = getItem(shapeId).find("div.shape");
        highlightDiv(div, true);
        // li.css("background", "#faa");
        currentExpandedShape = shapeId;
    };


    $("#shapes").on('submit','form.setname',function(e){
        var arrow = $(this).siblings(".arrow");
        toggleDetails(arrow);
        e.preventDefault();
    });

    $("#shapes").on("input", ".title", function(e){
        var input = $(this).find("input[type=text]").val();
        var shapeId = $(this).parents("li").attr("key");

        shapes.get(shapeId).name = input;
        $(this).parents("li").find("span").text(input);
    });

    
    function toggleDetails(arrow) {
        arrow.toggleClass("arrow-down");
        arrow.siblings("span").toggle();
        var input = arrow.siblings("form").find("input");
        input.toggle();
        input.focus(function(e) {
            console.log("sell");
        });

        var details = arrow.parent().next();
        
        details.toggle();
    }

    function inputRangeUpdate(e, commit) {
        var name = $(this).attr("name");
        var value = parseInt($(this).val());
        var shapeId = parseInt($(this).parents("li").attr("key"));
        var shape = shapes.get(shapeId);

        if (shape.appearence[name] != value) {
            
            shapes.get(shapeId).appearence[name] = value;
            console.log("name = " + name + ", shape = " + shapeId + ", value = " + value);
            shapes.get(shapeId).draw();
            view.draw();
        }

        if (commit && startedValue !== value) {        
            invoker.push(ChangeAppearenceAction, "forward", [shapeId, name, startedValue, value]);
        }
        
    }
    var startedValue = null;
    
    $("#shapes").on("mousedown", "input[type=range]", function(e){
        console.log("bind");
        startedValue = parseInt($(this).val());
        $(this).bind("mousemove", inputRangeUpdate);
    });

    $("#shapes").on("mouseup", "input[type=range]", function(e){
        console.log("unbind");
        inputRangeUpdate.apply(this,[null, true]);
        $(this).unbind("mousemove", inputRangeUpdate);
    });
    
    $("#shapes").on("click", ".arrow", function() {
        toggleDetails($(this));
        
    });

    $("#shapes").on("change", "select", function() {

        var name = $(this).attr("name");
        var value = $(this).val();
        var shapeId = $(this).parents("li").attr("key");
        var fromValue = shapes.get(shapeId).appearence[name];

        invoker.push(ChangeAppearenceAction, "forward", [shapeId, name, fromValue, value]);
        console.log("name = " + name + ", shape = " + shapeId + ", value = " + value);
    });

    // $("#shapes").on("stop", "input[type=range]", function() {
        // console.log(this);
    // });


    ////////////////////////////////////////
    // download & upload

    function requestDownload(data) {
        
        var anchor = $(this);
        var req = $.ajax({
            url: HOST + "/save/",
            type: "POST",
            dataType: "json",
            crossDomain: true,
            data: {
                "data": JSON.stringify(data),
            },
        }).done(function(data) {

            window.location = "http://127.0.0.1:5000/download/" + data.fileid;
            
        });
        
    }

    function download() {
        var data = {};
        data["version"] = 0.01;
        data["shapes"] = shapes.getState();
        data["triangleSide"] = side;
        requestDownload(data);
    }    
    this.download = download;

    function exportCanvas() {

        var shapeIds = shapes.shapeIds();
        filterDuplicateLines(shapeIds);
        var data = sortIntoPens(shapeIds);
        requestDownload(data);
    }
    this.exportCanvas = exportCanvas;
    
    $("#download").click(function(e) {

        download();
        
        e.preventDefault();
        return false;
    });

    function upload() {
        $("#fileupload").trigger('click');
    }
    this.upload = upload;

    $("#upload").click(function(e){
        e.preventDefault();
        upload();
    });

    function loadState(obj) {

        var data = JSON.parse(obj);
        setTriangleSize(data["triangleSide"]);
        
        shapes.loadState(data["shapes"]);
        var shapeIds = shapes.shapeIds();
        shapeIds.forEach(function(shapeId) {
            var shape = shapes.get(shapeId);
            invertedIndex.addShape(shape);
            ui.addShape(shape);
        });
        

    }

    $("input:file").change(function (){

        var file = $(this).prop("files")[0];
        var fileReader = new FileReader();
        fileReader.onload = function(event) {
            loadState(event.target.result);
            invoker.clear();
            view.draw();
        };

        if (file) {
            fileReader.readAsText(file);
        }
    });


    $("#gridsize").on("mousemove",function(e){
        var newsize = $(this).val();
        if (newsize !== current.triangleSize) {
            setTriangleSize(newsize);
        }
    });

    $("#gridcolour").on("mousemove",function(e){
        current.gridStrokeColour = new Color($(this).val() * 0.01);
        gridGroup.strokeColor = current.gridStrokeColour;
        view.draw();

    });


    ////////////////////////////////////////////////////////
    // toolbar
    
    $(".tool").click(function(event) {
        var name = fromTitle($(this).attr("title"));
        action.selectMode(name);
    });

    function toTitle(s) {
        return s[0].toUpperCase() + s.substr(1);
    }

    function fromTitle(s) {
        return s.toLowerCase();
    }
    
    var highlightedTool = null;
    this.updateTool = function(modeName) {
        
        if (highlightedTool) {
            $(".tool[title="+toTitle(highlightedTool)+"]").toggleClass("selected", false);
        }

        $(".tool[title="+toTitle(modeName)+"]").toggleClass("selected", true);
        highlightedTool = modeName;
    };

    ////////////////////////////////////////////////////////
    // actions

    $(".action").click(function(event) {
        var name = fromTitle($(this).attr("title"));
        keyHandler.callWithName(name);
        view.draw();
    });

    $(".action").mousedown(function(event) {
        $(this).toggleClass("selected", true);
    });

    $(".action").mouseup(function(event) {
        $(this).toggleClass("selected", false);
    });

    this.highlightAction = function(name) {
        var title = toTitle(name);
        $(".action[title="+title+"]").toggleClass("selected", true);

        setTimeout(function() {
            $(".action[title="+title+"]").toggleClass("selected");
        }, 100);
    }

    ////////////////////////////////////////////////////////
    // history

    this.updateHistory = function(m) {
        $("#history").append("<p>" + m + "</p>");
        if ($("#history p").length > 10) {
            $('#history p:lt(2)').remove();
        }
    };


    ////////////////////
    this.updateStatus = function(status) {
        if (status) {
            $("#server-status").text("Connected");
            $("#plotter-status").text(status.plotter ? "Connected" : "None");
        }
        else {
            $("#server-status").text("None");
            $("#plotter-status").text("None");
        }
    }
}

function wm(m) {
    $("#messages").append("<p>" + m + "</p>");
    if ($("#messages p").length > 10) {
        $('#messages p:lt(2)').remove();
    }
}

var testPlotterConnection = null;
(testPlotterConnection = function() {
    $.ajax(HOST + "/test/", {
        error: function(xhr, status, error) {
            console.log("ERROR: " + status + ", " + error);
        }
    }).done(function(json) {
        var data = JSON.parse(json);
        ui.updateStatus(data);
    }).fail(function(e){
        ui.updateStatus(false);
        console.log("fail");
    });
});

