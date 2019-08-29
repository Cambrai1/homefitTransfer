"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var Hark_1 = require("../lib/Hark");
var Selectors_1 = require("../Selectors");
function createHarker(id, stream, dispatch) {
    var hark = new Hark_1.default(stream);
    hark.on('stopped-receiving-volume', function (inputLost) {
        dispatch(updateMedia(id, {
            inputLost: inputLost
        }));
    });
    hark.on('started-receiving-volume', function () {
        dispatch(updateMedia(id, {
            inputDetected: true,
            inputLost: undefined
        }));
    });
    hark.on('speaking', function () {
        dispatch(updateMedia(id, {
            speaking: true
        }));
    });
    hark.on('stopped-speaking', function () {
        dispatch(updateMedia(id, {
            lastSpokeAt: new Date(Date.now()),
            speaking: false
        }));
    });
    return hark;
}
// ====================================================================
/**
 * Add a local media track.
 *
 * @private
 *
 * @param track
 * @param stream
 * @param replaces
 */
function addLocalMedia(media) {
    return function (dispatch, getState) {
        var newReplaces = media.replaces;
        if (media.replaces) {
            var state = getState();
            var prevMedia = Selectors_1.getMediaTrack(state, media.replaces);
            if (prevMedia) {
                if (!prevMedia.shared) {
                    dispatch(removeMedia(prevMedia.id));
                    newReplaces = prevMedia.replaces;
                }
            }
        }
        media.track.onmute = function () {
            dispatch(updateMedia(media.id, {
                externalDisabled: true
            }));
        };
        media.track.onunmute = function () {
            dispatch(updateMedia(media.id, {
                externalDisabled: false
            }));
        };
        dispatch({
            payload: tslib_1.__assign({}, media, { replaces: newReplaces }),
            type: Constants_1.ADD_MEDIA
        });
    };
}
exports.addLocalMedia = addLocalMedia;
/**
 * @description
 * Adds a local audio track to the set of managed media.
 *
 * **NOTE:** Adding a local audio track does not immediately share the audio to peers. Use `shareLocalMedia()` with the track ID to do so after adding.
 *
 * @public
 *
 * @param track Local audio track
 * @param stream Stream containing the audio track
 * @param replaces
 */
function addLocalAudio(track, stream, replaces) {
    if (track.kind !== 'audio') {
        throw new Error('Incorrect media type. Expected audio, got: ' + track.kind);
    }
    return function (dispatch, getState) {
        var audio = track.clone();
        var utilityStream = new MediaStream();
        utilityStream.addTrack(audio);
        var hark = createHarker(track.id, utilityStream, dispatch);
        track.onended = function () {
            hark.stop();
            audio.stop();
            dispatch(stopSharingLocalMedia(track.id));
            dispatch(removeMedia(track.id));
        };
        var player = document.createElement('audio');
        var onLoaded = function () {
            if (player) {
                player.pause();
                player.removeEventListener('oncanplay', onLoaded);
                player.srcObject = null;
                player = undefined;
                dispatch(updateMedia(track.id, {
                    loaded: true
                }));
            }
        };
        player.muted = true;
        player.autoplay = true;
        player.oncanplay = onLoaded;
        player.srcObject = stream;
        dispatch(addLocalMedia({
            createdAt: Date.now(),
            externalDisabled: track.muted,
            hark: hark,
            id: track.id,
            inputDetected: false,
            inputLost: Date.now(),
            kind: 'audio',
            localDisabled: !track.enabled,
            remoteDisabled: false,
            renderMirrored: false,
            replaces: replaces,
            screenCapture: false,
            shared: false,
            source: 'local',
            speaking: false,
            stream: stream,
            track: track,
            utilityStream: utilityStream,
            volume: -Infinity
        }));
    };
}
exports.addLocalAudio = addLocalAudio;
/**
 * @description
 * Adds a local video track to the set of managed media.
 *
 * **NOTE:** Adding a local video track does not immediately share the video to peers. Use `shareLocalMedia()` with the track ID to do so after adding.
 *
 * @public
 *
 * @param track Local video track
 * @param stream Stream containing the video track
 * @param replaces
 */
