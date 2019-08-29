"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    JXT.define({
        element: 'stream',
        fields: {
            from: Utils.jidAttribute('from', true),
            id: Utils.attribute('id'),
            lang: Utils.langAttribute(),
            to: Utils.jidAttribute('to', true),
            version: Utils.attribute('version', '1.0')
        },
        name: 'stream',
        namespace: NS.STREAM
    });
}
exports.default = default_1;
