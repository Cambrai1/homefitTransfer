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
var PeerControls = /** @class */ (function (_super) {
    tslib_1.__extends(PeerControls, _super);
    function PeerControls() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PeerControls.prototype.render = function () {
        var renderProps = {
            hasActiveMicrophone: this.props.hasActiveMicrophone,
            isMuted: this.props.isMuted,
            isSpeaking: this.props.isSpeaking,
            kick: this.props.kick,
            mute: this.props.mute,
            peer: this.props.peer,
            setVolumeLimit: this.props.setVolumeLimit,
            unmute: this.props.unmute
        };
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        return render ? render(renderProps) : this.props.children;
    };
    return PeerControls;
}(React.Component));
exports.PeerControls = PeerControls;
function mapStateToProps(state, props) {
    var peer = Selectors_1.getPeerByAddress(state, props.peer.address);
    var media = Selectors_1.getMediaForPeer(state, props.peer.address, 'audio');
    var anyRemoteEnabled = media.filter(function (audio) { return !audio.remoteDisabled; }).length > 0;
    return {
        hasActiveMicrophone: anyRemoteEnabled,
        isMuted: peer.muted || false,
        isSpeaking: peer.speaking || false
    };
}
function mapDispatchToProps(dispatch, props) {
    return {
        kick: function () { return dispatch(Actions.kickPeer(props.peer.roomAddress, props.peer.address)); },
        mute: function () { return dispatch(Actions.mutePeer(props.peer.address)); },
        setVolumeLimit: function (volume) { return dispatch(Actions.limitPeerVolume(props.peer.address, volume)); },
        unmute: function () { return dispatch(Actions.unmutePeer(props.peer.address)); },
    };
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(PeerControls);