function addLocalVideo(track, stream, mirror, replaces) {
    if (mirror === void 0) { mirror = true; }
    if (track.kind !== 'video') {
        throw new Error('Incorrect media type. Expected video, got: ' + track.kind);
    }
    return function (dispatch, getState) {
        track.onended = function () {
            dispatch(stopSharingLocalMedia(track.id));
            dispatch(removeMedia(track.id));
        };
        var player = document.createElement('video');
        var onLoaded = function () {
            if (player) {
                var height = player.videoHeight;
                var width = player.videoWidth;
                player.pause();
                player.removeEventListener('oncanplay', onLoaded);
                player.srcObject = null;
                player = undefined;
                dispatch(updateMedia(track.id, {
                    height: height,
                    loaded: true,
                    width: width
                }));
            }
        };
        player.setAttribute('playsinline', 'playsinline');
        player.muted = true;
        player.autoplay = true;
        player.oncanplay = onLoaded;
        player.srcObject = stream;
        dispatch(addLocalMedia({
            createdAt: Date.now(),
            externalDisabled: track.muted,
            id: track.id,
            kind: 'video',
            localDisabled: !track.enabled,
            remoteDisabled: false,
            renderMirrored: mirror,
            replaces: replaces,
            screenCapture: false,
            shared: false,
            source: 'local',
            speaking: false,
            stream: stream,
            track: track,
            volume: -Infinity
        }));
    };
}
exports.addLocalVideo = addLocalVideo;
/**
 * @description
 * Adds a local screenshare video track to the set of managed media.
 *
 * This action is similar to `addLocalVideo()`, but marks the video as a screen so it does not render mirrored like a user facing camera video.
 *
 * **NOTE:** Adding a local screenshare video track does not immediately share the video to peers. Use `shareLocalMedia()` with the track ID to do so after adding.
 *
 * @public
 *
 * @param track Local screenshare video track
 * @param stream Stream containing the video track
 * @param replaces
 */
function addLocalScreen(track, stream, replaces) {
    if (track.kind !== 'video') {
        throw new Error('Incorrect media type. Expected video, got: ' + track.kind);
    }
    return function (dispatch, getState) {
        track.onended = function () {
            dispatch(stopSharingLocalMedia(track.id));
            dispatch(removeMedia(track.id));
        };
        var player = document.createElement('video');
        var onLoaded = function () {
            if (player) {
                var height = player.videoHeight;
                var width = player.videoWidth;
                player.pause();
                player.removeEventListener('oncanplay', onLoaded);
                player.srcObject = null;
                player = undefined;
                dispatch(updateMedia(track.id, {
                    height: height,
                    loaded: true,
                    width: width
                }));
            }
        };
        player.muted = true;
        player.autoplay = true;
        player.oncanplay = onLoaded;
        player.srcObject = stream;
        // Mark the track as detail content to encourage the browser to
        // prioritize image quality over frame rate.
        if ('contentHint' in track) {
            track.contentHint = 'detail';
        }
        dispatch(addLocalMedia({
            createdAt: Date.now(),
            externalDisabled: track.muted,
            id: track.id,
            kind: 'video',
            localDisabled: !track.enabled,
            remoteDisabled: false,
            renderMirrored: false,
            replaces: replaces,
            screenCapture: true,
            shared: false,
            source: 'local',
            speaking: false,
            stream: stream,
            track: track,
            volume: -Infinity
        }));
    };
}
exports.addLocalScreen = addLocalScreen;
/**
 * Add a remote media track.
 *
 * @private
 *
 * @param track MediaStreamTrack
 * @param stream MediaStream
 * @param screen boolean
 */
