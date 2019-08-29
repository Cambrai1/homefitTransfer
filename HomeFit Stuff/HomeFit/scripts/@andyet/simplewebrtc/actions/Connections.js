"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Constants_1 = require("../Constants");
// ====================================================================
/**
 * Start tracking a peer connection.
 *
 * @private
 *
 * @param peerAddress string
 * @param sessionId string
 */
function addConnection(peerAddress, sessionId) {
    return {
        payload: {
            id: sessionId,
            peerAddress: peerAddress
        },
        type: Constants_1.PEER_CONNECTION_ADDED
    };
}
exports.addConnection = addConnection;
/**
 * Stop tracking a peer connection.
 *
 * @private
 *
 * @param peerAddress string
 * @param sessionId string
 */
function removeConnection(peerAddress, sessionId) {
    return {
        payload: {
            id: sessionId,
            peerAddress: peerAddress
        },
        type: Constants_1.PEER_CONNECTION_REMOVED
    };
}
exports.removeConnection = removeConnection;
/**
 * Update the state of a peer connection.
 *
 * @private
 *
 * @param peerAddress string
 * @param sessionId string
 * @param updated.connectionState string
 * @param updated.receivingAudioMediaId string
 * @param updated.receivingVideoMediaId string
 * @param updated.sendingAudioMediaId string
 * @param updated.sendingVideoMediaId string
 */
function updateConnection(peerAddress, sessionId, updated) {
    return {
        payload: {
            id: sessionId,
            peerAddress: peerAddress,
            updated: updated
        },
        type: Constants_1.PEER_CONNECTION_UPDATED
    };
}
exports.updateConnection = updateConnection;
