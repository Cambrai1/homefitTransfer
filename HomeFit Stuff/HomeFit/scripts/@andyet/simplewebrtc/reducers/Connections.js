"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var INITIAL_STATE = {};
function addConnection(state, action) {
    var _a;
    return tslib_1.__assign({}, state, (_a = {}, _a[action.payload.id] = {
        connectionState: '',
        id: action.payload.id,
        peerAddress: action.payload.peerAddress,
        receivingAudioMediaId: '',
        receivingVideoMediaId: '',
        sendingAudioMediaId: '',
        sendingVideoMediaId: ''
    }, _a));
}
function updateConnection(state, action) {
    var _a;
    if (!state[action.payload.id]) {
        return state;
    }
    return tslib_1.__assign({}, state, (_a = {}, _a[action.payload.id] = tslib_1.__assign({}, (state[action.payload.id] || {}), { peerAddress: action.payload.peerAddress }, action.payload.updated), _a));
}
function removeConnection(state, action) {
    var result = tslib_1.__assign({}, state);
    delete result[action.payload.id];
    return result;
}
function default_1(state, action) {
    if (state === void 0) { state = INITIAL_STATE; }
    switch (action.type) {
        case Constants_1.PEER_CONNECTION_ADDED:
            return addConnection(state, action);
        case Constants_1.PEER_CONNECTION_UPDATED:
            return updateConnection(state, action);
        case Constants_1.PEER_CONNECTION_REMOVED:
            return removeConnection(state, action);
    }
    return state;
}
exports.default = default_1;
