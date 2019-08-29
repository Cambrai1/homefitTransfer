"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.REACH_0);
    client.disco.addFeature(protocol_1.Namespaces.PEP_NOTIFY(protocol_1.Namespaces.REACH_0));
    client.on('pubsub:event', function (msg) {
        if (!msg.event.updated) {
            return;
        }
        if (msg.event.updated.node !== protocol_1.Namespaces.REACH_0) {
            return;
        }
        client.emit('reachability', {
            addresses: msg.event.updated.published[0].reach,
            jid: msg.from
        });
    });
    client.on('presence', function (pres) {
        if (!pres.reach || !pres.reach.length) {
            return;
        }
        client.emit('reachability', {
            addresses: pres.reach,
            jid: pres.from
        });
    });
    client.publishReachability = function (data, cb) {
        return this.publish('', protocol_1.Namespaces.REACH_0, {
            reach: data
        }, cb);
    };
}
exports.default = default_1;
