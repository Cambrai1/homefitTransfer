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
var LocalMediaList = /** @class */ (function (_super) {
    tslib_1.__extends(LocalMediaList, _super);
    function LocalMediaList() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LocalMediaList.prototype.render = function () {
        var renderProps = {
            audio: this.props.audio,
            media: this.props.media || [],
            removeMedia: this.props.removeMedia,
            screen: this.props.screen,
            shareLocalMedia: this.props.shareLocalMedia,
            shared: this.props.shared,
            stopSharingLocalMedia: this.props.stopSharingLocalMedia,
            video: this.props.video
        };
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        return render ? render(renderProps) : this.props.children;
    };
    return LocalMediaList;
}(React.Component));
function mapStateToProps(state, props) {
    var desiredMedia;
    if (props.audio && !props.video) {
        desiredMedia = 'audio';
    }
    if (!props.audio && props.video) {
        desiredMedia = 'video';
    }
    var media = [];
    if (props.shared) {
        media = Selectors_1.getSharedMedia(state, desiredMedia);
    }
    else {
        media = Selectors_1.getLocalMedia(state, desiredMedia);
    }
    media = media.filter(function (m) {
        if (m.kind === 'video' && props.screen !== undefined) {
            return m.screenCapture === props.screen;
        }
        if (m.shared && props.shared === false) {
            return false;
        }
        return true;
    });
    return tslib_1.__assign({}, props, { media: media });
}
function mapDispatchToProps(dispatch) {
    return {
        removeMedia: function (id) { return dispatch(Actions.removeMedia(id)); },
        shareLocalMedia: function (id) { return dispatch(Actions.shareLocalMedia(id)); },
        stopSharingLocalMedia: function (id) { return dispatch(Actions.stopSharingLocalMedia(id)); }
    };
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(LocalMediaList);
