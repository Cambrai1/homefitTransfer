"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.CHAT_STATES);
    const allowedTypes = ['chat', 'groupchat', 'normal'];
    client.on('message', function (msg) {
        if (allowedTypes.indexOf(msg.type || 'normal') < 0) {
            return;
        }
        if (msg.chatState) {
            client.emit('chat:state', {
                chatState: msg.chatState,
                from: msg.from,
                to: msg.to
            });
            client.emit('chatState', {
                chatState: msg.chatState,
                from: msg.from,
                to: msg.to
            });
        }
    });
}
exports.default = default_1;
