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
var Room = /** @class */ (function (_super) {
    tslib_1.__extends(Room, _super);
    function Room() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Room.prototype.componentDidMount = function () {
        if (this.props.connectionState === 'connected') {
            this.props.join();
        }
    };
    Room.prototype.componentWillUnmount = function () {
        this.props.leave(this.props.roomAddress);
    };
    Room.prototype.componentDidUpdate = function (prevProps) {
        if (this.props.connectionState !== 'connected') {
            return;
        }
        if (this.props.connectionState !== prevProps.connectionState) {
            this.props.join();
            return;
        }
        if (!this.props.room) {
            return;
        }
        if (this.props.password !== prevProps.password) {
            if (this.props.room.roomState === 'joined') {
                if (this.props.password) {
                    this.props.lock(this.props.roomAddress, this.props.password);
                }
                else {
                    this.props.unlock(this.props.roomAddress);
                }
            }
            else {
                this.props.join();
            }
        }
    };
    Room.prototype.render = function () {
        var renderProps = {
            call: this.props.call || {},
            joined: this.props.room ? this.props.room.joined : false,
            localMedia: this.props.localMedia || [],
            peers: this.props.peers || [],
            remoteMedia: this.props.remoteMedia || [],
            room: this.props.room || {}
        };
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        return render ? render(renderProps) : this.props.children;
    };
    return Room;
}(React.Component));
function mapStateToProps(state, props) {
    var room;
    if (props.roomAddress) {
        room = Selectors_1.getRoomByAddress(state, props.roomAddress);
    }
    else if (props.name) {
        room = Selectors_1.getRoomByProvidedName(state, props.name);
    }
    return {
        call: room ? Selectors_1.getCallForRoom(state, room.address) : undefined,
        connectionState: Selectors_1.getConnectionState(state),
        localMedia: Selectors_1.getLocalMedia(state),
        peers: room ? Selectors_1.getPeersForRoom(state, room.address) : [],
        remoteMedia: Selectors_1.getRemoteMedia(state),
        room: room,
        roomAddress: room ? room.address : undefined,
        roomState: room ? room.roomState : 'joining'
    };
}
function mapDispatchToProps(dispatch, props) {
    return {
        destroy: function (roomAddress) { return dispatch(Actions.destroyRoom(roomAddress)); },
        join: function () { return dispatch(Actions.joinRoom(props.name, { password: props.password || undefined })); },
        leave: function (roomAddress) { return dispatch(Actions.leaveRoom(roomAddress)); },
        lock: function (roomAddress, password) { return dispatch(Actions.lockRoom(roomAddress, password)); },
        unlock: function (roomAddress) { return dispatch(Actions.unlockRoom(roomAddress)); }
    };
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Room);
