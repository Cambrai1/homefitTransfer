"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.PUSH_0);
    client.enableNotifications = function (jid, node, fieldList, cb) {
        const fields = [
            {
                name: 'FORM_TYPE',
                value: 'http://jabber.org/protocol/pubsub#publish-options'
            }
        ];
        const iq = {
            enablePush: {
                jid: jid,
                node: node
            },
            type: 'set'
        };
        if (fieldList && fieldList.length) {
            iq.enablePush.form = {
                fields: fields.concat(fieldList),
                type: 'submit'
            };
        }
        return this.sendIq(iq, cb);
    };
    client.disableNotifications = function (jid, node, cb) {
        const iq = {
            disablePush: {
                jid: jid
            },
            type: 'set'
        };
        if (node) {
            iq.disablePush.node = node;
        }
        return this.sendIq(iq, cb);
    };
}
exports.default = default_1;
