"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.ADHOC_COMMANDS);
    client.disco.addItem({
        name: 'Ad-Hoc Commands',
        node: protocol_1.Namespaces.ADHOC_COMMANDS
    });
    client.getCommands = function (jid, cb) {
        return client.getDiscoItems(jid, protocol_1.Namespaces.ADHOC_COMMANDS, cb);
    };
}
exports.default = default_1;
