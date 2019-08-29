"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(client) {
    client.getPrivateData = function (opts, cb) {
        return this.sendIq({
            privateStorage: opts,
            type: 'get'
        }, cb);
    };
    client.setPrivateData = function (opts, cb) {
        return this.sendIq({
            privateStorage: opts,
            type: 'set'
        }, cb);
    };
}
exports.default = default_1;
