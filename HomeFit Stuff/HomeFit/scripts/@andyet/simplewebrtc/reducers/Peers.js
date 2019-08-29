"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var INITIAL_STATE = {};
function addPeer(state, action) {
    var _a;
    if (state[action.payload.peerAddress]) {
        return updatePeer(state, {
            payload: {
                peerAddress: action.payload.peerAddress,
                updated: action.payload
            },
            type: Constants_1.PEER_UPDATED
        });
    }
    var now = new Date(Date.now());
    return tslib_1.__assign({}, state, (_a = {}, _a[action.payload.peerAddress] = {
        address: action.payload.peerAddress,
        affiliation: action.payload.affiliation,
        chatState: 'active',
        customerData: action.payload.customerData || {},
        displayName: action.payload.displayName || '',
        id: action.payload.id,
        joinedCall: action.payload.joinedCall || false,
        joinedCallAt: action.payload.joinedCall ? now : undefined,
        joinedRoomAt: now,
        lastSpokeAt: undefined,
        muted: false,
        requestingAttention: false,
        requestingMedia: action.payload.requestingMedia || 'none',
        role: action.payload.role,
        roomAddress: action.payload.roomAddress,
        rtt: '',
        speaking: false,
        volume: -Infinity,
        volumeLimit: 0.8
    }, _a));
}
function updatePeer(state, action) {
    var _a;
    var existingPeer = state[action.payload.peerAddress];
    if (!existingPeer) {
        return state;
    }
    var now = new Date(Date.now());
    var lastSpokeAt = existingPeer.lastSpokeAt;
    if (existingPeer.speaking && action.payload.updated.speaking === false) {
        lastSpokeAt = now;
    }
    var leftCall = false;
    if (existingPeer.joinedCall && action.payload.updated.joinedCall === false) {
        leftCall = true;
    }
    return tslib_1.__assign({}, state, (_a = {}, _a[action.payload.peerAddress] = tslib_1.__assign({}, existingPeer, action.payload.updated, { joinedCallAt: leftCall ? undefined : (existingPeer.joinedCallAt || now), lastSpokeAt: lastSpokeAt }), _a));
}
function removePeer(state, action) {
    var result = tslib_1.__assign({}, state);
    delete result[action.payload.peerAddress];
    return result;
}
function removeRoomPeers(state, action) {
    var e_1, _a;
    var result = tslib_1.__assign({}, state);
    try {
        for (var _b = tslib_1.__values(Object.keys(state)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var peerAddress = _c.value;
            var peer = state[peerAddress];
            if (peer.roomAddress === action.payload.roomAddress) {
                delete result[peerAddress];
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
    return result;
}
function default_1(state, action) {
    if (state === void 0) { state = INITIAL_STATE; }
    switch (action.type) {
        case Constants_1.PEER_ONLINE:
            return addPeer(state, action);
        case Constants_1.PEER_OFFLINE:
            return removePeer(state, action);
        case Constants_1.PEER_UPDATED:
            return updatePeer(state, action);
        case Constants_1.LEAVE_ROOM:
            return removeRoomPeers(state, action);
    }
    return state;
}
exports.default = default_1;
