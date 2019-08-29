"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
/**
 * @description
 * The volume meter component can be used to display the audio output volume of a track. Useful for showing that a user's microphone is live and sensitive enough to detect speech.
 *
 * @public
 *
 * @example
 * <VolumeMeter
 * media={getMediaTrack(store, 'some-media-id')}
 * render={({ volume, speaking }) => {
 *   // Render volume as a series of segments
 *
 *   const buckets = Math.abs(Math.max(volume / 10));
 *   let i = 0;
 *
 *   const segments = [];
 *   for (let i = 0; i < buckets; i++) {
 *       segments.push(<div key={i} className='volume-meter-segment' />);
 *   }
 *
 *   return (
 *     <div className={speaking ? 'volume-meter-speaking' : 'volume-meter-notspeaking'}>
 *       {segments}
 *     </div>
 *   );
 * }} />
 */
var VolumeMeter = /** @class */ (function (_super) {
    tslib_1.__extends(VolumeMeter, _super);
    function VolumeMeter(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            volume: -Infinity
        };
        _this.onVolume = function (volume) {
            _this.setState({
                volume: volume
            });
        };
        return _this;
    }
    VolumeMeter.prototype.componentDidMount = function () {
        if (!this.props.media || !this.props.media.hark) {
            return;
        }
        this.attachHark();
    };
    VolumeMeter.prototype.componentWillUnmount = function () {
        this.detachHark();
    };
    VolumeMeter.prototype.componentDidUpdate = function (prevProps) {
        if (prevProps.media !== this.props.media) {
            this.detachHark();
            this.attachHark();
        }
    };
    VolumeMeter.prototype.attachHark = function () {
        this.setState({
            volume: -Infinity
        });
        if (this.props.media) {
            this.hark = this.props.media.hark;
        }
        if (this.hark) {
            this.hark.on('volume', this.onVolume);
        }
    };
    VolumeMeter.prototype.detachHark = function () {
        if (this.hark) {
            this.hark.removeListener('volume', this.onVolume);
            this.hark = undefined;
        }
        this.setState({
            volume: -Infinity
        });
    };
    VolumeMeter.prototype.render = function () {
        var media = this.props.media;
        var noInputTimeout = this.props.noInputTimeout || 7000;
        var noInput = media && (media.externalDisabled ||
            !!media.inputLost && (Date.now() - media.inputLost > noInputTimeout));
        var renderProps = {
            loaded: media && !!media.loaded && !!media.inputDetected,
            media: media,
            muted: media && media.localDisabled,
            noInput: noInput,
            speaking: media && media.speaking,
            speakingWhileMuted: media && media.localDisabled && media.speaking,
            volume: media.externalDisabled ? -Infinity : this.state.volume
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
    return VolumeMeter;
}(React.Component));
exports.default = VolumeMeter;
