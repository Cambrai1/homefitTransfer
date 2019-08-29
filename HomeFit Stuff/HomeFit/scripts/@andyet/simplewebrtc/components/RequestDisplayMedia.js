"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var react_redux_1 = require("react-redux");
var Actions = require("../actions");
var Selectors_1 = require("../Selectors");
var Screensharing = require("../lib/Screensharing");
/**
 * @description
 *
 * @public
 *
 */
var RequestDisplayMedia = /** @class */ (function (_super) {
    tslib_1.__extends(RequestDisplayMedia, _super);
    function RequestDisplayMedia(props) {
        var _this = _super.call(this, props) || this;
        _this.installCheckInterval = undefined;
        _this.state = {
            extensionInstalled: _this.props.extensionId ? Screensharing.checkForExtensionSync(_this.props.extensionId) : false,
            extensionInstalling: false,
            extensionRequired: Screensharing.requiresExtension()
        };
        return _this;
    }
    RequestDisplayMedia.prototype.componentDidMount = function () {
        var _this = this;
        if (Screensharing.requiresExtension() && this.props.extensionId) {
            Screensharing.checkForExtension(this.props.extensionId).then(function (extensionInstalled) {
                _this.setState({
                    extensionInstalled: extensionInstalled
                });
            });
        }
    };
    RequestDisplayMedia.prototype.getDisplayMedia = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var stream, track, err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!navigator.mediaDevices.getDisplayMedia) {
                            throw new Error('getDisplayMedia not supported');
                        }
                        return [4 /*yield*/, navigator.mediaDevices.getDisplayMedia({ video: true })];
                    case 1:
                        stream = _a.sent();
                        track = stream.getVideoTracks()[0];
                        this.props.addLocalScreen(track, stream);
                        if (this.props.share !== false) {
                            this.props.shareLocalScreen(track.id);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        console.log(err_1, err_1.message, err_1.name);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RequestDisplayMedia.prototype.listenForInstallation = function (interval) {
        if (interval === void 0) { interval = 2000; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                if (this.installCheckInterval) {
                    clearInterval(this.installCheckInterval);
                    this.installCheckInterval = undefined;
                }
                this.setState({
                    extensionInstalling: true
                });
                this.installCheckInterval = setInterval(function () {
                    if (!_this.props.extensionId || _this.state.extensionInstalled) {
                        clearInterval(_this.installCheckInterval);
                        _this.installCheckInterval = undefined;
                        return;
                    }
                    Screensharing.checkForExtension(_this.props.extensionId).then(function (extensionInstalled) {
                        _this.setState({
                            extensionInstalled: extensionInstalled,
                            extensionInstalling: !extensionInstalled
                        });
                    });
                }, interval);
                return [2 /*return*/];
            });
        });
    };
    RequestDisplayMedia.prototype.render = function () {
        var _this = this;
        if (this.props.render) {
            var available = Screensharing.isAvailable();
            var ready = available &&
                (!this.state.extensionRequired ||
                    (this.state.extensionRequired && this.state.extensionInstalled));
            return this.props.render(this.getDisplayMedia.bind(this), {
                available: available,
                extensionId: this.props.extensionId,
                extensionInstalled: this.state.extensionInstalled,
                extensionInstalling: this.state.extensionInstalling,
                extensionRequired: this.state.extensionRequired,
                listenForInstallation: this.listenForInstallation.bind(this),
                ready: ready
            });
        }
        return (React.createElement("button", { onClick: function () { return _this.getDisplayMedia(); } }, "Start Screenshare"));
    };
    return RequestDisplayMedia;
}(React.Component));
exports.RequestDisplayMedia = RequestDisplayMedia;
function mapStateToProps(state, ownProps) {
    var config = Selectors_1.getAPIConfig(state);
    return {
        extensionId: ownProps.extensionId || config.screensharingExtensions.chrome
    };
}
function mapDispatchToProps(dispatch) {
    return {
        addLocalScreen: function (track, stream) { return dispatch(Actions.addLocalScreen(track, stream)); },
        shareLocalScreen: function (id) { return dispatch(Actions.shareLocalMedia(id)); }
    };
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(RequestDisplayMedia);
