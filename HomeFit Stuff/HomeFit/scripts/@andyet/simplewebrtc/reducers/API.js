"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var INITIAL_STATE = {
    config: {
        apiVersion: '',
        credential: '',
        customerData: {},
        iceServers: [],
        id: '',
        orgId: '',
        roomConfigUrl: '',
        screensharingExtensions: {
            chrome: ''
        },
        signalingUrl: '',
        telemetryUrl: '',
        userId: '',
    },
    configUrl: '',
    connectionAttempts: 0,
    connectionState: 'disconnected',
    queuedTelemetry: [],
    signalingClient: undefined,
    token: ''
};
function default_1(state, action) {
    if (state === void 0) { state = INITIAL_STATE; }
    switch (action.type) {
        case Constants_1.SIGNALING_CLIENT:
            return tslib_1.__assign({}, state, { signalingClient: action.payload });
        case Constants_1.SIGNALING_CLIENT_SHUTDOWN:
            return tslib_1.__assign({}, state, { connectionState: 'disconnected', signalingClient: undefined });
        case Constants_1.CONNECTION_STATE_CHANGE:
            return tslib_1.__assign({}, state, { connectionState: action.payload });
        case Constants_1.RECEIVED_CONFIG: {
            var config = action.payload.config;
            var configUrl = action.payload.configUrl;
            var token = action.payload.token || '';
            return tslib_1.__assign({}, state, { config: tslib_1.__assign({}, state.config, config), configUrl: configUrl,
                token: token });
        }
        case Constants_1.QUEUE_TELEMETRY:
            return tslib_1.__assign({}, state, { queuedTelemetry: tslib_1.__spread(state.queuedTelemetry, [
                    action.payload
                ]) });
        case Constants_1.TELEMETRY_SUCCESS:
            return tslib_1.__assign({}, state, { queuedTelemetry: state.queuedTelemetry.slice(action.payload) });
    }
    return state;
}
exports.default = default_1;
