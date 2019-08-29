"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.GEOLOC);
    client.disco.addFeature(protocol_1.Namespaces.PEP_NOTIFY(protocol_1.Namespaces.GEOLOC));
    client.on('pubsub:event', function (msg) {
        if (!msg.event.updated) {
            return;
        }
        if (msg.event.updated.node !== protocol_1.Namespaces.GEOLOC) {
            return;
        }
        client.emit('geoloc', {
            geoloc: msg.event.updated.published[0].geoloc,
            jid: msg.from
        });
    });
    client.publishGeoLoc = function (data, cb) {
        return this.publish('', protocol_1.Namespaces.GEOLOC, {
            geoloc: data
        }, cb);
    };
}
exports.default = default_1;
