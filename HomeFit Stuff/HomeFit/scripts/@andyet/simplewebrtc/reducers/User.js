"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var INITIAL_STATE = {
    displayName: '',
    globalVolumeLimit: 1,
    mediaEnabled: true,
    pushToTalk: false,
    requestingMedia: 'video',
    voiceActivityThreshold: -65
};
function updatePreference(state, action) {
    return tslib_1.__assign({}, state, action.payload);
}
function default_1(state, action) {
    var e_1, _a;
    if (state === void 0) { state = INITIAL_STATE; }
    switch (action.type) {
        case Constants_1.SET_USER_PREFERENCE:
            return updatePreference(state, action);
        case Constants_1.RECEIVED_CONFIG:
            return updatePreference(state, {
                payload: {
                    displayName: action.payload.config.displayName || state.displayName || 'Anonymous'
                },
                type: Constants_1.SET_USER_PREFERENCE
            });
        case Constants_1.DEVICES: {
            var outputDevice = state.audioOutputDeviceId;
            if (outputDevice) {
                try {
                    for (var _b = tslib_1.__values(action.payload), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var device = _c.value;
                        if (device.id === outputDevice) {
                            return state;
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
                // Our output device is no longer available
                return updatePreference(state, {
                    payload: {
                        audioOutputDeviceId: ''
                    },
                    type: Constants_1.SET_USER_PREFERENCE
                });
            }
            return state;
        }
    }
    return state;
}
exports.default = default_1;
