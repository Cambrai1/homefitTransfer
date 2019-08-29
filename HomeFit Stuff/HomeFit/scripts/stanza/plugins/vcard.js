"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(client) {
    client.disco.addFeature('vcard-temp');
    client.getVCard = function (jid, cb) {
        return this.sendIq({
            to: jid,
            type: 'get',
            vCardTemp: true
        }, cb);
    };
    client.publishVCard = function (vcard, cb) {
        return this.sendIq({
            type: 'set',
            vCardTemp: vcard
        }, cb);
    };
}
exports.default = default_1;
