"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Hat = JXT.define({
        element: 'hat',
        fields: {
            displayName: JXT.utils.attribute('displayName'),
            lang: JXT.utils.langAttribute(),
            name: JXT.utils.attribute('name')
        },
        name: '_hat',
        namespace: NS.HATS_0
    });
    JXT.withPresence(function (Presence) {
        JXT.add(Presence, 'hats', JXT.utils.subMultiExtension(NS.HATS_0, 'hats', Hat));
    });
}
exports.default = default_1;
