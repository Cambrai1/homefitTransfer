"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRole = {
    Initiator: 'initiator',
    Responder: 'responder'
};
exports.ApplicationDirection = {
    Inactive: 'inactive',
    Receive: 'recvonly',
    Send: 'sendonly',
    SendReceive: 'sendrecv'
};
exports.ContentSenders = {
    Both: 'both',
    Initiator: 'initiator',
    None: 'none',
    Responder: 'responder'
};
function sendersToDirection(role, senders = 'both') {
    const isInitiator = role === exports.SessionRole.Initiator;
    switch (senders) {
        case exports.ContentSenders.Initiator:
            return isInitiator ? exports.ApplicationDirection.Send : exports.ApplicationDirection.Receive;
        case exports.ContentSenders.Responder:
            return isInitiator ? exports.ApplicationDirection.Receive : exports.ApplicationDirection.Send;
        case exports.ContentSenders.Both:
            return exports.ApplicationDirection.SendReceive;
    }
    return exports.ApplicationDirection.Inactive;
}
exports.sendersToDirection = sendersToDirection;
function directionToSenders(role, direction = 'sendrecv') {
    const isInitiator = role === exports.SessionRole.Initiator;
    switch (direction) {
        case exports.ApplicationDirection.Send:
            return isInitiator ? exports.ContentSenders.Initiator : exports.ContentSenders.Responder;
        case exports.ApplicationDirection.Receive:
            return isInitiator ? exports.ContentSenders.Responder : exports.ContentSenders.Initiator;
        case exports.ApplicationDirection.SendReceive:
            return exports.ContentSenders.Both;
    }
    return exports.ContentSenders.None;
}
exports.directionToSenders = directionToSenders;
