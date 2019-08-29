"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Version = JXT.define({
        element: 'query',
        fields: {
            name: JXT.utils.textSub(NS.VERSION, 'name'),
            os: JXT.utils.textSub(NS.VERSION, 'os'),
            version: JXT.utils.textSub(NS.VERSION, 'version')
        },
        name: 'version',
        namespace: NS.VERSION
    });
    JXT.extendIQ(Version);
}
exports.default = default_1;
