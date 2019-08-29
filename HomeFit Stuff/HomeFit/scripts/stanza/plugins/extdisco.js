"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.DISCO_EXTERNAL_1);
    client.getServices = function (jid, type, cb) {
        return this.sendIq({
            services: {
                type: type
            },
            to: jid,
            type: 'get'
        }, cb);
    };
    client.getServiceCredentials = function (jid, host, cb) {
        return this.sendIq({
            credentials: {
                service: {
                    host: host
                }
            },
            to: jid,
            type: 'get'
        }, cb);
    };
}
exports.default = default_1;
