"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    const Roster = JXT.define({
        element: 'query',
        fields: {
            ver: {
                get: function () {
                    return Utils.getAttribute(this.xml, 'ver');
                },
                set: function (value) {
                    const force = value === '';
                    Utils.setAttribute(this.xml, 'ver', value, force);
                }
            }
        },
        name: 'roster',
        namespace: NS.ROSTER
    });
    const RosterItem = JXT.define({
        element: 'item',
        fields: {
            groups: Utils.multiTextSub(NS.ROSTER, 'group'),
            jid: Utils.jidAttribute('jid', true),
            name: Utils.attribute('name'),
            preApproved: Utils.boolAttribute(NS.ROSTER, 'approved'),
            subscription: Utils.attribute('subscription', 'none'),
            subscriptionRequested: {
                get: function () {
                    const ask = Utils.getAttribute(this.xml, 'ask');
                    return ask === 'subscribe';
                }
            }
        },
        name: '_rosterItem',
        namespace: NS.ROSTER
    });
    JXT.extend(Roster, RosterItem, 'items');
    JXT.extendIQ(Roster);
}
exports.default = default_1;
