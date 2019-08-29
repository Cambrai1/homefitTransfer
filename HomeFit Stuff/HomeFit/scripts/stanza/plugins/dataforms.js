"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.DATAFORM);
    client.disco.addFeature(protocol_1.Namespaces.DATAFORM_MEDIA);
    client.disco.addFeature(protocol_1.Namespaces.DATAFORM_VALIDATION);
    client.disco.addFeature(protocol_1.Namespaces.DATAFORM_LAYOUT);
    client.on('message', function (msg) {
        if (msg.form) {
            client.emit('dataform', msg);
        }
    });
}
exports.default = default_1;
