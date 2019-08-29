"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UUID = require("uuid");
var Constants_1 = require("../Constants");
var Selectors_1 = require("../Selectors");
// ====================================================================
/**
 * @description
 * Send a chat message to a room.
 *
 * @public
 *
 * @param roomAddress The address of the room to send the chat
 * @param opts See ChatOptions below
 */
function sendChat(roomAddress, opts) {
    return function (dispatch, getState) {
        var state = getState();
        var client = Selectors_1.getClient(state);
        var id = opts.id || UUID.v4();
        var displayName = opts.displayName || Selectors_1.getUserDisplayName(state);
        client.xmpp.sendMessage({
            body: opts.body,
            chatState: 'active',
            id: id,
            nick: displayName,
            replace: opts.replace,
            to: roomAddress,
            type: 'groupchat'
        });
        dispatch({
            payload: {
                acked: false,
                body: opts.body,
                direction: Constants_1.DIRECTION_OUTGOING,
                displayName: displayName,
                id: id,
                replace: opts.replace,
                roomAddress: roomAddress,
                time: new Date()
            },
            type: Constants_1.CHAT_OUTGOING
        });
    };
}
exports.sendChat = sendChat;
/**
 * @description
 * Send a chat state (typing) notification to a room.
 *
 * @public
 *
 * @param roomAddress The address of the room to send the chat state
 * @param chatState The state of the chat
 */
function sendChatState(roomAddress, chatState) {
    return function (dispatch, getState) {
        var client = Selectors_1.getClient(getState());
        client.xmpp.sendMessage({
            chatState: chatState,
            to: roomAddress,
            type: 'groupchat'
        });
        dispatch({
            payload: {
                chatState: chatState,
                roomAddress: roomAddress
            },
            type: Constants_1.CHAT_STATE_OUTGOING
        });
    };
}
exports.sendChatState = sendChatState;
/**
 * Receive a chat message from a room.
 *
 * @private
 *
 * @param roomAddress string
 * @param senderAddress string
 * @param opts.body string
 * @param opts.displayName string
 * @param opts.id string
 * @param opts.replace string
 * @param opts.time Date
 */
function receiveChat(roomAddress, senderAddress, opts) {
    return {
        payload: {
            acked: true,
            body: opts.body,
            direction: Constants_1.DIRECTION_INCOMING,
            displayName: opts.displayName,
            id: opts.id,
            replace: opts.replace,
            roomAddress: roomAddress,
            senderAddress: senderAddress,
            time: opts.time || new Date(),
        },
        type: Constants_1.CHAT_INCOMING
    };
}
exports.receiveChat = receiveChat;
/**
 * @description
 * Send a realtime-text update to a room.
 *
 * @public
 *
 * @param roomAddress The address of the room to send the RTT update
 * @param rtt
 */
function sendRTT(roomAddress, rtt) {
    return function (dispatch, getState) {
        var client = Selectors_1.getClient(getState());
        var chatState;
        if (rtt.event !== 'init' && rtt.event !== 'cancel') {
            chatState = 'composing';
        }
        client.xmpp.sendMessage({
            chatState: chatState,
            rtt: rtt,
            to: roomAddress,
            type: 'groupchat'
        });
        dispatch({
            payload: {
                roomAddress: roomAddress,
                rtt: rtt
            },
            type: Constants_1.RTT_OUTGOING
        });
    };
}
exports.sendRTT = sendRTT;
