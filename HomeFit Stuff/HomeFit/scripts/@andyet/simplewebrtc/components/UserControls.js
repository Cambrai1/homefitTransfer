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
var UserControls = /** @class */ (function (_super) {
    tslib_1.__extends(UserControls, _super);
    function UserControls() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UserControls.prototype.render = function () {
        var renderProps = {
            customerData: this.props.customerData || {},
            deafen: this.props.deafen,
            isDeafened: this.props.isDeafened || false,
            isMuted: this.props.isMuted || false,
            isPaused: this.props.isPaused || false,
            mute: this.props.mute,
            pauseVideo: this.props.pauseVideo,
            resumeVideo: this.props.resumeVideo,
            setAudioOutputDevice: this.props.setAudioOutputDevice,
            setDisplayName: this.props.setDisplayName,
            setGlobalVolumeLimit: this.props.setGlobalVolumeLimit,
            setVoiceActivityThreshold: this.props.setVoiceActivityThreshold,
            undeafen: this.props.undeafen,
            unmute: this.props.unmute,
            user: this.props.user
        };
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        if (render) {
            return render(renderProps);
        }
        return this.props.children;
    };
    return UserControls;
}(React.Component));
exports.UserControls = UserControls;
function mapStateToProps(state, props) {
    var enabledAudioMedia = Selectors_1.getLocalMedia(state, 'audio').filter(function (audio) { return !audio.localDisabled; });
    var enabledVideoMedia = Selectors_1.getLocalMedia(state, 'video').filter(function (video) { return !video.localDisabled; });
    var customerData = Selectors_1.getUserCustomerData(state);
    var user = Selectors_1.getUser(state);
    var globalVolumeLimit = Selectors_1.getGlobalVolumeLimit(state);
    return {
        customerData: customerData,
        isDeafened: globalVolumeLimit === 0,
        isMuted: !enabledAudioMedia.length,
        isPaused: !enabledVideoMedia.length,
        user: user
    };
}
function mapDispatchToProps(dispatch, props) {
    return {
        deafen: function () { return dispatch(Actions.setGlobalVolumeLimit(0)); },
        mute: function () { return dispatch(Actions.muteSelf()); },
        pauseVideo: function () { return dispatch(Actions.pauseSelfVideo()); },
        resumeVideo: function () { return dispatch(Actions.resumeSelfVideo()); },
        setAudioOutputDevice: function (deviceId) { return dispatch(Actions.setAudioOutputDevice(deviceId)); },
        setDisplayName: function (name) { return dispatch(Actions.setDisplayName(name)); },
        setGlobalVolumeLimit: function (volumeLimit) { return dispatch(Actions.setGlobalVolumeLimit(volumeLimit)); },
        setVoiceActivityThreshold: function (threshold) { return dispatch(Actions.setVoiceActivityThreshold(threshold)); },
        undeafen: function () { return dispatch(Actions.setGlobalVolumeLimit(1)); },
        unmute: function () { return dispatch(Actions.unmuteSelf()); }
    };
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(UserControls);
