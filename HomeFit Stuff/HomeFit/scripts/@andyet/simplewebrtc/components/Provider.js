"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var react_redux_1 = require("react-redux");
var Actions = require("../actions");
var Selectors_1 = require("../Selectors");
function mapStateToProps(state) {
    return {
        connectionState: Selectors_1.getConnectionState(state),
        isSupportedBrowser: Selectors_1.isSupportedBrowser(state),
        localMedia: Selectors_1.getLocalMedia(state)
    };
}
function mapDispatchToProps(dispatch, props) {
    return {
        connect: function () { return dispatch(Actions.connect(props.configUrl, props.userData)); },
        disconnect: function () { return dispatch(Actions.disconnect()); },
        removeAllMedia: function () { return dispatch(Actions.removeAllMedia()); }
    };
}
/**
 * @description
 *
 * @public
 *
 */
var Provider = /** @class */ (function (_super) {
    tslib_1.__extends(Provider, _super);
    function Provider() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Provider.prototype.componentDidMount = function () {
        var _this = this;
        this.props.connect();
        window.addEventListener('online', function () {
            // Trigger reconnection attempt with up to 5 seconds of jitter
            setTimeout(function () {
                if (_this.props.connectionState !== 'connected' && _this.props.connectionState !== 'connecting') {
                    _this.props.disconnect();
                    _this.props.connect();
                }
            }, Math.random() * 5000);
        });
        window.addEventListener('offline', function () {
            // Trigger disconnected state without waiting for websocket connection to timeout
            setTimeout(function () {
                if (!navigator.onLine) {
                    _this.props.disconnect();
                }
            }, 5000);
        });
    };
    Provider.prototype.componentWillUnmount = function () {
        this.props.removeAllMedia();
        this.props.disconnect();
    };
    Provider.prototype.render = function () {
        var renderProps = {
            connectionState: this.props.connectionState
        };
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        return render ? render(renderProps) : this.props.children;
    };
    return Provider;
}(React.Component));
function createConnectionStateComponent(connectionState) {
    return react_redux_1.connect(mapStateToProps)(/** @class */ (function (_super) {
        tslib_1.__extends(class_1, _super);
        function class_1() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_1.prototype.render = function () {
            var renderProps = {
                connectionState: this.props.connectionState
            };
            var render = this.props.render;
            if (!render && typeof this.props.children === 'function') {
                render = this.props.children;
            }
            if (this.props.connectionState === connectionState) {
                return render ? render(renderProps) : this.props.children;
            }
            return null;
        };
        return class_1;
    }(React.Component)));
}
/**
 * @description
 *
 * @public
 * @example
 * <NotSupported>
 *   <p>This browser does not support WebRTC media features.</p>
 * </NotSupported>
 */
exports.NotSupported = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(/** @class */ (function (_super) {
    tslib_1.__extends(class_2, _super);
    function class_2() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    class_2.prototype.render = function () {
        if (!this.props.isSupportedBrowser) {
            return this.props.children;
        }
        return null;
    };
    return class_2;
}(React.Component)));
/**
 * @description
 *
 * @public
 * @example
 * <NotConnected>
 *   <p>The client is not connected. It might be connecting or disconnected.</p>
 * </NotConnected>
 */
exports.NotConnected = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(/** @class */ (function (_super) {
    tslib_1.__extends(class_3, _super);
    function class_3() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    class_3.prototype.render = function () {
        var renderProps = {
            connectionState: this.props.connectionState
        };
        var render = this.props.render;
        if (!render && typeof this.props.children === 'function') {
            render = this.props.children;
        }
        if (this.props.connectionState !== 'connected') {
            return render ? render(renderProps) : this.props.children;
        }
        return null;
    };
    return class_3;
}(React.Component)));
/**
 * @description
 * The `<Connected />` component renders its children when the SimpleWebRTC client is connected and ready.
 * @public
 * @example
 * <Connecting>
 *   <p>The client is connecting and not yet ready.</p>
 * </Connecting>
 */
exports.Connecting = createConnectionStateComponent('connecting');
/**
 * @description
 * The `<Connecting />` component renders its children when the SimpleWebRTC client is starting and attempting to connect to the service.
 * @public
 * @example
 * <Connected>
 *   <p>The client is now ready.</p>
 * </Connected>
 */
exports.Connected = createConnectionStateComponent('connected');
/**
 * @description
 * The `<Disconnected />` component renders its children when the SimpleWebRTC client has lost connection with the service.
 * @public
 * @example
 * <Disconnected>
 *   <p>The client lost access to the signaling service.</p>
 * </Disconnected>
 */
exports.Disconnected = createConnectionStateComponent('disconnected');
/**
 * @description
 * The `<Failed />` component renders its children when the SimpleWebRTC client failed to receive its service configuration and can not continue.
 * @public
 * @example
 * <Failed>
 *   <p>There was an error initializing the client. The service might not be available.</p>
 * </Failed>
 */
exports.Failed = createConnectionStateComponent('failed');
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Provider);
