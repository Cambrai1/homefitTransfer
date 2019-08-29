"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var react_redux_1 = require("react-redux");
var Actions = require("../actions");
var Selectors_1 = require("../Selectors");
function mergeConstraints(defaults, provided, additional) {
    var disabled = (additional === false) || (!additional && !provided);
    if (disabled) {
        return false;
    }
    provided = (provided === true) ? {} : provided;
    additional = (additional === true) ? {} : additional;
    return tslib_1.__assign({}, defaults, provided, additional);
}
/**
 * @description
 * The `<RequestUserMedia />` component can be used to request user audio and video media.
 *
 * @public
 *
 * @example
 * <div>
 *   {/* Request audio and immediately share *\/}
 *   <RequestUserMedia audio auto share />
 *   {/* Request audio and video, but use custom renderer to trigger it *\/}
 *   <RequestUserMedia audio video share
 *    render={({ getUserMedia }) => (
 *    <button onClick={getUserMedia}>Get Media</button>
 *   )} />
 * </div>
 */
var RequestUserMedia = /** @class */ (function (_super) {
    tslib_1.__extends(RequestUserMedia, _super);
    function RequestUserMedia(props) {
        var _this = _super.call(this, props) || this;
        _this.errorCount = 0;
        return _this;
    }
    RequestUserMedia.prototype.getMedia = function (additional) {
        if (additional === void 0) { additional = {}; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var e_1, _a, stream, defaultAudioConstraints, supportedConstraints, _b, _c, constraint, audioConstraints, videoConstraints, err_1, audio, video, trackIds;
            var _this = this;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        defaultAudioConstraints = {};
                        supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
                        try {
                            for (_b = tslib_1.__values(['autoGainControl', 'echoCancellation', 'noiseSuppression']), _c = _b.next(); !_c.done; _c = _b.next()) {
                                constraint = _c.value;
                                if (supportedConstraints[constraint]) {
                                    defaultAudioConstraints[constraint] = true;
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
                        audioConstraints = mergeConstraints(defaultAudioConstraints, this.props.audio, additional.audio);
                        videoConstraints = mergeConstraints({}, this.props.video, additional.video);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 5, , 6]);
                        if (!navigator.mediaDevices) {
                            throw new Error('getUserMedia not supported');
                        }
                        this.props.deviceCaptureRequest(!!videoConstraints, !!audioConstraints);
                        if (!audioConstraints) return [3 /*break*/, 3];
                        // Multiple browser implementations only allow capturing one audio source at a time.
                        // As such, we stop all existing audio captures before requesting a new one.
                        return [4 /*yield*/, this.props.removeAllMedia('audio')];
                    case 2:
                        // Multiple browser implementations only allow capturing one audio source at a time.
                        // As such, we stop all existing audio captures before requesting a new one.
                        _d.sent();
                        _d.label = 3;
                    case 3: return [4 /*yield*/, navigator.mediaDevices.getUserMedia({
                            audio: audioConstraints,
                            video: videoConstraints
                        })];
                    case 4:
                        stream = _d.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_1 = _d.sent();
                        this.errorCount += 1;
                        if (err_1.name === 'AbortError' && this.errorCount < 12) {
                            // We still sometimes can't start new audio after recently ending previous
                            // audio. So we will try to attempt the request again a few times.
                            setTimeout(function () { return _this.getMedia(additional); }, 100 + Math.pow(2, this.errorCount));
                            return [2 /*return*/, {}];
                        }
                        if (err_1.name === 'NotAllowedError' || err_1.name === 'SecurityError') {
                            if (!!audioConstraints) {
                                this.props.microphonePermissionDenied();
                            }
                            if (!!videoConstraints) {
                                this.props.cameraPermissionDenied();
                            }
                        }
                        this.props.deviceCaptureRequest(false, false);
                        if (this.props.onError) {
                            this.props.onError(err_1);
                        }
                        return [2 /*return*/, {}];
                    case 6:
                        this.errorCount = 0;
                        audio = stream.getAudioTracks()[0];
                        video = stream.getVideoTracks()[0];
                        if (audio) {
                            this.props.addLocalAudio(audio, stream, this.props.replaceAudio);
                            if (this.props.share !== false) {
                                this.props.shareLocalMedia(audio.id);
                            }
                        }
                        else if (!!audioConstraints) {
                            this.props.microphonePermissionDenied();
                        }
                        if (video) {
                            if (this.props.screenCapture) {
                                this.props.addLocalScreen(video, stream, this.props.replaceVideo);
                            }
                            else {
                                this.props.addLocalVideo(video, stream, this.props.mirrored, this.props.replaceVideo);
                            }
                            if (this.props.share !== false) {
                                this.props.shareLocalMedia(video.id);
                            }
                        }
                        else if (!!videoConstraints) {
                            this.props.cameraPermissionDenied();
                        }
                        return [4 /*yield*/, this.props.fetchDevices()];
                    case 7:
                        _d.sent();
                        return [4 /*yield*/, this.props.deviceCaptureRequest(false, false)];
                    case 8:
                        _d.sent();
                        trackIds = {
                            audio: audio ? audio.id : undefined,
                            video: video ? video.id : undefined
                        };
                        if (this.props.onSuccess) {
                            this.props.onSuccess(trackIds);
                        }
                        return [2 /*return*/, trackIds];
                }
            });
        });
    };
    RequestUserMedia.prototype.componentDidMount = function () {
        if (this.props.auto) {
            this.getMedia();
        }
    };
    RequestUserMedia.prototype.componentDidUpdate = function (prevProps) {
        if (this.props.auto && this.props.auto !== prevProps.auto) {
            this.getMedia();
        }
    };
    RequestUserMedia.prototype.render = function () {
        var renderProps = this.getMedia.bind(this);
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        if (render) {
            return render(renderProps);
        }
        else if (this.props.children) {
            return this.props.children;
        }
        if (this.props.auto) {
            return null;
        }
        else {
            return (React.createElement("button", { onClick: renderProps }, "Request Media"));
        }
    };
    return RequestUserMedia;
}(React.Component));
exports.RequestUserMedia = RequestUserMedia;
function mapStateToProps(state, props) {
    var permissions = Selectors_1.getDevicePermissions(state);
    return tslib_1.__assign({}, props, { requestingCameraCapture: permissions.requestingCameraCapture, requestingCapture: permissions.requestingCapture, requestingMicrophoneCapture: permissions.requestingMicrophoneCapture });
}
function mapDispatchToProps(dispatch) {
    return {
        addLocalAudio: function (track, stream, replace) { return dispatch(Actions.addLocalAudio(track, stream, replace)); },
        addLocalScreen: function (track, stream, replace) { return dispatch(Actions.addLocalScreen(track, stream, replace)); },
        addLocalVideo: function (track, stream, mirrored, replace) { return dispatch(Actions.addLocalVideo(track, stream, mirrored, replace)); },
        cameraPermissionDenied: function (err) { return dispatch(Actions.cameraPermissionDenied(err)); },
        deviceCaptureRequest: function (camera, microphone) { return dispatch(Actions.deviceCaptureRequest(camera, microphone)); },
        fetchDevices: function () { return dispatch(Actions.fetchDevices()); },
        microphonePermissionDenied: function (err) { return dispatch(Actions.microphonePermissionDenied(err)); },
        removeAllMedia: function (kind) { return dispatch(Actions.removeAllMedia(kind)); },
        shareLocalMedia: function (id) { return dispatch(Actions.shareLocalMedia(id)); }
    };
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(RequestUserMedia);
