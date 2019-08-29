"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.ATTENTION_0);
    client.getAttention = function (jid, opts) {
        opts = opts || {};
        opts.to = jid;
        opts.type = 'headline';
        opts.attention = true;
        client.sendMessage(opts);
    };
    client.on('message', function (msg) {
        if (msg.attention) {
            client.emit('attention', msg);
        }
    });
}
exports.default = default_1;
