"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
const internals = {};
internals.defineIQ = function (JXT, name, namespace) {
    const Utils = JXT.utils;
    const IQ = JXT.define({
        element: 'iq',
        fields: {
            from: Utils.jidAttribute('from', true),
            id: Utils.attribute('id'),
            lang: Utils.langAttribute(),
            to: Utils.jidAttribute('to', true),
            type: Utils.attribute('type')
        },
        name: name,
        namespace: namespace,
        topLevel: true
    });
    const toJSON = IQ.prototype.toJSON;
    Object.assign(IQ.prototype, {
        toJSON() {
            const result = toJSON.call(this);
            result.resultReply = this.resultReply;
            result.errorReply = this.errorReply;
            return result;
        },
        resultReply(data) {
            data = data || {};
            data.to = this.from;
            data.id = this.id;
            data.type = 'result';
            return new IQ(data);
        },
        errorReply(data) {
            data = data || {};
            data.to = this.from;
            data.id = this.id;
            data.type = 'error';
            return new IQ(data);
        }
    });
};
function default_1(JXT) {
    internals.defineIQ(JXT, 'iq', NS.CLIENT);
    internals.defineIQ(JXT, 'serverIQ', NS.SERVER);
    internals.defineIQ(JXT, 'componentIQ', NS.COMPONENT);
}
exports.default = default_1;
