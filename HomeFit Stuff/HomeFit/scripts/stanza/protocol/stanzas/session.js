"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Session = JXT.define({
        element: 'session',
        fields: {
            optional: JXT.utils.boolSub(NS.SESSION, 'optional'),
            required: JXT.utils.boolSub(NS.SESSION, 'required')
        },
        name: 'session',
        namespace: NS.SESSION
    });
    JXT.extendIQ(Session);
    JXT.extendStreamFeatures(Session);
}
exports.default = default_1;
