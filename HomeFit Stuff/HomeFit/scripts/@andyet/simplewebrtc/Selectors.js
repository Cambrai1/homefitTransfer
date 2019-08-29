"use strict";
// getConnectionForMedia
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("./Constants");
/**
 * @description
 *
 * @public
 *
 */
function getAPIConfig(state) {
    return state.simplewebrtc.api.config;
}
exports.getAPIConfig = getAPIConfig;
/**
 * @description
 *
 * @public
 *
 */
function getUserToken(state) {
    return state.simplewebrtc.api.token;
}
exports.getUserToken = getUserToken;
/**
 * @description
 *
 * @public
 *
 */
function getUser(state) {
    return state.simplewebrtc.user;
}
exports.getUser = getUser;
/**
 * @description
 *
 * @public
 *
 */
function getUserCustomerData(state) {
    return getAPIConfig(state).customerData;
}
exports.getUserCustomerData = getUserCustomerData;
/**
 * @description
 *
 * @public
 *
 */
function getConfigURL(state) {
    return state.simplewebrtc.api.configUrl;
}
exports.getConfigURL = getConfigURL;
/**
 * @description
 *
 * @public
 *
 */
function getClient(state) {
    return state.simplewebrtc.api.signalingClient;
}
exports.getClient = getClient;
/**
 * @description
 *
 * @public
 *
 */
function getQueuedTelemetry(state) {
    return state.simplewebrtc.api.queuedTelemetry;
}
exports.getQueuedTelemetry = getQueuedTelemetry;
/**
 * @description
 *
 * @public
 *
 */
function getConnectionState(state) {
    return state.simplewebrtc.api.connectionState;
}
exports.getConnectionState = getConnectionState;
/**
 * @description
 *
 * @public
 *
 */
function getUserDisplayName(state) {
    return state.simplewebrtc.user.displayName;
}
exports.getUserDisplayName = getUserDisplayName;
/**
 * @description
 *
 * @public
 *
 */
function getUserDataForRoom(state, roomAddress) {
    var config = getAPIConfig(state);
    var room = getRoomByAddress(state, roomAddress);
    var call = getCallForRoom(state, roomAddress);
    var localAudio = getLocalMedia(state, 'audio');
    var recentSpeaking = localAudio.filter(function (a) { return a.lastSpokeAt; }).sort(function (a, b) {
        var lastA = a.lastSpokeAt ? a.lastSpokeAt.valueOf() : 0;
        var lastB = b.lastSpokeAt ? b.lastSpokeAt.valueOf() : 0;
        return lastA - lastB;
    });
    return {
        address: room.selfAddress,
        affiliation: room.selfAffiliation,
        chatState: 'active',
        customerData: getAPIConfig(state).customerData,
        displayName: getUserDisplayName(state),
        id: config.id,
        joinedCall: call.joined,
        joinedCallAt: call.joinedAt,
        joinedRoomAt: room.joinedAt,
        lastSpokeAt: recentSpeaking.length ? recentSpeaking[0].lastSpokeAt : undefined,
        muted: false,
        requestingAttention: false,
        requestingMedia: getDesiredMediaTypes(state, roomAddress),
        role: room.selfRole,
        roomAddress: roomAddress,
        rtt: '',
        speaking: userIsSpeaking(state),
        volume: 0,
        volumeLimit: 0.8
    };
}
exports.getUserDataForRoom = getUserDataForRoom;
/**
 * @description
 *
 * @public
 *
 */
function getDesiredMediaTypes(state, roomAddress) {
    var defaultRequest = state.simplewebrtc.user.requestingMedia;
    if (roomAddress) {
        var call = getCallForRoom(state, roomAddress);
        if (call) {
            return call.requestingMedia || defaultRequest;
        }
    }
    return defaultRequest;
}
exports.getDesiredMediaTypes = getDesiredMediaTypes;
/**
 * @description
 *
 * @public
 *
 */
function getPushToTalkEnabled(state) {
    return state.simplewebrtc.user.pushToTalk;
}
exports.getPushToTalkEnabled = getPushToTalkEnabled;
/**
 * @description
 *
 * @public
 *
 */
function getPeerByAddress(state, peerAddress) {
    return state.simplewebrtc.peers[peerAddress];
}
exports.getPeerByAddress = getPeerByAddress;
/**
 * @description
 *
 * @public
 *
 */
function getRooms(state) {
    return state.simplewebrtc.rooms;
}
exports.getRooms = getRooms;
/**
 * @description
 *
 * @public
 *
 */
