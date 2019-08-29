"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const nick = JXT.utils.textSub(NS.NICK, 'nick');
    JXT.withPubsubItem(function (Item) {
        JXT.add(Item, 'nick', nick);
    });
    JXT.withPresence(function (Presence) {
        JXT.add(Presence, 'nick', nick);
    });
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'nick', nick);
    });
}
exports.default = default_1;