function addRemoteMedia(roomAddress, peerAddress, track, stream, screen) {
    return function (dispatch, getState) {
        var state = getState();
        var owner = Selectors_1.getPeerByAddress(state, peerAddress);
        track.onended = function () {
            dispatch(removeMedia(track.id));
        };
        var waitForLoaded = function () {
            if (track.kind === 'video') {
                var player_1 = document.createElement('video');
                var onLoaded_1 = function () {
                    if (player_1) {
                        var height = player_1.videoHeight;
                        var width = player_1.videoWidth;
                        player_1.pause();
                        player_1.removeEventListener('oncanplay', onLoaded_1);
                        player_1.srcObject = null;
                        player_1 = undefined;
                        dispatch(updateMedia(track.id, {
                            height: height,
                            loaded: true,
                            width: width
                        }));
                    }
                };
                player_1.muted = true;
                player_1.autoplay = true;
                player_1.oncanplay = onLoaded_1;
                player_1.srcObject = stream;
                setTimeout(onLoaded_1, 500);
            }
            if (track.kind === 'audio') {
                var player_2 = document.createElement('audio');
                var onLoaded_2 = function () {
                    if (player_2) {
                        player_2.pause();
                        player_2.removeEventListener('oncanplay', onLoaded_2);
                        player_2.srcObject = null;
                        player_2 = undefined;
                        dispatch(updateMedia(track.id, {
                            loaded: true
                        }));
                    }
                };
                player_2.muted = true;
                player_2.autoplay = true;
                player_2.oncanplay = onLoaded_2;
                player_2.srcObject = stream;
            }
        };
        waitForLoaded();
        setTimeout(waitForLoaded, 500);
        var media = {
            createdAt: Date.now(),
            externalDisabled: track.muted,
            id: track.id,
            kind: track.kind,
            localDisabled: owner ? owner.muted : false,
            owner: peerAddress,
            remoteDisabled: false,
            renderMirrored: false,
            roomAddress: roomAddress,
            screenCapture: track.kind === 'video' && screen,
            source: 'remote',
            speaking: false,
            stream: stream,
            track: track,
            volume: -Infinity
        };
        dispatch({
            payload: media,
            type: Constants_1.ADD_MEDIA
        });
    };
}
exports.addRemoteMedia = addRemoteMedia;
/**
 * @description
 * Remove media.
 *
 * @public
 *
 * @param id Media track ID
 * @param endMedia Whether to end the media track
 */
