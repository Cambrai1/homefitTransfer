"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    const Bind = JXT.define({
        element: 'bind',
        fields: {
            jid: Utils.jidSub(NS.BIND, 'jid'),
            resource: Utils.textSub(NS.BIND, 'resource')
        },
        name: 'bind',
        namespace: NS.BIND
    });
    JXT.extendIQ(Bind);
    JXT.extendStreamFeatures(Bind);
}
exports.default = default_1;
