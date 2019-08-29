"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var react_redux_1 = require("react-redux");
var RTT = require("realtime-text");
var Actions = require("../actions");
/**
 * @description
 *
 * @public
 *
 */
var ChatInput = /** @class */ (function (_super) {
    tslib_1.__extends(ChatInput, _super);
    function ChatInput(props) {
        var _this = _super.call(this, props) || this;
        _this.rttBuffer = new RTT.InputBuffer();
        _this.state = {
            chatState: 'active',
            message: ''
        };
        return _this;
    }
    ChatInput.prototype.componentDidUpdate = function (prev) {
        if (!prev.rtt && this.props.rtt) {
            this.props.onRtt(this.rttBuffer.start());
            this.rttBuffer.update(this.state.message);
        }
        if (prev.rtt && !this.props.rtt) {
            this.props.onRtt(this.rttBuffer.stop());
            clearInterval(this.rttInterval);
            this.rttInterval = null;
        }
    };
    ChatInput.prototype.startSendingRtt = function () {
        if (!this.rttInterval && this.props.rtt) {
            this.rttInterval = setInterval(this.rttSend.bind(this), 700);
            setTimeout(this.rttSend.bind(this), 100);
        }
    };
    ChatInput.prototype.rttUpdate = function (data) {
        if (data === void 0) { data = ''; }
        this.rttBuffer.update(data);
        this.startSendingRtt();
    };
    ChatInput.prototype.rttSend = function () {
        if (!this.props.rtt) {
            return;
        }
        var diff = this.rttBuffer.diff();
        if (diff) {
            this.props.onRtt(diff);
        }
    };
    ChatInput.prototype.commitMessage = function () {
        if (this.props.disabled || this.state.message.length === 0) {
            return;
        }
        clearTimeout(this.pausedTimeout);
        this.pausedTimeout = null;
        clearInterval(this.rttInterval);
        this.rttInterval = null;
        var message = this.state.message;
        this.setState({ message: '', chatState: 'active' });
        this.rttBuffer.commit();
        if (this.props.onChat) {
            this.props.onChat({
                body: message
            });
        }
    };
    ChatInput.prototype.updateChatState = function (chatState) {
        var _this = this;
        if (this.pausedTimeout) {
            clearTimeout(this.pausedTimeout);
        }
        if (chatState === 'composing') {
            this.pausedTimeout = setTimeout(function () {
                _this.updateChatState('paused');
            }, 10000);
        }
        else {
            this.pausedTimeout = null;
        }
        if (chatState !== this.state.chatState) {
            if (this.props.onChatState) {
                this.props.onChatState(chatState);
            }
        }
        this.setState({
            chatState: chatState
        });
    };
    ChatInput.prototype.render = function () {
        var _this = this;
        return (React.createElement("textarea", { id: this.props.id, value: this.state.message, placeholder: this.props.placeholder, disabled: this.props.disabled, onInput: function (event) {
                var value = event.target.value;
                _this.rttUpdate(value);
                if (value !== '') {
                    _this.updateChatState('composing');
                }
                if (_this.state.message !== '' && value === '') {
                    _this.updateChatState('active');
                }
                _this.setState({
                    message: value
                });
            }, onKeyPress: function (event) {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    _this.commitMessage();
                }
            } }));
    };
    return ChatInput;
}(React.Component));
function mapStateToProps(state, props) {
    return props;
}
function mapDispatchToProps(dispatch, props) {
    return {
        onChat: function (opts) { return dispatch(Actions.sendChat(props.room, opts)); },
        onChatState: function (state) { return dispatch(Actions.sendChatState(props.room, state)); },
        onRtt: function (data) { return dispatch(Actions.sendRTT(props.room, data)); }
    };
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(ChatInput);
