"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    const Log = JXT.define({
        element: 'log',
        fields: {
            facility: Utils.attribute('facility'),
            id: Utils.attribute('id'),
            level: Utils.attribute('level'),
            message: Utils.textSub(NS.EVENTLOG, 'message'),
            module: Utils.attribute('module'),
            object: Utils.attribute('object'),
            stackTrace: Utils.textSub(NS.EVENTLOG, 'stackTrace'),
            subject: Utils.attribute('subject'),
            timestamp: Utils.dateAttribute('timestamp'),
            type: Utils.attribute('type')
        },
        name: 'log',
        namespace: NS.EVENTLOG
    });
    const Tag = JXT.define({
        element: 'tag',
        fields: {
            name: Utils.attribute('name'),
            type: Utils.attribute('type'),
            value: Utils.attribute('value')
        },
        name: '_logtag',
        namespace: NS.EVENTLOG
    });
    JXT.extend(Log, Tag, 'tags');
    JXT.extendMessage(Log);
    JXT.extendPubsubItem(Log);
}
exports.default = default_1;
