"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jid_1 = require("../protocol/jid");
const protocol_1 = require("../protocol");
function default_1(client) {
    function enabled(msg) {
        return msg.markable && client.config.chatMarkers !== false;
    }
    client.disco.addFeature(protocol_1.Namespaces.CHAT_MARKERS_0);
    client.on('message', function (msg) {
        if (enabled(msg)) {
            client.markReceived(msg);
            return;
        }
        if (msg.received) {
            return client.emit('marker:received', msg);
        }
        if (msg.displayed) {
            return client.emit('marker:displayed', msg);
        }
        if (msg.acknowledged) {
            return client.emit('marker:acknowledged', msg);
        }
    });
    client.markReceived = function (msg) {
        if (enabled(msg)) {
            const to = msg.type === 'groupchat' ? new jid_1.JID(msg.from.bare) : msg.from;
            client.sendMessage({
                body: '',
                received: msg.id,
                to,
                type: msg.type
            });
        }
    };
    client.markDisplayed = function (msg) {
        if (enabled(msg)) {
            const to = msg.type === 'groupchat' ? new jid_1.JID(msg.from.bare) : msg.from;
            client.sendMessage({
                body: '',
                displayed: msg.id,
                to,
                type: msg.type
            });
        }
    };
    client.markAcknowledged = function (msg) {
        if (enabled(msg)) {
            const to = msg.type === 'groupchat' ? new jid_1.JID(msg.from.bare) : msg.from;
            client.sendMessage({
                acknowledged: msg.id,
                body: '',
                to,
                type: msg.type
            });
        }
    };
}
exports.default = default_1;
