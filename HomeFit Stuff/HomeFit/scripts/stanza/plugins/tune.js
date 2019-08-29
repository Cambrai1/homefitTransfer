"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.TUNE);
    client.disco.addFeature(protocol_1.Namespaces.PEP_NOTIFY(protocol_1.Namespaces.TUNE));
    client.on('pubsub:event', function (msg) {
        if (!msg.event.updated) {
            return;
        }
        if (msg.event.updated.node !== protocol_1.Namespaces.TUNE) {
            return;
        }
        client.emit('tune', {
            jid: msg.from,
            tune: msg.event.updated.published[0].tune
        });
    });
    client.publishTune = function (tune, cb) {
        return this.publish('', protocol_1.Namespaces.TUNE, {
            tune: tune
        }, cb);
    };
}
exports.default = default_1;
