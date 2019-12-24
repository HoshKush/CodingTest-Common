module.exports = function update(prevState, changes) {
    // type here
    let state = JSON.parse(JSON.stringify(prevState));        //deep copy
    let keys = Object.getOwnPropertyNames(prevState);
    let key = Object.getOwnPropertyNames(changes)[0];
    keys.forEach(k => {             //assigning all objects in prevState to new state except the object should be changed
        if (k !== key) {
            state[k] = prevState[k];
        }
    });

    let keysToCommand = new Array();
    let commands = ["$set", "$push", "$unshift", "$splice", "$merge", "$apply"];

    while (!commands.includes(key)) {
        keysToCommand.push(key);
        changes = changes[key];
        key = Object.getOwnPropertyNames(changes)[0];           //key should be an element in array commands
    }

    let tmp = state;
    switch (key) {
        case "$set":
            if (keysToCommand.length === 0) {
                state = changes["$set"];
            } else {
                key = keysToCommand.shift()
                while (keysToCommand.length > 0) {
                    tmp = tmp[key];
                    key = keysToCommand.shift();
                }
                tmp[key] = changes["$set"];
            }
            break;

        case "$push":
            if (keysToCommand.length === 0 && Array.isArray(state)) {
                state = state.concat(changes["$push"]);
            } else {
                key = keysToCommand.shift()
                while (keysToCommand.length > 0) {
                    tmp = tmp[key];
                    key = keysToCommand.shift();
                }

                if (Array.isArray(changes["$push"]) && Array.isArray(tmp[key])) {
                    tmp[key] = tmp[key].concat(changes["$push"]);
                }
            }
            break;

        case "$unshift":
            if (keysToCommand.length === 0 && Array.isArray(state)) {
                state = changes["$unshift"].concat(state);
            } else {
                key = keysToCommand.shift()
                while (keysToCommand.length > 0) {
                    tmp = tmp[key];
                    key = keysToCommand.shift();
                }

                if (Array.isArray(changes["$unshift"]) && Array.isArray(tmp[key])) {
                    tmp[key] = changes["$unshift"].concat(tmp[key]);
                }
            }
            break;

        case "$splice":
            let p = changes["$splice"][0];
            if (keysToCommand.length === 0 && Array.isArray(state)) {
                state.splice(p[0], p[1]);
                for(let i = 2; i < p.length; i++){
                    state.splice(p[0]++, 0, p[i]);
                }
            } else {
                key = keysToCommand.shift()
                while (keysToCommand.length > 0) {
                    tmp = tmp[key];
                    key = keysToCommand.shift();
                }

                if (Array.isArray(changes["$splice"]) && Array.isArray(tmp[key])) {
                    tmp[key].splice(p[0], p[1]);
                    for(let i = 2; i < p.length; i++){
                        tmp[key].splice(p[0]++, 0, p[i]);
                    }
                }
            }
            break;

        case "$merge":
            let keys = Object.getOwnPropertyNames(changes["$merge"]);
            if (keysToCommand.length === 0) {
                keys.forEach(o => {
                    state[o] = changes["$merge"][o];
                })
            } else {
                key = keysToCommand.shift()
                while (keysToCommand.length > 0) {
                    tmp = tmp[key];
                    key = keysToCommand.shift();
                }
                keys.forEach(o => {
                    tmp[key][o] = changes["$merge"][o];
                })
            }
            break;   
            
        case "$apply":
            if (keysToCommand.length === 0) {
                state = changes["$apply"](state);
            } else {
                key = keysToCommand.shift()
                while (keysToCommand.length > 0) {
                    tmp = tmp[key];
                    key = keysToCommand.shift();
                }
                tmp[key] = changes["$apply"](tmp[key]);
            }
            break; 


    }

    return state;

};