function getRoomByAddress(state, roomAddress) {
    return state.simplewebrtc.rooms[roomAddress];
}
exports.getRoomByAddress = getRoomByAddress;
/**
 * @description
 *
 * @public
 *
 */
function getRoomByProvidedName(state, roomName) {
    var e_1, _a;
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.rooms)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var roomAddress = _c.value;
            if (state.simplewebrtc.rooms[roomAddress].providedName === roomName) {
                return state.simplewebrtc.rooms[roomAddress];
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
}
exports.getRoomByProvidedName = getRoomByProvidedName;
/**
 * @description
 *
 * @public
 *
 */
function getPeersForRoom(state, roomAddress) {
    var e_2, _a;
    var peers = [];
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.peers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var peerAddress = _c.value;
            if (state.simplewebrtc.peers[peerAddress].roomAddress === roomAddress) {
                peers.push(state.simplewebrtc.peers[peerAddress]);
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return peers;
}
exports.getPeersForRoom = getPeersForRoom;
/**
 * @description
 *
 * @public
 *
 */
function getChatsForRoom(state, roomAddress) {
    var e_3, _a;
    var chats = [];
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.chats)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var chat = state.simplewebrtc.chats[id];
            if (chat.roomAddress === roomAddress) {
                chats.push(chat);
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return chats.sort(function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : 0; });
}
exports.getChatsForRoom = getChatsForRoom;
/**
 * @description
 *
 * @public
 *
 */
