"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var react_redux_1 = require("react-redux");
var Actions = require("../actions");
/**
 * @description
 *
 * @public
 *
 */
var MediaControls = /** @class */ (function (_super) {
    tslib_1.__extends(MediaControls, _super);
    function MediaControls() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MediaControls.prototype.render = function () {
        var _this = this;
        var renderProps = {
            disable: this.props.disableMedia,
            enable: this.props.enableMedia,
            isEnabled: !this.props.media.localDisabled && !this.props.media.remoteDisabled,
            isShared: this.props.media.source === 'local' && !!this.props.media.shared,
            media: this.props.media,
            remove: this.props.removeLocalMedia,
            share: this.props.shareLocalMedia,
            stopSharing: function () {
                _this.props.stopSharingLocalMedia();
                if (_this.props.autoRemove) {
                    _this.props.removeLocalMedia();
                    _this.props.media.track.stop();
                }
            }
        };
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        return render ? render(renderProps) : this.props.children;
    };
    return MediaControls;
}(React.Component));
exports.MediaControls = MediaControls;
function mapStateToProps(state) {
    return {};
}
function mapDispatchToProps(dispatch, props) {
    return {
        disableMedia: function () { return dispatch(Actions.disableMedia(props.media.id)); },
        enableMedia: function () { return dispatch(Actions.enableMedia(props.media.id)); },
        removeLocalMedia: function () { return dispatch(Actions.removeMedia(props.media.id)); },
        shareLocalMedia: function () { return dispatch(Actions.shareLocalMedia(props.media.id)); },
        stopSharingLocalMedia: function () { return dispatch(Actions.stopSharingLocalMedia(props.media.id)); }
    };
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(MediaControls);
