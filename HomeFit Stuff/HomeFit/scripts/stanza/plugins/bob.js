"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.BOB);
    client.getBits = function (jid, cid, cb) {
        return client.sendIq({
            bob: {
                cid: cid
            },
            to: jid,
            type: 'get'
        }, cb);
    };
}
exports.default = default_1;
