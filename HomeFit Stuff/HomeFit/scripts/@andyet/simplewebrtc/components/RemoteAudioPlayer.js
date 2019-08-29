"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var react_redux_1 = require("react-redux");
var Selectors_1 = require("../Selectors");
var Audio_1 = require("./Audio");
/**
 * @description
 * The remote audio player component will play all enabled remote audio tracks. Only one instance needs to be used.
 *
 * @public
 *
 * @example
 * <div>
 *   {/* We can always keep the audio player around *\/}
 *   <RemoteAudioPlayer />
 *   <Connected>
 *     <p>Main app UI</p>
 *   </Connected>
 * </div>
 */
var RemoteAudioPlayer = /** @class */ (function (_super) {
    tslib_1.__extends(RemoteAudioPlayer, _super);
    function RemoteAudioPlayer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RemoteAudioPlayer.prototype.render = function () {
        var _this = this;
        var sources = this.props.audioSources || [];
        var globalVolumeLimit = this.props.globalVolumeLimit;
        return (React.createElement(React.Fragment, null, sources.map(function (audio) { return (React.createElement(Audio_1.default, { key: audio.media.id, media: audio.media, volume: globalVolumeLimit * audio.volumeLimit, outputDevice: _this.props.outputDevice })); })));
    };
    return RemoteAudioPlayer;
}(React.Component));
exports.RemoteAudioPlayer = RemoteAudioPlayer;
function mapStateToProps(state, props) {
    var e_1, _a;
    var media = Selectors_1.getRemoteMedia(state, 'audio');
    var audioSources = [];
    try {
        for (var media_1 = tslib_1.__values(media), media_1_1 = media_1.next(); !media_1_1.done; media_1_1 = media_1.next()) {
            var audio = media_1_1.value;
            var peer = Selectors_1.getPeerByAddress(state, audio.owner);
            audioSources.push({
                media: audio,
                volumeLimit: (peer ? peer.volumeLimit : 1) || 1
            });
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (media_1_1 && !media_1_1.done && (_a = media_1.return)) _a.call(media_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return {
        audioSources: audioSources,
        globalVolumeLimit: Selectors_1.getGlobalVolumeLimit(state),
        outputDevice: Selectors_1.getAudioOutputDevice(state)
    };
}
exports.default = react_redux_1.connect(mapStateToProps)(RemoteAudioPlayer);
