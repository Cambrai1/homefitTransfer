"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var INITIAL_STATE = {};
function addChat(state, action) {
    var _a, _b, _c, _d;
    if (action.type === Constants_1.CHAT_INCOMING) {
        var chat = action.payload;
        var existing = state[chat.id];
        if (chat.replace) {
            var original = state[chat.replace];
            if (original && original.direction === Constants_1.DIRECTION_OUTGOING) {
                return tslib_1.__assign({}, state, (_a = {}, _a[chat.id] = tslib_1.__assign({}, existing, { acked: true, body: chat.body }), _a));
            }
        }
        if (!existing) {
            return tslib_1.__assign({}, state, (_b = {}, _b[chat.id] = chat, _b));
        }
        if (existing.direction === Constants_1.DIRECTION_OUTGOING) {
            return tslib_1.__assign({}, state, (_c = {}, _c[chat.id] = tslib_1.__assign({}, existing, { acked: true, body: chat.body }), _c));
        }
    }
    if (action.type === Constants_1.CHAT_OUTGOING) {
        var chat = action.payload;
        var existing = state[chat.id];
        return tslib_1.__assign({}, state, (_d = {}, _d[chat.id] = editChat(existing, chat), _d));
    }
    return state;
}
function editChat(original, replacement) {
    if (!original) {
        return replacement;
    }
    return tslib_1.__assign({}, replacement, { editedTime: replacement.time, time: original.time });
}
function default_1(state, action) {
    if (state === void 0) { state = INITIAL_STATE; }
    switch (action.type) {
        case Constants_1.CHAT_INCOMING:
            return addChat(state, action);
        case Constants_1.CHAT_OUTGOING:
            return addChat(state, action);
    }
    return state;
}
exports.default = default_1;