function removeMedia(id, endMedia) {
    if (endMedia === void 0) { endMedia = true; }
    return function (dispatch, getState) {
        var e_1, _a;
        var media = Selectors_1.getMediaTrack(getState(), id);
        if (!media) {
            return;
        }
        if (media.shared) {
            dispatch(stopSharingLocalMedia(id));
        }
        dispatch({
            payload: { id: id },
            type: Constants_1.REMOVE_MEDIA
        });
        if (endMedia) {
            if (media.track) {
                media.track.stop();
            }
            if (media.utilityStream) {
                try {
                    for (var _b = tslib_1.__values(media.utilityStream.getTracks()), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var track = _c.value;
                        track.stop();
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
        }
    };
}
exports.removeMedia = removeMedia;
/**
 * Update a media track.
 *
 * @private
 *
 * @param id string
 * @param updated Partial<Media>
 */
function updateMedia(id, updated) {
    return function (dispatch, getState) {
        var prevState = getState();
        var client = Selectors_1.getClient(prevState);
        var wasSpeaking = Selectors_1.userIsSpeaking(prevState);
        dispatch({
            payload: {
                id: id,
                updated: updated
            },
            type: Constants_1.MEDIA_UPDATED
        });
        var newState = getState();
        var nowSpeaking = Selectors_1.userIsSpeaking(newState);
        if (client) {
            if (wasSpeaking !== nowSpeaking) {
                client.sendAllCallsSpeakingUpdate(nowSpeaking);
            }
            if (updated.shared !== undefined) {
                client.mesh.updateConnections();
            }
        }
        var oldMedia = Selectors_1.getMediaTrack(prevState, id);
        var newMedia = Selectors_1.getMediaTrack(newState, id);
        if (newMedia) {
            newMedia.track.enabled = !newMedia.localDisabled;
            if (oldMedia && newMedia.source === 'local' && newMedia.localDisabled !== oldMedia.localDisabled && client) {
                client.mesh.notifyPeers(newMedia, newMedia.localDisabled === true ? 'mute' : 'unmute');
            }
            if (newMedia.source === 'remote' && newMedia.owner) {
                var peer = Selectors_1.getPeerByAddress(newState, newMedia.owner);
                if (peer && peer.muted && !newMedia.localDisabled) {
                    dispatch({
                        payload: {
                            peerAddress: newMedia.owner,
                            updated: {
                                muted: false
                            }
                        },
                        type: Constants_1.PEER_UPDATED
                    });
                }
            }
        }
    };
}
exports.updateMedia = updateMedia;
/**
 * @description
 * Enable local playback of local or remote media.
 *
 * @public
 *
 * @param id Media track ID
 */
function enableMedia(id) {
    return updateMedia(id, {
        localDisabled: false
    });
}
exports.enableMedia = enableMedia;
/**
 * @description
 * Disable local playback of local or remote media.
 *
 * If the media has already been shared, it will continue to be shared, but will be silent or show a black frame.
 *
 * @public
 *
 * @param id A local media track ID
 */
function disableMedia(id) {
    return updateMedia(id, {
        localDisabled: true
    });
}
exports.disableMedia = disableMedia;
/**
 * @description
 * Share a local media track with interested peers.
 *
 * @public
 *
 * @param id The ID of the media track to start sharing
 */
function shareLocalMedia(id) {
    return function (dispatch, getState) {
        var state = getState();
        var media = Selectors_1.getMediaTrack(state, id);
        if (!media) {
            return;
        }
        if (media.replaces) {
            dispatch(removeMedia(media.replaces));
        }
        dispatch(updateMedia(id, {
            replaces: undefined,
            shared: true
        }));
    };
}
exports.shareLocalMedia = shareLocalMedia;
/**
 * @description
 * Stop sending a media track to peers, but the media track will still exist and be tracked so that it can be re-shared later. Use `removeMedia()` to fully stop and remove a track.
 *
 * @public
 *
 * @param id The ID of the media track to stop sharing
 */
function stopSharingLocalMedia(id) {
    return function (dispatch, getState) {
        var state = getState();
        var potentialReplacements = Selectors_1.getLocalMedia(state).filter(function (m) { return m.replaces === id; });
        dispatch(updateMedia(id, {
            shared: false
        }));
        if (potentialReplacements.length) {
            dispatch(removeMedia(id));
        }
    };
}
exports.stopSharingLocalMedia = stopSharingLocalMedia;
/**
 * @description
 * Adjust the capture resolution for local videos.
 *
 * Screen captures are _not_ affected.
 *
 * The values provided should be the _ideal_ values. The browser will attempt to adjust capture parameters to match as closely as possible, but in some cases may not exactly match what was requested.
 *
 * @public
 *
 * @param width The new, ideal, width for the video
 * @param height The new, ideal, height for the video
 * @param frameRate The new, ideal, frame rate for the video
 */
function adjustVideoCaptureResolution(width, height, frameRate) {
    if (frameRate === void 0) { frameRate = 30; }
    return function (dispatch, getState) {
        var e_2, _a;
        var state = getState();
        var localMedia = Selectors_1.getLocalMedia(state, 'video');
        var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
        var newConstraints = {};
        var enabledConstraint = false;
        if (supportedConstraints.frameRate) {
            newConstraints.frameRate = frameRate;
            enabledConstraint = true;
        }
        if (supportedConstraints.height) {
            newConstraints.height = { ideal: height };
            enabledConstraint = true;
        }
        if (supportedConstraints.width) {
            newConstraints.width = { ideal: width };
            enabledConstraint = true;
        }
        if (!enabledConstraint) {
            return;
        }
        try {
            for (var localMedia_1 = tslib_1.__values(localMedia), localMedia_1_1 = localMedia_1.next(); !localMedia_1_1.done; localMedia_1_1 = localMedia_1.next()) {
                var video = localMedia_1_1.value;
                if (video.screenCapture) {
                    continue;
                }
                video.track.applyConstraints(newConstraints).catch(function (err) {
                    console.error('Could not adjust video capture resolution:', err.message);
                });
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (localMedia_1_1 && !localMedia_1_1.done && (_a = localMedia_1.return)) _a.call(localMedia_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
}
exports.adjustVideoCaptureResolution = adjustVideoCaptureResolution;
/**
 * @description
 * Mute all audio for a given peer.
 *
 * @public
 *
 * @param peerAddress The address of the peer to mute
 */
function mutePeer(peerAddress) {
    return function (dispatch, getState) {
        var e_3, _a;
        var state = getState();
        var media = Selectors_1.getMediaForPeer(state, peerAddress, 'audio');
        try {
            for (var media_1 = tslib_1.__values(media), media_1_1 = media_1.next(); !media_1_1.done; media_1_1 = media_1.next()) {
                var audio = media_1_1.value;
                dispatch(disableMedia(audio.id));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (media_1_1 && !media_1_1.done && (_a = media_1.return)) _a.call(media_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        dispatch({
            payload: {
                peerAddress: peerAddress,
                updated: {
                    muted: true
                }
            },
            type: Constants_1.PEER_UPDATED
        });
    };
}
exports.mutePeer = mutePeer;
/**
 * @description
 * Unmute all audio for a given peer.
 *
 * @public
 *
 * @param peerAddress The address of the peer to unmute
 */
function unmutePeer(peerAddress) {
    return function (dispatch, getState) {
        var e_4, _a;
        var state = getState();
        var media = Selectors_1.getMediaForPeer(state, peerAddress, 'audio');
        try {
            for (var media_2 = tslib_1.__values(media), media_2_1 = media_2.next(); !media_2_1.done; media_2_1 = media_2.next()) {
                var audio = media_2_1.value;
                dispatch(enableMedia(audio.id));
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (media_2_1 && !media_2_1.done && (_a = media_2.return)) _a.call(media_2);
            }
            finally { if (e_4) throw e_4.error; }
        }
        dispatch({
            payload: {
                peerAddress: peerAddress,
                updated: {
                    muted: false
                }
            },
            type: Constants_1.PEER_UPDATED
        });
    };
}
exports.unmutePeer = unmutePeer;
/**
 * @description
 * Disable all captured audio for the user.
 *
 * @public
 */
function muteSelf() {
    return function (dispatch, getState) {
        var e_5, _a;
        var state = getState();
        var media = Selectors_1.getLocalMedia(state, 'audio');
        try {
            for (var media_3 = tslib_1.__values(media), media_3_1 = media_3.next(); !media_3_1.done; media_3_1 = media_3.next()) {
                var audio = media_3_1.value;
                dispatch(disableMedia(audio.id));
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (media_3_1 && !media_3_1.done && (_a = media_3.return)) _a.call(media_3);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
}
exports.muteSelf = muteSelf;
/**
 * @description
 * Enable all captured audio for the user.
 *
 * @public
 */
function unmuteSelf() {
    return function (dispatch, getState) {
        var e_6, _a;
        var state = getState();
        var media = Selectors_1.getLocalMedia(state, 'audio');
        try {
            for (var media_4 = tslib_1.__values(media), media_4_1 = media_4.next(); !media_4_1.done; media_4_1 = media_4.next()) {
                var audio = media_4_1.value;
                dispatch(enableMedia(audio.id));
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (media_4_1 && !media_4_1.done && (_a = media_4.return)) _a.call(media_4);
            }
            finally { if (e_6) throw e_6.error; }
        }
    };
}
exports.unmuteSelf = unmuteSelf;
/**
 * @description
 * Disable all captured video for the user.
 *
 * @public
 */
function pauseSelfVideo() {
    return function (dispatch, getState) {
        var e_7, _a;
        var state = getState();
        var media = Selectors_1.getLocalMedia(state, 'video');
        try {
            for (var media_5 = tslib_1.__values(media), media_5_1 = media_5.next(); !media_5_1.done; media_5_1 = media_5.next()) {
                var video = media_5_1.value;
                dispatch(disableMedia(video.id));
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (media_5_1 && !media_5_1.done && (_a = media_5.return)) _a.call(media_5);
            }
            finally { if (e_7) throw e_7.error; }
        }
    };
}
exports.pauseSelfVideo = pauseSelfVideo;
/**
 * @description
 * Enable all captured video for the user.
 *
 * @public
 */
function resumeSelfVideo() {
    return function (dispatch, getState) {
        var e_8, _a;
        var state = getState();
        var media = Selectors_1.getLocalMedia(state, 'video');
        try {
            for (var media_6 = tslib_1.__values(media), media_6_1 = media_6.next(); !media_6_1.done; media_6_1 = media_6.next()) {
                var video = media_6_1.value;
                dispatch(enableMedia(video.id));
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (media_6_1 && !media_6_1.done && (_a = media_6.return)) _a.call(media_6);
            }
            finally { if (e_8) throw e_8.error; }
        }
    };
}
exports.resumeSelfVideo = resumeSelfVideo;
/**
 * @description
 * Remove all local media of a given kind.
 *
 * @public
 *
 * @param kind 'audio' | 'video' | undefined
 */
function removeAllMedia(kind) {
    return function (dispatch, getState) {
        var e_9, _a;
        var state = getState();
        var localMedia = Selectors_1.getLocalMedia(state, kind);
        try {
            for (var localMedia_2 = tslib_1.__values(localMedia), localMedia_2_1 = localMedia_2.next(); !localMedia_2_1.done; localMedia_2_1 = localMedia_2.next()) {
                var media = localMedia_2_1.value;
                dispatch(removeMedia(media.id));
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (localMedia_2_1 && !localMedia_2_1.done && (_a = localMedia_2.return)) _a.call(localMedia_2);
            }
            finally { if (e_9) throw e_9.error; }
        }
    };
}
exports.removeAllMedia = removeAllMedia;
