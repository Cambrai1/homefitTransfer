"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    const DelayedDelivery = JXT.define({
        element: 'delay',
        fields: {
            from: Utils.jidAttribute('from'),
            reason: Utils.text(),
            stamp: Utils.dateAttribute('stamp')
        },
        name: 'delay',
        namespace: NS.DELAY
    });
    JXT.extendMessage(DelayedDelivery);
    JXT.extendPresence(DelayedDelivery);
}
exports.default = default_1;
