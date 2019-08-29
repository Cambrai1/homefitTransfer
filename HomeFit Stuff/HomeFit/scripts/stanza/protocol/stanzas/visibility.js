"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    JXT.withIQ(function (IQ) {
        JXT.add(IQ, 'visible', JXT.utils.boolSub(NS.INVISIBLE_0, 'visible'));
        JXT.add(IQ, 'invisible', JXT.utils.boolSub(NS.INVISIBLE_0, 'invisible'));
    });
}
exports.default = default_1;
