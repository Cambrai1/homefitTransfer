"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Ping = JXT.define({
        element: 'ping',
        name: 'ping',
        namespace: NS.PING
    });
    JXT.extendIQ(Ping);
}
exports.default = default_1;
