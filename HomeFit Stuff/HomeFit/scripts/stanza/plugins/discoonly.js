"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const hashes = tslib_1.__importStar(require("../lib/crypto"));
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature('jid\\20escaping');
    client.disco.addFeature(protocol_1.Namespaces.DELAY);
    client.disco.addFeature(protocol_1.Namespaces.EME_0);
    client.disco.addFeature(protocol_1.Namespaces.FORWARD_0);
    client.disco.addFeature(protocol_1.Namespaces.HASHES_1);
    client.disco.addFeature(protocol_1.Namespaces.IDLE_1);
    client.disco.addFeature(protocol_1.Namespaces.JSON_0);
    client.disco.addFeature(protocol_1.Namespaces.OOB);
    client.disco.addFeature(protocol_1.Namespaces.PSA);
    client.disco.addFeature(protocol_1.Namespaces.REFERENCE_0);
    client.disco.addFeature(protocol_1.Namespaces.SHIM);
    client.disco.addFeature(`${protocol_1.Namespaces.SHIM}#SubID`, protocol_1.Namespaces.SHIM);
    const names = hashes.getHashes();
    for (const name of names) {
        client.disco.addFeature(protocol_1.Namespaces.HASH_NAME(name));
    }
}
exports.default = default_1;
