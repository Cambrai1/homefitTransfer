"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var INITIAL_STATE = {};
function addMedia(state, action) {
    var _a;
    return tslib_1.__assign({}, state, (_a = {}, _a[action.payload.id] = action.payload, _a));
}
// TODO: typedoc merges this definition with the action of the same name making it
// impossible to generate docs for the action
function removeMediaReducer(state, action) {
    var result = tslib_1.__assign({}, state);
    delete result[action.payload.id];
    return result;
}
function updatedMedia(state, action) {
    var _a;
    var existing = state[action.payload.id];
    if (!existing) {
        return state;
    }
    return tslib_1.__assign({}, state, (_a = {}, _a[action.payload.id] = tslib_1.__assign({}, existing, action.payload.updated), _a));
}
function removeCallMedia(state, action) {
    var e_1, _a;
    var result = tslib_1.__assign({}, state);
    try {
        for (var _b = tslib_1.__values(Object.keys(state)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var media = state[id];
            if (media.source === 'remote' && media.roomAddress === action.payload.roomAddress) {
                delete result[id];
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return result || {};
}
function default_1(state, action) {
    if (state === void 0) { state = INITIAL_STATE; }
    switch (action.type) {
        case Constants_1.ADD_MEDIA:
            return addMedia(state, action);
        case Constants_1.REMOVE_MEDIA:
            return removeMediaReducer(state, action);
        case Constants_1.MEDIA_UPDATED:
            return updatedMedia(state, action);
        case Constants_1.LEAVE_CALL:
            return removeCallMedia(state, action);
    }
    return state;
}
exports.default = default_1;
