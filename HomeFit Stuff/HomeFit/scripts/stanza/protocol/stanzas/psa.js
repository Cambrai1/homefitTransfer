"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
const CONDITIONS = ['server-unavailable', 'connection-paused'];
function default_1(JXT) {
    const PSA = JXT.define({
        element: 'state-annotation',
        fields: {
            condition: JXT.utils.enumSub(NS.PSA, CONDITIONS),
            description: JXT.utils.textSub(NS.PSA, 'description'),
            from: JXT.utils.jidAttribute('from')
        },
        name: 'state',
        namespace: NS.PSA
    });
    JXT.extendPresence(PSA);
}
exports.default = default_1;
