"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client, stanzas, config) {
    const sendReceipts = config.sendReceipts !== false;
    client.disco.addFeature(protocol_1.Namespaces.RECEIPTS);
    client.on('message', function (msg) {
        const ackTypes = {
            chat: true,
            headline: true,
            normal: true
        };
        if (sendReceipts && ackTypes[msg.type] && msg.requestReceipt && !msg.receipt) {
            client.sendMessage({
                id: msg.id,
                receipt: msg.id,
                to: msg.from,
                type: msg.type
            });
        }
        if (msg.receipt) {
            client.emit('receipt', msg);
            client.emit('receipt:' + msg.receipt);
        }
    });
}
exports.default = default_1;
