"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var Selectors_1 = require("../Selectors");
var API_1 = require("./API");
var Calls_1 = require("./Calls");
// ====================================================================
/**
 * Fetch room configuration from the API.
 *
 * @private
 *
 * @param configUrl string
 * @param roomName string
 * @param auth string
 * @param maxTries number
 * @param timeout number
 */
function fetchRoomConfig(configUrl, roomName, auth, maxTries, timeout) {
    if (maxTries === void 0) { maxTries = 30; }
    if (timeout === void 0) { timeout = 1000; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var attemptCount, error, data, config, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    attemptCount = 0;
                    _a.label = 1;
                case 1:
                    if (!(attemptCount <= maxTries)) return [3 /*break*/, 8];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 7]);
                    return [4 /*yield*/, fetch(configUrl, {
                            body: JSON.stringify({ name: roomName }),
                            headers: {
                                authorization: "Bearer " + auth
                            },
                            method: 'POST'
                        })];
                case 3:
                    data = _a.sent();
                    return [4 /*yield*/, data.json()];
                case 4:
                    config = (_a.sent());
                    return [2 /*return*/, config];
                case 5:
                    err_1 = _a.sent();
                    error = err_1;
                    attemptCount += 1;
                    return [4 /*yield*/, API_1.sleep(timeout)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 1];
                case 8:
                    if (error) {
                        throw error;
                    }
                    else {
                        throw new Error('Could not fetch room config');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.fetchRoomConfig = fetchRoomConfig;
// ====================================================================
/**
 * @description
 * Attempt to join a room.
 *
 * @public
 *
 * @param roomAddress A user-friendly name for a room
 */
function joinRoom(roomName, opts) {
    var _this = this;
    if (opts === void 0) { opts = {}; }
    return function (dispatch, getState) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var state, client, apiConfig, config, existingRoom, err_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    state = getState();
                    client = Selectors_1.getClient(state);
                    apiConfig = Selectors_1.getAPIConfig(state);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchRoomConfig(apiConfig.roomConfigUrl, roomName, apiConfig.credential)];
                case 2:
                    config = _a.sent();
                    existingRoom = Selectors_1.getRoomByAddress(state, config.roomAddress);
                    if (!existingRoom || (existingRoom && !existingRoom.joined)) {
                        dispatch({
                            payload: {
                                autoJoinCall: Selectors_1.isSupportedBrowser(state) && (opts.autoJoinCall === undefined ? true : opts.autoJoinCall),
                                providedPassword: opts.password,
                                providedRoomName: roomName,
                                roomAddress: config.roomAddress
                            },
                            type: Constants_1.JOIN_ROOM
                        });
                        if (client) {
                            client.joinRoom(config.roomAddress, opts.password, opts.autoJoinCall);
                        }
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    dispatch(joinRoomFailed('', false));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
}
exports.joinRoom = joinRoom;
/**
 * An attempt to join a room failed.
 *
 * If a password is required to join the room, `passwordRequired` should be set to `true`.
 *
 * @private
 *
 * @param roomAddress string
 * @param passwordRequired boolean
 */
function joinRoomFailed(roomAddress, passwordRequired) {
    return {
        payload: {
            passwordRequired: passwordRequired,
            roomAddress: roomAddress
        },
        type: Constants_1.JOIN_ROOM_FAILED
    };
}
exports.joinRoomFailed = joinRoomFailed;
/**
 * The attempt to join a room succeeded.
 *
 * @private
 *
 * @param roomAddress string
 */
function joinRoomSuccess(roomAddress, selfAddress, roomId, role, affiliation) {
    return function (dispatch, getState) {
        dispatch({
            payload: {
                affiliation: affiliation,
                id: roomId,
                role: role,
                roomAddress: roomAddress,
                selfAddress: selfAddress
            },
            type: Constants_1.JOIN_ROOM_SUCCESS
        });
        var client = Selectors_1.getClient(getState());
        if (client) {
            client.mesh.updateConnections();
        }
    };
}
exports.joinRoomSuccess = joinRoomSuccess;
/**
 * Update the user's information for the room.
 *
 * @private
 *
 * @param roomAddress string
 */
function selfUpdated(roomAddress, selfAddress, roomId, role, affiliation) {
    return function (dispatch, getState) {
        dispatch({
            payload: {
                affiliation: affiliation,
                id: roomId,
                role: role,
                roomAddress: roomAddress,
                selfAddress: selfAddress
            },
            type: Constants_1.SELF_UPDATED
        });
    };
}
exports.selfUpdated = selfUpdated;
/**
 * @description
 * Leave a room.
 *
 * @public
 *
 * @param roomAddress The address of the room to leave
 */
function leaveRoom(roomAddress) {
    return function (dispatch, getState) {
        var state = getState();
        var client = Selectors_1.getClient(state);
        dispatch(Calls_1.leaveCall(roomAddress));
        if (client) {
            client.sendRoomPresence(roomAddress, {
                type: 'unavailable'
            });
        }
        dispatch({
            payload: {
                roomAddress: roomAddress
            },
            type: Constants_1.LEAVE_ROOM
        });
        if (client) {
            client.mesh.updateConnections();
        }
    };
}
exports.leaveRoom = leaveRoom;
/**
 * @description
 * Lock a room.
 *
 * @public
 *
 * @param roomAddress The address of the room to lock
 * @param password The new room password
 */
function lockRoom(roomAddress, password) {
    return function (dispatch, getState) {
        var state = getState();
        var client = Selectors_1.getClient(state);
        if (client) {
            client.lockRoom(roomAddress, password);
        }
        dispatch({
            payload: {
                password: password,
                roomAddress: roomAddress
            },
            type: Constants_1.LOCK_ROOM
        });
    };
}
exports.lockRoom = lockRoom;
/**
 * @description
 * Unlock a room to allow anyone to enter without needing a password.
 *
 * @public
 *
 * @param roomAddress The address of the room to unlock
 */
function unlockRoom(roomAddress) {
    return function (dispatch, getState) {
        var state = getState();
        var client = Selectors_1.getClient(state);
        if (client) {
            client.unlockRoom(roomAddress);
        }
        dispatch({
            payload: {
                roomAddress: roomAddress
            },
            type: Constants_1.UNLOCK_ROOM
        });
    };
}
exports.unlockRoom = unlockRoom;
/**
 * @description
 * Destroy a room.
 *
 * @public
 *
 * @param roomAddress  The address of the room to destroy
 */
function destroyRoom(roomAddress) {
    var _this = this;
    return function (dispatch, getState) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var state, client, err_3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    state = getState();
                    client = Selectors_1.getClient(state);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    if (!client) return [3 /*break*/, 3];
                    return [4 /*yield*/, client.destroyRoom(roomAddress)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    dispatch({
                        payload: {
                            roomAddress: roomAddress
                        },
                        type: Constants_1.DESTROY_ROOM
                    });
                    return [3 /*break*/, 5];
                case 4:
                    err_3 = _a.sent();
                    console.error(err_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
}
exports.destroyRoom = destroyRoom;
/**
 * Room has been locked.
 *
 * @private
 *
 * @param roomAddress string
 * @param password string
 */
function roomLocked(roomAddress, password) {
    return {
        payload: {
            password: password,
            roomAddress: roomAddress
        },
        type: Constants_1.ROOM_LOCKED
    };
}
exports.roomLocked = roomLocked;
/**
 * Room has been unlocked.
 *
 * @private
 *
 * @param roomAddress string
 */
function roomUnlocked(roomAddress) {
    return {
        payload: {
            roomAddress: roomAddress
        },
        type: Constants_1.ROOM_UNLOCKED
    };
}
exports.roomUnlocked = roomUnlocked;
