"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var Hark_1 = require("../lib/Hark");
var Selectors_1 = require("../Selectors");
var Calls_1 = require("./Calls");
// ====================================================================
/**
 * @description
 * Set the preferred display name for the user.
 *
 * Multiple people may have the same display name.
 *
 * Display names are _not_ unique.
 *
 * @public
 *
 * @param displayName The new display name that other peers will see
 */
function setDisplayName(displayName) {
    return function (dispatch, getState) {
        var state = getState();
        var client = Selectors_1.getClient(state);
        dispatch({
            payload: {
                displayName: displayName
            },
            type: Constants_1.SET_USER_PREFERENCE
        });
        if (client) {
            client.sendAllRoomsPresence();
        }
    };
}
exports.setDisplayName = setDisplayName;
/**
 * @description
 * Set the default user preference for media received from peers.
 *
 * Controls which media types are _received_ from peers. What media types are _sent_ to peers is left to you to control via `shareLocalMedia()` and `stopSharingLocalMedia()`.
 *
 * If set to 'video', full audio and video will be sent by peers when available.
 *
 * If set to 'audio', only audio and screen shares will be sent by peers.
 *
 * If set to 'none', peers will not send any media.
 *
 * @public
 *
 * @param mediaKind The kind of media you wish to receive from peers
 */
function setDesiredMedia(mediaKind) {
    return function (dispatch, getState) {
        var e_1, _a;
        var state = getState();
        var client = Selectors_1.getClient(state);
        dispatch({
            payload: {
                requestingMedia: mediaKind
            },
            type: Constants_1.SET_USER_PREFERENCE
        });
        var calls = Selectors_1.getJoinedCalls(state);
        try {
            for (var calls_1 = tslib_1.__values(calls), calls_1_1 = calls_1.next(); !calls_1_1.done; calls_1_1 = calls_1.next()) {
                var call = calls_1_1.value;
                dispatch(Calls_1.setDesiredMediaForCall(call.roomAddress, mediaKind));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (calls_1_1 && !calls_1_1.done && (_a = calls_1.return)) _a.call(calls_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (client) {
            client.sendAllRoomsPresence();
        }
    };
}
exports.setDesiredMedia = setDesiredMedia;
/**
 * @description
 * Set the voice activity detection threshold.
 *
 * The number MUST be negative (defaults to -65).
 *
 * @public
 *
 * @param threshold The threshold to detect voice activity
 */
function setVoiceActivityThreshold(threshold) {
    if (threshold === void 0) { threshold = -65; }
    Hark_1.setGlobalVoiceActivityThreshold(threshold);
    return {
        payload: {
            voiceActivityThreshold: threshold
        },
        type: Constants_1.SET_USER_PREFERENCE
    };
}
exports.setVoiceActivityThreshold = setVoiceActivityThreshold;
/**
 * @description
 * Enable or disable the use of push-to-talk.
 *
 * @public
 *
 * @param enabled Whether to enable push-to-talk
 */
function setPushToTalk(enabled) {
    return {
        payload: {
            pushToTalk: enabled
        },
        type: Constants_1.SET_USER_PREFERENCE
    };
}
exports.setPushToTalk = setPushToTalk;
/**
 * @description
 * Set the preferred audio output device.
 *
 * Expicitly pick an audio output sink in supported browsers.
 *
 * By default, browsers will try to use the same device capturing the audio input (e.g. using headset output when the input is the headset mic)
 *
 * @public
 *
 * @param deviceId The id of the device
 */
function setAudioOutputDevice(deviceId) {
    return {
        payload: {
            audioOutputDeviceId: deviceId
        },
        type: Constants_1.SET_USER_PREFERENCE
    };
}
exports.setAudioOutputDevice = setAudioOutputDevice;
/**
 * @description
 * Set the global output volume limit.
 *
 * The number MUST be between 0 and 1, inclusive (defaults to 1).
 *
 * Scale audio output volume without needing to use the OS volume controls. Useful if your application is expected to be running alongside other applications playing audio.
 *
 * @public
 *
 * @param globalVolumeLimit A value between 0 and 1 inclusive for scaling audio volume
 */
function setGlobalVolumeLimit(globalVolumeLimit) {
    if (globalVolumeLimit === void 0) { globalVolumeLimit = 1; }
    return {
        payload: {
            globalVolumeLimit: globalVolumeLimit
        },
        type: Constants_1.SET_USER_PREFERENCE
    };
}
exports.setGlobalVolumeLimit = setGlobalVolumeLimit;
