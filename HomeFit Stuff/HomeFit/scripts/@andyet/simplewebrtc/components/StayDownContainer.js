"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var StayDown = require("staydown");
/**
 * @description
 *  The `<StayDownContainer/>` component forces its view to stay pinned to the bottom of its scrollable area, unless the user scrolls away from the bottom.
 *
 * It's especially suited for chat UIs so that new messages are displayed at the bottom but still kept visible unless the user has scrolled back to read past messages.
 *
 * @public
 *
 */
var StayDownContainer = /** @class */ (function (_super) {
    tslib_1.__extends(StayDownContainer, _super);
    function StayDownContainer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    StayDownContainer.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", tslib_1.__assign({}, this.props, { ref: function (el) {
                if (!el) {
                    return;
                }
                var staydown = new StayDown({ target: el, stickyHeight: 30 });
                if (_this.staydown) {
                    staydown.intend_down = _this.staydown.intend_down;
                    staydown.userScroll = _this.staydown.userScroll;
                }
                _this.staydown = staydown;
                _this.staydown.checkdown();
            } })));
    };
    return StayDownContainer;
}(React.Component));
exports.default = StayDownContainer;
