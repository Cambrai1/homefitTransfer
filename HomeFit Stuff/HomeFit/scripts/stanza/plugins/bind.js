"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jid_1 = require("../protocol/jid");
function default_1(client, stanzas, config) {
    client.registerFeature('bind', 300, function (features, cb) {
        client.sendIq({
            bind: {
                resource: config.resource
            },
            type: 'set'
        }, function (err, resp) {
            if (err) {
                client.emit('session:error', err);
                return cb('disconnect', 'JID binding failed');
            }
            client.features.negotiated.bind = true;
            client.emit('session:prebind', resp.bind.jid);
            const canStartSession = !features.session || (features.session && features.session.optional);
            if (!client.sessionStarted && canStartSession) {
                client.emit('session:started', client.jid);
            }
            return cb();
        });
    });
    client.on('session:started', function () {
        client.sessionStarted = true;
    });
    client.on('session:prebind', function (boundJID) {
        client.jid = new jid_1.JID(boundJID);
        client.emit('session:bound', client.jid);
    });
    client.on('disconnected', function () {
        client.sessionStarted = false;
        client.features.negotiated.bind = false;
    });
}
exports.default = default_1;
