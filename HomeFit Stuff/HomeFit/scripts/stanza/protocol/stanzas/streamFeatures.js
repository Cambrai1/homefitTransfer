"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    JXT.define({
        element: 'features',
        name: 'streamFeatures',
        namespace: NS.STREAM,
        topLevel: true
    });
    const RosterVerFeature = JXT.define({
        element: 'ver',
        name: 'rosterVersioning',
        namespace: NS.ROSTER_VERSIONING
    });
    const SubscriptionPreApprovalFeature = JXT.define({
        element: 'sub',
        name: 'subscriptionPreApproval',
        namespace: NS.SUBSCRIPTION_PREAPPROVAL
    });
    JXT.extendStreamFeatures(RosterVerFeature);
    JXT.extendStreamFeatures(SubscriptionPreApprovalFeature);
}
exports.default = default_1;
