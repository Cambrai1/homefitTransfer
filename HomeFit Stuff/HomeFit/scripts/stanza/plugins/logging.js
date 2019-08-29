"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature('', protocol_1.Namespaces.EVENTLOG);
    client.sendLog = function (jid, logData) {
        client.sendMessage({
            log: logData,
            to: jid,
            type: 'normal'
        });
    };
}
exports.default = default_1;
