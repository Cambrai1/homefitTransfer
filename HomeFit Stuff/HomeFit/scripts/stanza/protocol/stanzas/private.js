"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const PrivateStorage = JXT.define({
        element: 'query',
        name: 'privateStorage',
        namespace: NS.PRIVATE
    });
    JXT.extendIQ(PrivateStorage);
}
exports.default = default_1;
