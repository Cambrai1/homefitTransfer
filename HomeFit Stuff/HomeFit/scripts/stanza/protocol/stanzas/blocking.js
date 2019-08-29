"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
const jid_1 = require("../jid");
function default_1(JXT) {
    const Utils = JXT.utils;
    const jidList = {
        get: function () {
            const result = [];
            const items = Utils.find(this.xml, NS.BLOCKING, 'item');
            if (!items.length) {
                return result;
            }
            for (const item of items) {
                result.push(new jid_1.JID(Utils.getAttribute(item, 'jid', '')));
            }
            return result;
        },
        set: function (values) {
            const self = this;
            for (const value of values) {
                const item = Utils.createElement(NS.BLOCKING, 'item', NS.BLOCKING);
                Utils.setAttribute(item, 'jid', value.toString());
                self.xml.appendChild(item);
            }
        }
    };
    const Block = JXT.define({
        element: 'block',
        fields: {
            jids: jidList
        },
        name: 'block',
        namespace: NS.BLOCKING
    });
    const Unblock = JXT.define({
        element: 'unblock',
        fields: {
            jids: jidList
        },
        name: 'unblock',
        namespace: NS.BLOCKING
    });
    const BlockList = JXT.define({
        element: 'blocklist',
        fields: {
            jids: jidList
        },
        name: 'blockList',
        namespace: NS.BLOCKING
    });
    JXT.extendIQ(Block);
    JXT.extendIQ(Unblock);
    JXT.extendIQ(BlockList);
}
exports.default = default_1;
