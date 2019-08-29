"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    JXT.define({
        element: 'set',
        fields: {
            after: Utils.textSub(NS.RSM, 'after'),
            before: {
                get: function () {
                    return Utils.getSubText(this.xml, NS.RSM, 'before');
                },
                set: function (value) {
                    if (value === true) {
                        Utils.findOrCreate(this.xml, NS.RSM, 'before');
                    }
                    else {
                        Utils.setSubText(this.xml, NS.RSM, 'before', value);
                    }
                }
            },
            count: Utils.numberSub(NS.RSM, 'count', false, 0),
            first: Utils.textSub(NS.RSM, 'first'),
            firstIndex: Utils.numberSubAttribute(NS.RSM, 'first', 'index'),
            index: Utils.numberSub(NS.RSM, 'index', false),
            last: Utils.textSub(NS.RSM, 'last'),
            max: Utils.numberSub(NS.RSM, 'max', false)
        },
        name: 'rsm',
        namespace: NS.RSM
    });
}
exports.default = default_1;
