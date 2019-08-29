"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.PING);
    client.on('iq:get:ping', function (iq) {
        client.sendIq(iq.resultReply());
    });
    client.ping = function (jid, cb) {
        return this.sendIq({
            ping: true,
            to: jid,
            type: 'get'
        }, cb);
    };
}
exports.default = default_1;
