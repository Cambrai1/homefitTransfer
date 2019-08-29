"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const JSONExtension = {
        get: function () {
            const data = JXT.utils.getSubText(this.xml, NS.JSON_0, 'json');
            if (data) {
                return JSON.parse(data);
            }
        },
        set: function (value) {
            value = JSON.stringify(value);
            if (value) {
                JXT.utils.setSubText(this.xml, NS.JSON_0, 'json', value);
            }
        }
    };
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'json', JSONExtension);
    });
    JXT.withPubsubItem(function (Item) {
        JXT.add(Item, 'json', JSONExtension);
    });
}
exports.default = default_1;
