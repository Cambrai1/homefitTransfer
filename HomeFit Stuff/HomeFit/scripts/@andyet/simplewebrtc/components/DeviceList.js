"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var react_redux_1 = require("react-redux");
var Actions = require("../actions");
var Selectors_1 = require("../Selectors");
/**
 * @description
 *
 * @public
 *
 */
var DeviceList = /** @class */ (function (_super) {
    tslib_1.__extends(DeviceList, _super);
    function DeviceList() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DeviceList.prototype.componentDidMount = function () {
        this.props.listenForDevices();
        this.props.fetchDevices();
    };
    DeviceList.prototype.render = function () {
        var renderProps = {
            audioInput: this.props.audioInput,
            audioOutput: this.props.audioOutput,
            cameraPermissionDenied: this.props.cameraPermissionDenied,
            cameraPermissionGranted: this.props.cameraPermissionGranted,
            devices: this.props.devices,
            hasAudioOutput: this.props.hasAudioOutput,
            hasCamera: this.props.hasCamera,
            hasMicrophone: this.props.hasMicrophone,
            microphonePermissionDenied: this.props.microphonePermissionDenied,
            microphonePermissionGranted: this.props.microphonePermissionGranted,
            requestingCameraCapture: this.props.requestingCameraCapture,
            requestingCapture: this.props.requestingCapture,
            requestingMicrophoneCapture: this.props.requestingMicrophoneCapture,
            videoInput: this.props.videoInput
        };
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        return render ? render(renderProps) : this.props.children;
    };
    return DeviceList;
}(React.Component));
function mapStateToProps(state, props) {
    var devices = Selectors_1.getDevices(state).filter(function (device) {
        return (!props.audioInput && !props.videoInput && !props.audioOutput) ||
            (device.kind === 'audioinput' && props.audioInput) ||
            (device.kind === 'videoinput' && props.videoInput) ||
            (device.kind === 'audiooutput' && props.audioOutput);
    });
    var permissions = Selectors_1.getDevicePermissions(state);
    return tslib_1.__assign({}, props, { devices: devices }, permissions);
}
function mapDispatchToProps(dispatch) {
    return {
        fetchDevices: function () { return dispatch(Actions.fetchDevices()); },
        listenForDevices: function () { return dispatch(Actions.listenForDevices()); }
    };
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(DeviceList);
