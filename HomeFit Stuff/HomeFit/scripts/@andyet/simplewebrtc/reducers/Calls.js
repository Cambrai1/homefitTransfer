"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var INITIAL_STATE = {};
function addCall(state, action) {
    var _a;
    return tslib_1.__assign({}, state, (_a = {}, _a[action.payload.roomAddress] = {
        allowedAudioRoles: ['moderator', 'participant'],
        allowedMedia: 'video',
        allowedVideoRoles: ['moderator', 'participant'],
        joined: false,
        joinedAt: undefined,
        recordable: false,
        recordingState: 'offline',
        requestingMedia: undefined,
        roomAddress: action.payload.roomAddress,
        state: 'active'
    }, _a));
}
function updatedCall(state, action) {
    var _a, _b, _c;
    if (!state[action.payload.roomAddress]) {
        state = addCall(state, action);
    }
    if (action.type === Constants_1.JOIN_CALL) {
        return tslib_1.__assign({}, state, (_a = {}, _a[action.payload.roomAddress] = tslib_1.__assign({}, state[action.payload.roomAddress], { joined: true, joinedAt: new Date(Date.now()), requestingMedia: action.payload.desiredMedia }), _a));
    }
    if (action.type === Constants_1.LEAVE_CALL) {
        return tslib_1.__assign({}, state, (_b = {}, _b[action.payload.roomAddress] = tslib_1.__assign({}, state[action.payload.roomAddress], { joined: false, joinedAt: undefined, requestingMedia: undefined }), _b));
    }
    if (action.type === Constants_1.SET_CALL_PREFERENCE) {
        return tslib_1.__assign({}, state, (_c = {}, _c[action.payload.roomAddress] = tslib_1.__assign({}, state[action.payload.roomAddress], { requestingMedia: action.payload.desiredMedia }), _c));
    }
    return state;
}
function removeCall(state, action) {
    var result = tslib_1.__assign({}, state);
    delete result[action.payload.roomAddress];
    return result;
}
function default_1(state, action) {
    if (state === void 0) { state = INITIAL_STATE; }
    switch (action.type) {
        case Constants_1.JOIN_CALL:
            return updatedCall(state, action);
        case Constants_1.LEAVE_CALL:
            return updatedCall(state, action);
        case Constants_1.LEAVE_ROOM:
            return removeCall(state, action);
        case Constants_1.JOIN_ROOM_SUCCESS:
            return updatedCall(state, action);
        case Constants_1.SET_CALL_PREFERENCE:
            return updatedCall(state, action);
    }
    return state;
}
exports.default = default_1;
