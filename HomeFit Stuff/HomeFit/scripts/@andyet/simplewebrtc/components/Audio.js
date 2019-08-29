"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
/**
 * @description
 * Local and remote audio tracks can be played with the `<Audio/>` component.
 *
 * The provided `media` property can include `remoteDisabled` and `localDisabled` fields. If either of those properties are `true`, audio playback will be muted.
 *
 * @public
 *
 * @example
 * <Audio
 *  media={getMediaTrack(store, 'some-media-id')}
 *  volume={getGlobalVolumeLimit(store)}
 *  outputDevice={getAudioOutputDevice(store)}
 * />
 */
var Audio = /** @class */ (function (_super) {
    tslib_1.__extends(Audio, _super);
    function Audio() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Audio.prototype.componentDidMount = function () {
        this.setup();
    };
    Audio.prototype.componentDidUpdate = function (prev) {
        this.setup();
    };
    Audio.prototype.setup = function () {
        var _this = this;
        this.audio.oncontextmenu = function (e) {
            e.preventDefault();
        };
        if (this.audio.srcObject !== this.props.media.stream) {
            this.audio.srcObject = this.props.media.stream;
        }
        if (this.props.volume || this.props.volume === 0) {
            this.audio.volume = this.props.volume;
        }
        if (this.props.media.localDisabled || this.props.media.remoteDisabled || this.props.volume === 0) {
            this.audio.muted = true;
        }
        else {
            this.audio.muted = false;
        }
        if (this.props.outputDevice && this.audio.sinkId !== this.props.outputDevice && this.audio.setSinkId) {
            this.audio.pause();
            this.audio.setSinkId(this.props.outputDevice).then(function () {
                _this.audio.play();
            }).catch(function (err) {
                _this.audio.play();
                console.error(err);
            });
        }
        else {
            this.audio.autoplay = true;
        }
    };
    Audio.prototype.render = function () {
        var _this = this;
        return (React.createElement("audio", tslib_1.__assign({ ref: function (el) { _this.audio = el; } }, { playsInline: true })));
    };
    return Audio;
}(React.Component));
exports.default = Audio;
