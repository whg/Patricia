function KeyComboHandler() {
    var combos = {};
    var nameMap = {};
    var combo2name = {};
    
    function keysFromEvent(event) {
        var keys = [];
        for (var mod in event.modifiers) {
            if (event.modifiers[mod]) {
                keys.push(mod);
            }
        }
        keys.push(event.key);
        return keys;
    }

    
    function makeKeyComboId(keys) {
        return sorted(keys).join("+");
    }

    this.add = function(name, keys, objOrFunc, funcname) {
        var func = undefined;
        if (typeof(objOrFunc) === 'function') {
            func = objOrFunc;
        }
        else {
            func = function() { objOrFunc[funcname].apply(objOrFunc); };
        }

        var cid = makeKeyComboId(keys);
        combos[cid] = func;
        nameMap[name] = func;
        combo2name[cid] = name;
    };

    this.call = function(event) {
        var keys = keysFromEvent(event);
        var id = makeKeyComboId(keys);
        if (combos[id] !== undefined) {
            combos[id]();

            ui.highlightAction(combo2name[id]);
            event.preventDefault();
            return false;
        }
        return true;
    };

    this.callWithName = function(name) {
        nameMap[name]();
    }

}
