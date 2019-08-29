"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
/**
 * @description
 * Local and remote video tracks can be played with the `<Video/>` component.
 *
 * The provided `media` property can include `remoteDisabled` and `localDisabled` fields. If either of those properties are `true`, video playback will be paused.
 *
 * @public
 *
 * @example
 * <Video media={getMediaTrack(store, 'some-media-id')} />
 */
var Video = /** @class */ (function (_super) {
    tslib_1.__extends(Video, _super);
    function Video() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Video.prototype.componentDidMount = function () {
        this.setup();
    };
    Video.prototype.componentDidUpdate = function (prev) {
        this.setup();
    };
    Video.prototype.setup = function () {
        if (!this.props.media || !this.video) {
            return;
        }
        this.video.oncontextmenu = function (e) {
            e.preventDefault();
        };
        this.video.muted = true;
        this.video.autoplay = true;
        if (this.video.srcObject !== this.props.media.stream) {
            this.video.srcObject = this.props.media.stream;
        }
    };
    Video.prototype.render = function () {
        var _this = this;
        if (!this.props.media || !this.props.media.loaded) {
            return null;
        }
        return (React.createElement("video", { ref: function (el) { _this.video = el; }, style: this.props.media && this.props.media.renderMirrored ? {
                transform: 'scaleX(-1)'
            } : {}, playsInline: true }));
    };
    return Video;
}(React.Component));
exports.default = Video;
