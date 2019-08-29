"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.NICK);
    client.disco.addFeature(protocol_1.Namespaces.PEP_NOTIFY(protocol_1.Namespaces.NICK));
    client.on('pubsub:event', function (msg) {
        if (!msg.event.updated) {
            return;
        }
        if (msg.event.updated.node !== protocol_1.Namespaces.NICK) {
            return;
        }
        client.emit('nick', {
            jid: msg.from,
            nick: msg.event.updated.published[0].nick
        });
    });
    client.publishNick = function (nick, cb) {
        return this.publish('', protocol_1.Namespaces.NICK, {
            nick: nick
        }, cb);
    };
}
exports.default = default_1;
