"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    const Enable = JXT.define({
        element: 'enable',
        fields: {
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node')
        },
        name: 'enablePush',
        namespace: NS.PUSH_0
    });
    const Disable = JXT.define({
        element: 'disable',
        fields: {
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node')
        },
        name: 'disablePush',
        namespace: NS.PUSH_0
    });
    const Notification = JXT.define({
        element: 'notification',
        name: 'pushNotification',
        namespace: NS.PUSH_0
    });
    JXT.withDataForm(DataForm => {
        JXT.extend(Notification, DataForm);
        JXT.extend(Enable, DataForm);
    });
    JXT.extendIQ(Enable);
    JXT.extendIQ(Disable);
}
exports.default = default_1;
