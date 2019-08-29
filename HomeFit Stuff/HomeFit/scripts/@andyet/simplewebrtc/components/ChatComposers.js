"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var PeerList_1 = require("./PeerList");
/**
 * @description
 *
 * @public
 *
 */
var ChatComposers = /** @class */ (function (_super) {
    tslib_1.__extends(ChatComposers, _super);
    function ChatComposers() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ChatComposers.prototype.render = function () {
        var _this = this;
        var renderProps = {
            composers: this.props.composers || []
        };
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        if (render) {
            return React.createElement(PeerList_1.default, { room: this.props.room, chatState: 'composing', render: function (_a) {
                    var peers = _a.peers;
                    return render({ composers: peers });
                } });
        }
        else if (this.props.children) {
            return React.createElement(PeerList_1.default, { room: this.props.room, chatState: 'composing' }, this.props.children);
        }
        return (React.createElement(PeerList_1.default, { room: this.props.room, chatState: 'composing', render: function (_a) {
                var peers = _a.peers;
                switch (peers.length) {
                    case 0:
                        return null;
                    case 1:
                        return (React.createElement("div", { className: _this.props.className }, peers[0].displayName + " is typing..."));
                    case 2:
                        return (React.createElement("div", { className: _this.props.className }, peers[0].displayName + " and " + renderProps.composers[1].displayName + " are typing..."));
                    default:
                        return (React.createElement("div", { className: _this.props.className }, "People are typing..."));
                }
            } }));
    };
    return ChatComposers;
}(React.Component));
exports.default = ChatComposers;
