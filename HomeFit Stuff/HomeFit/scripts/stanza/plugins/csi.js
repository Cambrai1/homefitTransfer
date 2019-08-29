"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client, stanzas) {
    const Active = stanzas.getDefinition('active', protocol_1.Namespaces.CSI);
    const Inactive = stanzas.getDefinition('inactive', protocol_1.Namespaces.CSI);
    client.registerFeature('clientStateIndication', 400, function (features, cb) {
        this.features.negotiated.clientStateIndication = true;
        cb();
    });
    client.markActive = function () {
        if (this.features.negotiated.clientStateIndication) {
            this.send(new Active());
        }
    };
    client.markInactive = function () {
        if (this.features.negotiated.clientStateIndication) {
            this.send(new Inactive());
        }
    };
}
exports.default = default_1;
