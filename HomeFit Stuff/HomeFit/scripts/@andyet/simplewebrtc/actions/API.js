"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var signaling_1 = require("../signaling");
var Constants_1 = require("../Constants");
var Selectors_1 = require("../Selectors");
var REPORTING_INTERVAL;
function sleep(timeout, throwError) {
    if (throwError === void 0) { throwError = false; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    setTimeout(function () { return throwError ? reject() : resolve(); }, timeout);
                })];
        });
    });
}
exports.sleep = sleep;
/**
 * Fetch service configuration from the API.
 *
 * @private
 *
 * @param configUrl string
 * @param maxTries number
 * @param delay number
 * @param timeout number
 */
function fetchConfig(configUrl, userData, maxTries, delay, timeout) {
    if (maxTries === void 0) { maxTries = 30; }
    if (delay === void 0) { delay = 1000; }
    if (timeout === void 0) { timeout = 10000; }
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
                    return [4 /*yield*/, Promise.race([
                            fetch(configUrl, {
                                body: JSON.stringify({
                                    clientVersion: Constants_1.SDK_VERSION,
                                    token: userData
                                }),
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                method: 'POST'
                            }),
                            sleep(timeout, true)
                        ])];
                case 3:
                    data = _a.sent();
                    return [4 /*yield*/, data.json()];
                case 4:
                    config = _a.sent();
                    return [2 /*return*/, config];
                case 5:
                    err_1 = _a.sent();
                    error = err_1;
                    attemptCount += 1;
                    return [4 /*yield*/, sleep(delay)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 1];
                case 8:
                    if (error) {
                        throw error;
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.fetchConfig = fetchConfig;
// ====================================================================
/**
 * @description
 * Everything starts here.
 *
 * Connect to the API service.
 *
 * The `configUrl` value is provided to you as part of your SimpleWebRTC subscription.
 *
 * The `userData` value is a signed JWT, signed using the API secret provided to you as part of your SimpleWebRTC subscription.
 *
 * The data encoded in the `userData` JWT will be sent to the peers in any rooms joined. Likewise, `userData` from other peers will be made available in the `customerData` field of their peer objects. Uses for the `userData` JWT include providing an avatar URL or a custom username.
 *
 * The `userData` is _not_ used by SimpleWebRTC itself beyond making it available to you.
 *
 * @public
 *
 * @param configUrl The URL used to fetch the service configuration
 * @param userData A signed JWT containing the customer data you wish to have propragated to other peers
 */
function connect(configUrl, userData) {
    var _this = this;
    return function (dispatch, getState) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var config, err_2, signalingClient;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dispatch(connectionStateChanged('connecting'));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchConfig(configUrl, userData)];
                case 2:
                    config = _a.sent();
                    dispatch(receivedConfig(configUrl, config, userData));
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    dispatch(receivedConfigError(err_2));
                    dispatch(connectionStateChanged('failed'));
                    return [2 /*return*/];
                case 4:
                    signalingClient = new signaling_1.SignalingClient(dispatch, getState, {
                        jid: config.userId,
                        password: config.credential,
                        resource: config.id,
                        wsURL: config.signalingUrl
                    });
                    dispatch({
                        payload: signalingClient,
                        type: Constants_1.SIGNALING_CLIENT
                    });
                    signalingClient.connect();
                    return [2 /*return*/];
            }
        });
    }); };
}
exports.connect = connect;
/**
 * @description
 * Leaves all rooms and disconnects from the SimpleWebRTC service.
 *
 * @public
 */
function disconnect() {
    return function (dispatch, getState) {
        var signalingClient = Selectors_1.getClient(getState());
        if (signalingClient) {
            signalingClient.disconnect();
        }
        dispatch({
            type: Constants_1.SIGNALING_CLIENT_SHUTDOWN
        });
    };
}
exports.disconnect = disconnect;
/**
 * Service configuration fetched from the API.
 *
 * @private
 *
 * @param config APIConfig
 */
function receivedConfig(configUrl, config, userData) {
    return {
        payload: {
            config: config,
            configUrl: configUrl,
            token: userData
        },
        type: Constants_1.RECEIVED_CONFIG
    };
}
exports.receivedConfig = receivedConfig;
function receivedConfigError(err) {
    return {
        type: Constants_1.RECEIVED_CONFIG_ERROR
    };
}
exports.receivedConfigError = receivedConfigError;
/**
 * Queue a telemetry event to be sent in the next reporting batch.
 *
 * @private
 */
function queueTelemetry(eventType, _a) {
    var roomId = _a.roomId, peerId = _a.peerId, data = _a.data;
    return {
        payload: {
            data: JSON.stringify(data),
            peerId: peerId,
            roomId: roomId
        },
        type: Constants_1.QUEUE_TELEMETRY
    };
}
exports.queueTelemetry = queueTelemetry;
/**
 * Send queued telemetry events as a single batch.
 *
 * @private
 */
function sendQueuedTelemetry() {
    return function (dispatch, getState) {
        var state = getState();
        var config = Selectors_1.getAPIConfig(state);
        var telemetryUrl = config.telemetryUrl;
        var queuedTelemetry = Selectors_1.getQueuedTelemetry(state);
        var batchSize = Math.min(queuedTelemetry.length, 10);
        if (batchSize === 0) {
            return;
        }
        var batch = queuedTelemetry.slice(0, batchSize);
        if (!telemetryUrl) {
            return;
        }
        var payload = {
            body: JSON.stringify({
                batch: batch
            }),
            headers: {
                authorization: "Bearer " + config.credential
            },
            method: 'POST'
        };
        fetch(telemetryUrl, payload).then(function () {
            dispatch(telemetrySucess(batchSize));
        });
    };
}
exports.sendQueuedTelemetry = sendQueuedTelemetry;
/**
 * Report the number of successfully posted telemetry events.
 *
 * @private
 *
 * @param batchSize number
 */
function telemetrySucess(batchSize) {
    return {
        payload: batchSize,
        type: Constants_1.TELEMETRY_SUCCESS
    };
}
exports.telemetrySucess = telemetrySucess;
/**
 * Start the telemetry reporting interval timer.
 *
 * @private
 *
 * @param interval number
 */
function enableTelemetry(interval) {
    if (interval === void 0) { interval = 5000; }
    return function (dispatch) {
        disableTelemetry();
        REPORTING_INTERVAL = setInterval(function () {
            dispatch(sendQueuedTelemetry());
        }, interval);
    };
}
exports.enableTelemetry = enableTelemetry;
/**
 * Clear the telemetry reporting interval timer.
 *
 * @private
 */
function disableTelemetry() {
    clearInterval(REPORTING_INTERVAL);
}
exports.disableTelemetry = disableTelemetry;
/**
 * The connection state of the signaling client changed.
 *
 * @private
 *
 * @param connectionState string
 */
function connectionStateChanged(connectionState) {
    return {
        payload: connectionState,
        type: Constants_1.CONNECTION_STATE_CHANGE
    };
}
exports.connectionStateChanged = connectionStateChanged;
