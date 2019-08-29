"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const EntityTime = JXT.define({
        element: 'time',
        fields: {
            tzo: JXT.utils.tzoSub(NS.TIME, 'tzo', 0),
            utc: JXT.utils.dateSub(NS.TIME, 'utc')
        },
        name: 'time',
        namespace: NS.TIME
    });
    JXT.extendIQ(EntityTime);
}
exports.default = default_1;
