"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var react_redux_1 = require("react-redux");
var Selectors_1 = require("../Selectors");
var StayDownContainer_1 = require("./StayDownContainer");
var ChatListGroup = /** @class */ (function (_super) {
    tslib_1.__extends(ChatListGroup, _super);
    function ChatListGroup() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ChatListGroup.prototype.render = function () {
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        if (render) {
            return render(this.props);
        }
        if (this.props.children) {
            return this.props.children;
        }
        return (React.createElement("div", null,
            React.createElement("span", null, this.props.displayName),
            this.props.chats.map(function (chat) { return (React.createElement("div", null, chat.body)); })));
    };
    return ChatListGroup;
}(React.Component));
/**
 * @description
 *
 * @public
 *
 */
var ChatList = /** @class */ (function (_super) {
    tslib_1.__extends(ChatList, _super);
    function ChatList() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ChatList.prototype.render = function () {
        var _this = this;
        var groups = this.props.groups || [];
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        if (render) {
            return render({ groups: groups });
        }
        if (this.props.children) {
            return this.props.children;
        }
        return (React.createElement(StayDownContainer_1.default, { id: this.props.id, className: this.props.className }, groups.map(function (group) {
            if (_this.props.renderGroup) {
                return _this.props.renderGroup(group);
            }
            else {
                return (React.createElement(ChatListGroup, tslib_1.__assign({}, group)));
            }
        })));
    };
    return ChatList;
}(React.Component));
function mapStateToProps(state, props) {
    if (!props.room) {
        return tslib_1.__assign({}, props, { groups: [] });
    }
    return tslib_1.__assign({}, props, { groups: Selectors_1.getGroupedChatsForRoom(state, props.room, props.maxGroupDuration) || [] });
}
exports.default = react_redux_1.connect(mapStateToProps)(ChatList);
