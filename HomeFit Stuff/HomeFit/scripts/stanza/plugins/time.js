"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.TIME);
    client.getTime = function (jid, cb) {
        return this.sendIq({
            time: true,
            to: jid,
            type: 'get'
        }, cb);
    };
    client.on('iq:get:time', function (iq) {
        const time = new Date();
        client.sendIq(iq.resultReply({
            time: {
                tzo: time.getTimezoneOffset(),
                utc: time
            }
        }));
    });
}
exports.default = default_1;
