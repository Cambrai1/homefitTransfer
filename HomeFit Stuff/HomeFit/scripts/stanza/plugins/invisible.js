"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(client) {
    client.goInvisible = function (cb) {
        return this.sendIq({
            invisible: true,
            type: 'set'
        }, cb);
    };
    client.goVisible = function (cb) {
        return this.sendIq({
            type: 'set',
            visible: true
        }, cb);
    };
}
exports.default = default_1;
