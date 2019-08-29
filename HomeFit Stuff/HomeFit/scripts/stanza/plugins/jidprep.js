"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(client) {
    client.prepJID = function (jid, cb) {
        return client.sendIq({
            jidPrep: jid,
            to: client.jid.domain,
            type: 'get'
        }, cb);
    };
}
exports.default = default_1;
