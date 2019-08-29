"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var react_redux_1 = require("react-redux");
var Selectors_1 = require("../Selectors");
/**
 * @description
 *
 * @public
 *
 */
var RemoteMediaList = /** @class */ (function (_super) {
    tslib_1.__extends(RemoteMediaList, _super);
    function RemoteMediaList() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RemoteMediaList.prototype.render = function () {
        var renderProps = {
            audio: this.props.audio,
            media: this.props.media || [],
            peer: this.props.peer,
            video: this.props.video
        };
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        return render ? render(renderProps) : this.props.children;
    };
    return RemoteMediaList;
}(React.Component));
function mapStateToProps(state, props) {
    var desiredMedia;
    if (props.audio && !props.video) {
        desiredMedia = 'audio';
    }
    else if (!props.audio && props.video) {
        desiredMedia = 'video';
    }
    var media = [];
    if (props.peer) {
        media = Selectors_1.getMediaForPeer(state, props.peer, desiredMedia);
    }
    else {
        media = Selectors_1.getRemoteMedia(state, desiredMedia);
    }
    return tslib_1.__assign({}, props, { media: media });
}
exports.default = react_redux_1.connect(mapStateToProps)(RemoteMediaList);
