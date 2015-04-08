function Command(action, direction, args) {
    this.action = action;
    this.direction = direction;
    this.args = new Array(args.length);
    for (var i = 0; i < args.length; i++) {
        this.args[i] = args[i];
    }

    function reverse(dir) {
        if (dir === "forward") return "backward";
        return "forward";
    }

    this.execute = function(reversed) {

        var dir = this.direction;
        if (reversed) {
            dir = reverse(dir);
        }

        var name = this.action[dir].apply(this.action, this.args);
        // console.log("executed " + name + " with " + this.args);
    };

}

function Invoker() {
    var commands = [];
    var pos = 0;

    this.push = function(action, direction, args) {
        // console.log(args);
        var comm = new Command(action, direction, args);

        if (pos !== commands.length) {
            commands = commands.splice(0, pos);
        }

        commands.push(comm);
        // ui.updateHistory(action.name);
        comm.execute();
        pos++;
    };

    this.undo = function() {
        if (pos < 1) wm("nothing to undo");
        else {
            commands[--pos].execute(true);
        }
    };

    this.redo = function() {
        if (pos === commands.length) wm("can't redo");
        else {
            commands[pos++].execute();
        }
    };

    this.clear = function() {
        commands = [];
        pos = 0;
    }
}
