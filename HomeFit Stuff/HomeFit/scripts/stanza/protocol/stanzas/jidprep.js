"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
const jid_1 = require("../jid");
function default_1(JXT) {
    JXT.withIQ(function (IQ) {
        JXT.add(IQ, 'jidPrep', {
            get: function () {
                const data = JXT.utils.getSubText(this.xml, NS.JID_PREP_0, 'jid');
                if (data) {
                    const jid = new jid_1.JID(data);
                    jid.prepped = true;
                    return jid;
                }
            },
            set: function (value) {
                JXT.utils.setSubText(this.xml, NS.JID_PREP_0, 'jid', (value || '').toString());
            }
        });
    });
}
exports.default = default_1;
