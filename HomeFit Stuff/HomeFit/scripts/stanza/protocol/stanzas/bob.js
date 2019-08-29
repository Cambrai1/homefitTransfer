"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    const BOB = JXT.define({
        element: 'data',
        fields: {
            cid: Utils.attribute('cid'),
            data: Utils.text(),
            maxAge: Utils.numberAttribute('max-age'),
            type: Utils.attribute('type')
        },
        name: 'bob',
        namespace: NS.BOB
    });
    JXT.extendIQ(BOB);
    JXT.extendMessage(BOB);
    JXT.extendPresence(BOB);
}
exports.default = default_1;
