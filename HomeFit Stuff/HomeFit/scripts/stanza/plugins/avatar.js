"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
function default_1(client) {
    client.disco.addFeature(protocol_1.Namespaces.PEP_NOTIFY(protocol_1.Namespaces.AVATAR_METADATA));
    client.on('pubsub:event', function (msg) {
        if (!msg.event.updated) {
            return;
        }
        if (msg.event.updated.node !== protocol_1.Namespaces.AVATAR_METADATA) {
            return;
        }
        client.emit('avatar', {
            avatars: msg.event.updated.published[0].avatars,
            jid: msg.from,
            source: 'pubsub'
        });
    });
    client.on('presence', function (pres) {
        if (pres.avatarId) {
            client.emit('avatar', {
                avatars: [
                    {
                        id: pres.avatarId
                    }
                ],
                jid: pres.from,
                source: 'vcard'
            });
        }
    });
    client.publishAvatar = function (id, data, cb) {
        return this.publish('', protocol_1.Namespaces.AVATAR_DATA, {
            avatarData: data,
            id: id
        }, cb);
    };
    client.useAvatars = function (info, cb) {
        return this.publish('', protocol_1.Namespaces.AVATAR_METADATA, {
            avatars: info,
            id: 'current'
        }, cb);
    };
    client.getAvatar = function (jid, id, cb) {
        return this.getItem(jid, protocol_1.Namespaces.AVATAR_DATA, id, cb);
    };
}
exports.default = default_1;
