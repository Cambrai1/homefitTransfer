"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
// =====================================================================
var deviceListener;
var devicePollInterval;
// =====================================================================
/**
 * @description
 * Begin listening for media device changes.
 *
 * @public
 */
function listenForDevices() {
    return function (dispatch, getState) {
        if (!navigator.mediaDevices) {
            return;
        }
        if (!deviceListener) {
            deviceListener = function () {
                dispatch(fetchDevices());
            };
        }
        deviceListener();
        navigator.mediaDevices.addEventListener('devicechange', deviceListener);
        // Safari 12.0 does not emit device change events, but does update its
        // list of devices current.
        if (window.safari) {
            devicePollInterval = setInterval(function () {
                if (deviceListener) {
                    deviceListener();
                }
            }, 1000);
        }
    };
}
exports.listenForDevices = listenForDevices;
/**
 * @description
 * Fetch devices.
 *
 * @public
 */
function fetchDevices() {
    var _this = this;
    return function (dispatch) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var devices;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!navigator.mediaDevices) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, navigator.mediaDevices.enumerateDevices()];
                case 1:
                    devices = _a.sent();
                    return [2 /*return*/, dispatch(deviceList(devices))];
            }
        });
    }); };
}
exports.fetchDevices = fetchDevices;
/**
 * @description
 * Stop listening for media device changes.
 *
 * @public
 */
function stopListeningForDevices() {
    if (deviceListener) {
        navigator.mediaDevices.removeEventListener('devicechange', deviceListener);
        deviceListener = undefined;
    }
    if (devicePollInterval) {
        clearInterval(devicePollInterval);
        devicePollInterval = undefined;
    }
}
exports.stopListeningForDevices = stopListeningForDevices;
/**
 * Device list changed.
 *
 * @private
 *
 * @param devices Device[]
 */
function deviceList(devices) {
    devices = devices.filter(function (d) {
        // Work around Safari reporting the built-in speakers as a microphone
        if (d.kind === 'audioinput' && d.label === 'MacBook Pro Speakers') {
            return false;
        }
        return true;
    });
    return {
        payload: devices,
        type: Constants_1.DEVICES
    };
}
exports.deviceList = deviceList;
/**
 * Camera permission denied
 *
 * @private
 *
 * @param error Error
 */
function cameraPermissionDenied(error) {
    return {
        payload: {
            error: error
        },
        type: Constants_1.CAMERA_PERMISSION_DENIED
    };
}
exports.cameraPermissionDenied = cameraPermissionDenied;
/**
 * Microphone permission denied
 *
 * @private
 *
 * @param error Error
 */
function microphonePermissionDenied(error) {
    return {
        payload: {
            error: error
        },
        type: Constants_1.MICROPHONE_PERMISSION_DENIED
    };
}
exports.microphonePermissionDenied = microphonePermissionDenied;
/**
 * Update device capture request status.
 *
 * @private
 *
 * @param error Error
 */
function deviceCaptureRequest(camera, microphone) {
    return {
        payload: {
            camera: camera,
            microphone: microphone
        },
        type: Constants_1.DEVICE_CAPTURE
    };
}
exports.deviceCaptureRequest = deviceCaptureRequest;
