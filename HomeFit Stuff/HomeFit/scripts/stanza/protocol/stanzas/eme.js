"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    const EncryptionMethod = JXT.define({
        element: 'encryption',
        fields: {
            name: Utils.attribute('name'),
            namespace: Utils.attribute('namespace')
        },
        name: 'encryptionMethod',
        namespace: NS.EME_0
    });
    JXT.extendMessage(EncryptionMethod);
}
exports.default = default_1;
