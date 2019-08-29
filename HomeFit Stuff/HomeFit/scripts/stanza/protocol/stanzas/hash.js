"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    JXT.define({
        element: 'hash',
        fields: {
            algo: JXT.utils.attribute('algo'),
            value: JXT.utils.text()
        },
        name: 'hash',
        namespace: NS.HASHES_1
    });
}
exports.default = default_1;
