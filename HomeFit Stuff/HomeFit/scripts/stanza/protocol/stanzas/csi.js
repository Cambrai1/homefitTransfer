"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const CSIFeature = JXT.define({
        element: 'csi',
        name: 'clientStateIndication',
        namespace: NS.CSI
    });
    JXT.define({
        element: 'active',
        eventName: 'csi:active',
        name: 'csiActive',
        namespace: NS.CSI,
        topLevel: true
    });
    JXT.define({
        element: 'inactive',
        eventName: 'csi:inactive',
        name: 'csiInactive',
        namespace: NS.CSI,
        topLevel: true
    });
    JXT.extendStreamFeatures(CSIFeature);
}
exports.default = default_1;
