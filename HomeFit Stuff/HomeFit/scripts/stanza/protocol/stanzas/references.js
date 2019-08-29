"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    const Reference = JXT.define({
        element: 'reference',
        fields: {
            anchor: Utils.attribute('anchor'),
            begin: Utils.numberAttribute('begin'),
            end: Utils.numberAttribute('end'),
            type: Utils.attribute('type'),
            uri: Utils.attribute('uri')
        },
        name: 'reference',
        namespace: NS.REFERENCE_0
    });
    const References = Utils.multiExtension(Reference);
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'references', References);
    });
}
exports.default = default_1;
