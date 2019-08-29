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
var PeerList = /** @class */ (function (_super) {
    tslib_1.__extends(PeerList, _super);
    function PeerList() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PeerList.prototype.render = function () {
        var renderProps = {
            chatState: this.props.chatState || undefined,
            joinedCall: this.props.joinedCall || false,
            peers: this.props.peers || [],
            speaking: this.props.speaking || false
        };
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        return render ? render(renderProps) : this.props.children;
    };
    return PeerList;
}(React.Component));
function mapStateToProps(state, props) {
    var filters = [
        'joinedCall',
        'speaking',
        'chatState',
        'requestingAttention'
    ];
    var peers = Selectors_1.getPeersForRoom(state, props.room).filter(function (peer) {
        var e_1, _a;
        try {
            for (var filters_1 = tslib_1.__values(filters), filters_1_1 = filters_1.next(); !filters_1_1.done; filters_1_1 = filters_1.next()) {
                var filter = filters_1_1.value;
                if (props[filter] !== undefined && peer[filter] !== props[filter]) {
                    return false;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (filters_1_1 && !filters_1_1.done && (_a = filters_1.return)) _a.call(filters_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return true;
    });
    return tslib_1.__assign({}, props, { peers: peers });
}
exports.default = react_redux_1.connect(mapStateToProps)(PeerList);
