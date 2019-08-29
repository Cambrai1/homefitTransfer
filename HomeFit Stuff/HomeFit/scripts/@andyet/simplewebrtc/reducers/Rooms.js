"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var INITIAL_STATE = {};
function addRoom(state, action) {
    var _a;
    return tslib_1.__assign({}, state, (_a = {}, _a[action.payload.roomAddress] = {
        address: action.payload.roomAddress,
        autoJoinCall: !!action.payload.autoJoinCall,
        id: '',
        joined: false,
        joinedAt: undefined,
        password: action.payload.password || '',
        passwordRequired: false,
        providedName: action.payload.providedRoomName,
        providedPassword: action.payload.providedPassword,
        roomState: 'joining',
        selfAddress: '',
        selfAffiliation: 'none',
        selfRole: 'none',
        unreadCount: 0
    }, _a));
}
function updateRoom(state, action) {
    var _a, _b;
    var existingRoom = state[action.payload.roomAddress];
    if (!existingRoom) {
        return state;
    }
    if (action.type === Constants_1.JOIN_ROOM_FAILED) {
        return tslib_1.__assign({}, state, (_a = {}, _a[action.payload.roomAddress] = tslib_1.__assign({}, existingRoom, { joined: false, joinedAt: undefined, password: '', passwordRequired: !!action.payload.passwordRequired, roomState: !!action.payload.passwordRequired ? 'password-required' : 'failed' }), _a));
    }
    return tslib_1.__assign({}, state, (_b = {}, _b[action.payload.roomAddress] = tslib_1.__assign({}, existingRoom, { id: action.payload.id, joined: true, joinedAt: existingRoom.joinedAt || new Date(Date.now()), roomState: 'joined', selfAddress: action.payload.selfAddress, selfAffiliation: action.payload.affiliation, selfRole: action.payload.role }), _b));
}
function updateRoomLock(state, action) {
    var _a, _b, _c;
    var existingRoom = state[action.payload.roomAddress];
    if (!existingRoom) {
        return state;
    }
    switch (action.type) {
        case Constants_1.LOCK_ROOM:
            return tslib_1.__assign({}, state, (_a = {}, _a[action.payload.roomAddress] = tslib_1.__assign({}, existingRoom, { providedPassword: action.payload.password || '' }), _a));
        case Constants_1.ROOM_LOCKED:
            return tslib_1.__assign({}, state, (_b = {}, _b[action.payload.roomAddress] = tslib_1.__assign({}, existingRoom, { password: action.payload.password || '', passwordRequired: true, providedPassword: undefined }), _b));
        case Constants_1.ROOM_UNLOCKED:
            return tslib_1.__assign({}, state, (_c = {}, _c[action.payload.roomAddress] = tslib_1.__assign({}, existingRoom, { password: '', passwordRequired: false, providedPassword: undefined }), _c));
    }
    return state;
}
function removeRoom(state, action) {
    var result = tslib_1.__assign({}, state);
    delete result[action.payload.roomAddress];
    return result;
}
function default_1(state, action) {
    if (state === void 0) { state = INITIAL_STATE; }
    switch (action.type) {
        case Constants_1.SELF_UPDATED:
            return updateRoom(state, action);
        case Constants_1.JOIN_ROOM:
            return addRoom(state, action);
        case Constants_1.JOIN_ROOM_FAILED:
            return updateRoom(state, action);
        case Constants_1.JOIN_ROOM_SUCCESS:
            return updateRoom(state, action);
        case Constants_1.LEAVE_ROOM:
            return removeRoom(state, action);
        case Constants_1.LOCK_ROOM:
        case Constants_1.UNLOCK_ROOM:
        case Constants_1.ROOM_LOCKED:
        case Constants_1.ROOM_UNLOCKED:
            return updateRoomLock(state, action);
    }
    return state;
}
exports.default = default_1;
