function Action(invoker, keyHandler) {

    
    function callEventFactory(eventType) {
        
        return function(event) {
            if (modifierStates["option"] && current.mode.option) {
                console.log(modifierStates["option"]);
                current.mode.option[eventType].apply(null, [event]);
            }
            else {
                current.mode[eventType].apply(null, [event])
            }
            if (eventType == "onMouseScroll") {
                view.draw();
            }
        }
    }

    
    this.modes = {};
    var modeKeys = {};
    
    this.initModes = function() {
        for (var modeKey in this.modes) {
            this.modes[modeKey].option = this.modes["view"];
        }

        for (var name in this.modes) {
            modeKeys[this.modes[name].key] = name;
            this.modes[name].name = name;
        }
    };
    

    this.selectMode = function(nameOrKey) {
        var mode = this.modes[modeKeys[nameOrKey]];
        if (mode !== undefined) {
            current.mode = mode;
        }
        else {
            // we are presuming name is valid
            current.mode = this.modes[nameOrKey];
        }
        
        ui.updateTool(current.mode.name);
    };

    var modifierStates = { "command": false, "control": false, "option": false, "shift": false };
    var modifiers = Object.keys(modifierStates);
    

    this.tool = new Tool();
    
    var mouseEvents = ["onMouseDown", "onMouseUp", "onMouseDrag", "onMouseScroll"];

    this.restoreDefaultTools;
    (this.restoreDefaultTools = function() {
        mouseEvents.forEach(function(eventType){
            this.tool[eventType] = callEventFactory(eventType);
        });
    })();


    function atLeastOneModifier() {
        for (var key in modifierStates) {
            if (modifierStates[key]) {
                return true;
            }
        }
        return false;
    }
    
    var that = this;
    this.tool.onKeyDown = function onKeyDown(event) {

        var ret = true;

        // windows?
        if (event.key === "control") {
            event.key = "command";
        }
        
        // console.log(event);

        if (event.key in modifierStates) {
            modifierStates[event.key] = true;
        }
        else if (atLeastOneModifier()) {
            for (var key in modifierStates) {
                event.modifiers[key] = modifierStates[key];
            }

            ret = keyHandler.call(event);
        }
        else if (modeKeys[event.key] !== undefined) {
            // current.mode = that.modes[modeKeys[event.key]];
            that.selectMode(event.key);
        }

        if (event.key === "escape") {
            escape();
        }

        if (event.key === "backspace") {
            deleteSelected();
            ret = false;
        }
        

        return ret; // might be false in which case don't do what you normally do
    }

    this.tool.onKeyUp = function onKeyUp(event) {

        if (modifierStates[event.key] !== undefined) {
            modifierStates[event.key] = false;
        }
    }

    // make the scroll event, so it behaves like the others
    
    this.tool.scrollEvent = new ToolEvent(tool, "mousescroll", new MouseEvent());
    this.tool.scrollEvent.point = new Point();
    this.tool.scrollEvent.delta = new Point();

    $("#canvas").bind('mousewheel DOMMouseScroll', function(event){
        that.tool.scrollEvent.point.set(event.offsetX, event.offsetY);
        that.tool.scrollEvent.delta.x = -event.originalEvent.deltaX * 0.5;
        that.tool.scrollEvent.delta.y = -event.originalEvent.deltaY * 0.5;
        that.tool.onMouseScroll(that.tool.scrollEvent);
        event.preventDefault();
    });

}

function createMouseMode(key, mouseDown, mouseDrag, mouseScroll, mouseUp, option) {
    return {
        key: key,
        onMouseDown: mouseDown,
        onMouseDrag: mouseDrag,
        onMouseScroll: mouseScroll,
        onMouseUp: mouseUp,
    };
}
var none = function() {};
