"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(client) {
    client.disco.addFeature('jabber:iq:version');
    client.on('iq:get:version', function (iq) {
        client.sendIq(iq.resultReply({
            version: client.config.softwareVersion || {
                name: 'stanzajs.org'
            }
        }));
    });
    client.getSoftwareVersion = function (jid, cb) {
        return this.sendIq({
            to: jid,
            type: 'get',
            version: true
        }, cb);
    };
}
exports.default = default_1;
