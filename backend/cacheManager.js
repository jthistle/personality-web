// 
//  A cache manager for the GraphQL server
//

class Cache {
    constructor() {
        this.objects = {}
    }

    // Add a new object to the schema
    // timeout should be in ms
    newObject(name, timeout) {
        this.objects[name] = {
            isAssoc: false,
            timeout: timeout,
            lastUpdate: -1,
            data: null,
        }
    }

    newAssoc(name, timeout) {
        this.objects[name] = { 
            isAssoc: true,
            timeout: timeout,
            items: {},
        }
    }

    async set(name, object, key="") {
        if (this.objects[name].isAssoc) {
            this.objects[name].items[key] = {
                data: object,
                lastUpdate: this.currentTime(),
            }
        } else {
            this.objects[name].data = object;
            this.objects[name].lastUpdate = this.currentTime();
        }
    }

    get(name, key="") {
        if (this.objects[name].isAssoc) {
            if (key in this.objects[name].items) {
                return this.objects[name].items[key].data;
            }

            // Fall-through, key doesn't exist
            // This _is_ discouraged behaviour
            console.warn("Cache manager: key '"+ key + "' doesn't exist");
            return null;
        } else {
            return this.objects[name].data;
        }
    }

    needsUpdate(name, key="") {
        var obj = this.objects[name];
        if (obj.isAssoc) {
            if (key in obj.items) {
                return (this.currentTime() - obj.items[key].lastUpdate >= obj.timeout)
            }

            // Silent fall-through, key doesn't exist
            // This is not discouraged behaviour
            return true;
        } else {
            return (this.currentTime() - obj.lastUpdate >= obj.timeout);
        }
    }

    currentTime() {
        return Date.now();
    }
}

module.exports = Cache;