function getGroupedChatsForRoom(state, roomAddress, maxDuration) {
    var e_4, _a;
    if (maxDuration === void 0) { maxDuration = 5 * 60; }
    var groupedChats = [];
    var chats = getChatsForRoom(state, roomAddress);
    var lastGroup;
    try {
        for (var chats_1 = tslib_1.__values(chats), chats_1_1 = chats_1.next(); !chats_1_1.done; chats_1_1 = chats_1.next()) {
            var chat = chats_1_1.value;
            var newSender = !lastGroup || chat.senderAddress !== lastGroup.senderAddress;
            var prevChat = lastGroup ? lastGroup.chats[lastGroup.chats.length - 1] : undefined;
            var newDisplayName = !lastGroup || (prevChat && chat.displayName && chat.displayName !== prevChat.displayName);
            var expired = false;
            if (maxDuration) {
                // Also start a new group if the current group has lasted for a significant amount of time.
                expired = !lastGroup || (Number(chat.time) > (Number(lastGroup.chats[0].time) + maxDuration * 1000));
            }
            if (newSender || newDisplayName || expired) {
                var peer = getPeerByAddress(state, chat.senderAddress) || {};
                if (chat.direction === 'outgoing') {
                    peer = getUserDataForRoom(state, roomAddress);
                }
                lastGroup = {
                    chats: [chat],
                    direction: chat.direction,
                    displayName: peer.displayName || chat.displayName,
                    endTime: chat.time,
                    peer: peer,
                    senderAddress: chat.senderAddress,
                    startTime: chat.time
                };
                groupedChats.push(lastGroup);
            }
            else if (lastGroup) {
                lastGroup.chats.push(chat);
                lastGroup.endTime = chat.time;
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (chats_1_1 && !chats_1_1.done && (_a = chats_1.return)) _a.call(chats_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return groupedChats;
}
exports.getGroupedChatsForRoom = getGroupedChatsForRoom;
/**
 * @description
 *
 * @public
 *
 */
function getLastSentChat(state, roomAddress) {
    var chats = getChatsForRoom(state, roomAddress);
    return chats.filter(function (c) { return c.direction === Constants_1.DIRECTION_OUTGOING; }).slice(-1)[0];
}
exports.getLastSentChat = getLastSentChat;
/**
 * @description
 *
 * @public
 *
 */
function getChatComposers(state, roomAddress) {
    var e_5, _a;
    var results = [];
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.peers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var peer = state.simplewebrtc.peers[id];
            if (peer.roomAddress === roomAddress && peer.chatState === 'composing') {
                results.push(peer);
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_5) throw e_5.error; }
    }
    return results;
}
exports.getChatComposers = getChatComposers;
/**
 * @description
 *
 * @public
 *
 */
function getCallForRoom(state, roomAddress) {
    return state.simplewebrtc.calls[roomAddress];
}
exports.getCallForRoom = getCallForRoom;
/**
 * @description
 *
 * @public
 *
 */
function getMedia(state) {
    return state.simplewebrtc.media;
}
exports.getMedia = getMedia;
/**
 * @description
 *
 * @public
 *
 */
function getMediaTrack(state, id) {
    return state.simplewebrtc.media[id];
}
exports.getMediaTrack = getMediaTrack;
/**
 * @description
 *
 * @public
 *
 */
function getDeviceForMediaTrack(state, id) {
    var e_6, _a, e_7, _b;
    var track = getMediaTrack(state, id);
    if (!track) {
        return;
    }
    var deviceId;
    var deviceLabel = track.track.label;
    var deviceKind = track.kind + "input";
    if (track.track.getSettings) {
        var settings = track.track.getSettings();
        deviceId = settings.deviceId;
    }
    var devices = state.simplewebrtc.devices.devices;
    if (deviceId) {
        try {
            for (var devices_1 = tslib_1.__values(devices), devices_1_1 = devices_1.next(); !devices_1_1.done; devices_1_1 = devices_1.next()) {
                var device = devices_1_1.value;
                if (device.deviceId === deviceId) {
                    return device;
                }
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (devices_1_1 && !devices_1_1.done && (_a = devices_1.return)) _a.call(devices_1);
            }
            finally { if (e_6) throw e_6.error; }
        }
    }
    try {
        for (var devices_2 = tslib_1.__values(devices), devices_2_1 = devices_2.next(); !devices_2_1.done; devices_2_1 = devices_2.next()) {
            var device = devices_2_1.value;
            if (deviceLabel === device.label && deviceKind === device.kind) {
                return device;
            }
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (devices_2_1 && !devices_2_1.done && (_b = devices_2.return)) _b.call(devices_2);
        }
        finally { if (e_7) throw e_7.error; }
    }
}
exports.getDeviceForMediaTrack = getDeviceForMediaTrack;
/**
 * @description
 *
 * @public
 *
 */
function getDevices(state, kind) {
    var devices = state.simplewebrtc.devices.devices;
    if (!kind) {
        return devices;
    }
    return devices.filter(function (device) { return device.kind === kind; });
}
exports.getDevices = getDevices;
/**
 * @description
 *
 * @public
 *
 */
function getDevicePermissions(state) {
    var devices = state.simplewebrtc.devices;
    return {
        cameraPermissionDenied: devices.cameraPermissionDenied,
        cameraPermissionGranted: devices.cameraPermissionGranted,
        hasAudioOutput: devices.hasAudioOutput,
        hasCamera: devices.hasCamera,
        hasMicrophone: devices.hasMicrophone,
        microphonePermissionDenied: devices.microphonePermissionDenied,
        microphonePermissionGranted: devices.microphonePermissionGranted,
        requestingCameraCapture: devices.requestingCameraCapture,
        requestingCapture: devices.requestingCapture,
        requestingMicrophoneCapture: devices.requestingMicrophoneCapture
    };
}
exports.getDevicePermissions = getDevicePermissions;
/**
 * @description
 *
 * @public
 *
 */
function getMediaForPeer(state, peerAddress, kind) {
    var e_8, _a;
    var results = [];
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.media)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var media = state.simplewebrtc.media[id];
            if (media.owner === peerAddress) {
                if (!kind || kind === media.kind) {
                    results.push(media);
                }
            }
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_8) throw e_8.error; }
    }
    return results;
}
exports.getMediaForPeer = getMediaForPeer;
/**
 * @description
 *
 * @public
 *
 */
function getLocalMedia(state, kind) {
    var e_9, _a;
    var results = [];
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.media)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var media = state.simplewebrtc.media[id];
            if (media.source === 'local') {
                if (!kind || kind === media.kind) {
                    results.push(media);
                }
            }
        }
    }
    catch (e_9_1) { e_9 = { error: e_9_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_9) throw e_9.error; }
    }
    return results.sort(function (a, b) { return a.createdAt - b.createdAt; });
}
exports.getLocalMedia = getLocalMedia;
/**
 * @description
 *
 * @public
 *
 */
function getRemoteMedia(state, kind) {
    var e_10, _a;
    var results = [];
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.media)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var media = state.simplewebrtc.media[id];
            if (media.source === 'remote') {
                if (!kind || kind === media.kind) {
                    results.push(media);
                }
            }
        }
    }
    catch (e_10_1) { e_10 = { error: e_10_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_10) throw e_10.error; }
    }
    return results;
}
exports.getRemoteMedia = getRemoteMedia;
/**
 * @description
 *
 * @public
 *
 */
