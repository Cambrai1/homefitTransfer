"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WildEmitter {
    constructor() {
        this.isWildEmitter = true;
        this.callbacks = {};
    }
    on(event, groupNameOrHandler, handler) {
        const hasGroup = arguments.length === 3;
        const group = hasGroup ? arguments[1] : undefined;
        const func = hasGroup ? arguments[2] : arguments[1];
        func._groupName = group;
        (this.callbacks[event] = this.callbacks[event] || []).push(func);
        return this;
    }
    once(event, groupNameOrHandler, handler) {
        const hasGroup = arguments.length === 3;
        const group = hasGroup ? arguments[1] : undefined;
        const func = hasGroup ? arguments[2] : arguments[1];
        const on = () => {
            this.off(event, on);
            func.apply(this, arguments);
        };
        this.on(event, group, on);
        return this;
    }
    releaseGroup(groupName) {
        this.callbacks = this.callbacks || {};
        for (const item of Object.keys(this.callbacks)) {
            const handlers = this.callbacks[item];
            for (let i = 0, len = handlers.length; i < len; i++) {
                if (handlers[i]._groupName === groupName) {
                    // remove it and shorten the array we're looping through
                    handlers.splice(i, 1);
                    i--;
                    len--;
                }
            }
        }
        return this;
    }
    off(event, fn) {
        this.callbacks = this.callbacks || {};
        const callbacks = this.callbacks[event];
        if (!callbacks) {
            return this;
        }
        // remove all handlers
        if (!fn) {
            delete this.callbacks[event];
            return this;
        }
        // remove specific handler
        const i = callbacks.indexOf(fn);
        callbacks.splice(i, 1);
        if (callbacks.length === 0) {
            delete this.callbacks[event];
        }
        return this;
    }
    emit(event, ...data) {
        this.callbacks = this.callbacks || {};
        const args = [].slice.call(arguments, 1);
        const callbacks = this.callbacks[event];
        const specialCallbacks = this.getWildcardCallbacks(event);
        if (callbacks) {
            const listeners = callbacks.slice();
            for (let i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, args);
            }
        }
        if (specialCallbacks) {
            const listeners = specialCallbacks.slice();
            for (let i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, [event].concat(args));
            }
        }
        return this;
    }
    getWildcardCallbacks(eventName) {
        this.callbacks = this.callbacks || {};
        let result = [];
        for (const item of Object.keys(this.callbacks)) {
            const split = item.split('*');
            if (item === '*' ||
                (split.length === 2 && eventName.slice(0, split[0].length) === split[0])) {
                result = result.concat(this.callbacks[item]);
            }
        }
        return result;
    }
}
exports.default = WildEmitter;
