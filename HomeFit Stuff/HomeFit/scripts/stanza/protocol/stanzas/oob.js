"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const OOB = JXT.define({
        element: 'x',
        fields: {
            desc: JXT.utils.textSub(NS.OOB, 'desc'),
            url: JXT.utils.textSub(NS.OOB, 'url')
        },
        name: 'oob',
        namespace: NS.OOB
    });
    const OOB_IQ = JXT.define({
        element: 'query',
        fields: {
            desc: JXT.utils.textSub(NS.OOB, 'desc'),
            url: JXT.utils.textSub(NS.OOB, 'url')
        },
        name: 'oob',
        namespace: NS.OOB_IQ
    });
    JXT.extendMessage(OOB, 'oobURIs');
    JXT.extendIQ(OOB_IQ);
}
exports.default = default_1;