function getSharedMedia(state, kind) {
    var e_11, _a;
    var results = [];
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.media)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var media = state.simplewebrtc.media[id];
            if (media.source === 'local' && media.shared) {
                if (!kind || kind === media.kind) {
                    results.push(media);
                }
            }
        }
    }
    catch (e_11_1) { e_11 = { error: e_11_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_11) throw e_11.error; }
    }
    return results;
}
exports.getSharedMedia = getSharedMedia;
/**
 * @description
 *
 * @public
 *
 */
function getAudioOutputDevice(state) {
    return state.simplewebrtc.user.audioOutputDeviceId;
}
exports.getAudioOutputDevice = getAudioOutputDevice;
/**
 * @description
 *
 * @public
 *
 */
function getGlobalVolumeLimit(state) {
    return state.simplewebrtc.user.globalVolumeLimit;
}
exports.getGlobalVolumeLimit = getGlobalVolumeLimit;
/**
 * @description
 *
 * @public
 *
 */
function getJoinedCalls(state) {
    var e_12, _a;
    var results = [];
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.calls)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var call = state.simplewebrtc.calls[id];
            var room = getRoomByAddress(state, call.roomAddress);
            if (call.joined && room && room.joined) {
                results.push(call);
            }
        }
    }
    catch (e_12_1) { e_12 = { error: e_12_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_12) throw e_12.error; }
    }
    return results;
}
exports.getJoinedCalls = getJoinedCalls;
/**
 * @description
 *
 * @public
 *
 */
function getPeersForCall(state, roomAddress) {
    var e_13, _a;
    var results = [];
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.peers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var peer = state.simplewebrtc.peers[id];
            if (peer.roomAddress === roomAddress && peer.joinedCall) {
                results.push(peer);
            }
        }
    }
    catch (e_13_1) { e_13 = { error: e_13_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_13) throw e_13.error; }
    }
    return results;
}
exports.getPeersForCall = getPeersForCall;
/**
 * @description
 *
 * @public
 *
 */
function getActiveSpeakersForCall(state, roomAddress) {
    var e_14, _a;
    var results = [];
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.peers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var peer = state.simplewebrtc.peers[id];
            if (peer.roomAddress === roomAddress && peer.joinedCall && peer.speaking) {
                results.push(peer);
            }
        }
    }
    catch (e_14_1) { e_14 = { error: e_14_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_14) throw e_14.error; }
    }
    return results;
}
exports.getActiveSpeakersForCall = getActiveSpeakersForCall;
/**
 * @description
 *
 * @public
 *
 */
function getConnections(state) {
    return state.simplewebrtc.connections;
}
exports.getConnections = getConnections;
/**
 * @description
 *
 * @public
 *
 */
function getConnectionsForPeer(state, peerAddress) {
    var e_15, _a;
    var results = [];
    var connections = getConnections(state);
    try {
        for (var _b = tslib_1.__values(Object.keys(connections)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var connection = connections[id];
            if (connection.peerAddress === peerAddress) {
                results.push(connection);
            }
        }
    }
    catch (e_15_1) { e_15 = { error: e_15_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_15) throw e_15.error; }
    }
    return results;
}
exports.getConnectionsForPeer = getConnectionsForPeer;
/**
 * @description
 *
 * @public
 *
 */
function countPeersWantingVideo(state) {
    var e_16, _a;
    var count = 0;
    try {
        for (var _b = tslib_1.__values(Object.keys(state.simplewebrtc.peers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var peer = state.simplewebrtc.peers[id];
            if (peer.requestingMedia === 'video') {
                count += 1;
            }
        }
    }
    catch (e_16_1) { e_16 = { error: e_16_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_16) throw e_16.error; }
    }
    return count;
}
exports.countPeersWantingVideo = countPeersWantingVideo;
/**
 * @description
 *
 * @public
 */
function isSupportedBrowser(state) {
    return !!('RTCPeerConnection' in window) && !!('mediaDevices' in navigator);
}
exports.isSupportedBrowser = isSupportedBrowser;
/**
 * @description
 *
 * @private
 */
function userIsSpeaking(state) {
    var localAudio = getLocalMedia(state, 'audio');
    return localAudio.filter(function (a) { return !a.localDisabled && !a.externalDisabled && a.shared && a.speaking; }).length > 0;
}
exports.userIsSpeaking = userIsSpeaking;
