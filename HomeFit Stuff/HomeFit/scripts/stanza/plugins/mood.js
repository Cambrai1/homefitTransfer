"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.MOOD);
    client.disco.addFeature(protocol_1.Namespaces.PEP_NOTIFY(protocol_1.Namespaces.MOOD));
    client.on('pubsub:event', function (msg) {
        if (!msg.event.updated) {
            return;
        }
        if (msg.event.updated.node !== protocol_1.Namespaces.MOOD) {
            return;
        }
        client.emit('mood', {
            jid: msg.from,
            mood: msg.event.updated.published[0].mood
        });
    });
    client.publishMood = function (mood, text, cb) {
        return this.publish('', protocol_1.Namespaces.MOOD, {
            mood: {
                text: text,
                value: mood
            }
        }, cb);
    };
}
exports.default = default_1;
