"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var INITIAL_STATE = {
    cameraPermissionDenied: false,
    cameraPermissionGranted: false,
    devices: [],
    hasAudioOutput: false,
    hasCamera: false,
    hasMicrophone: false,
    microphonePermissionDenied: false,
    microphonePermissionGranted: false,
    requestingCameraCapture: false,
    requestingCapture: false,
    requestingMicrophoneCapture: false
};
function default_1(state, action) {
    if (state === void 0) { state = INITIAL_STATE; }
    if (action.type === Constants_1.DEVICES) {
        var devices = action.payload;
        var audioInputs = devices.filter(function (d) { return d.kind === 'audioinput'; });
        var videoInputs = devices.filter(function (d) { return d.kind === 'videoinput'; });
        var audioOutputs = devices.filter(function (d) { return d.kind === 'audiooutput'; });
        return tslib_1.__assign({}, state, { cameraPermissionGranted: videoInputs.filter(function (d) { return !!d.label; }).length > 0, devices: devices.filter(function (d) { return !!d.label; }), hasAudioOutput: audioOutputs.length > 0, hasCamera: videoInputs.length > 0, hasMicrophone: audioInputs.length > 0, microphonePermissionGranted: audioInputs.filter(function (d) { return !!d.label; }).length > 0 });
    }
    if (action.type === Constants_1.CAMERA_PERMISSION_DENIED) {
        return tslib_1.__assign({}, state, { cameraPermissionDenied: true });
    }
    if (action.type === Constants_1.MICROPHONE_PERMISSION_DENIED) {
        return tslib_1.__assign({}, state, { microphonePermissionDenied: true });
    }
    if (action.type === Constants_1.DEVICE_CAPTURE) {
        return tslib_1.__assign({}, state, { requestingCameraCapture: action.payload.camera, requestingCapture: action.payload.camera || action.payload.microphone, requestingMicrophoneCapture: action.payload.microphone });
    }
    return state;
}
exports.default = default_1;
