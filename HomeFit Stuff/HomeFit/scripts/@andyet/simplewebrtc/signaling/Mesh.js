"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Actions = require("../actions");
var Selectors = require("../Selectors");
function createIceServerConfig(server) {
    var host = server.host;
    if (host.indexOf(':') >= 0) {
        host = "[" + host + "]";
    }
    var uri = server.type + ":" + host;
    if (server.port) {
        uri += ":" + server.port;
    }
    if (server.transport) {
        uri += "?transport=" + server.transport;
    }
    if (server.type === 'turn' || server.type === 'turns') {
        return {
            credential: server.password,
            urls: [uri],
            username: server.username
        };
    }
    return { urls: [uri] };
}
var Mesh = /** @class */ (function () {
    function Mesh(client) {
        this.jingle = client.jingle;
        this.dispatch = client.dispatch;
        this.getState = client.getState;
        this.updateICEServers();
    }
    Mesh.prototype.updateICEServers = function () {
        var e_1, _a;
        this.jingle.resetICEServers();
        var config = Selectors.getAPIConfig(this.getState());
        try {
            for (var _b = tslib_1.__values(config.iceServers), _c = _b.next(); !_c.done; _c = _b.next()) {
                var server = _c.value;
                this.jingle.addICEServer(createIceServerConfig(server));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    Mesh.prototype.updateConnections = function () {
        var e_2, _a, e_3, _b, e_4, _c, e_5, _d, e_6, _e, e_7, _f, e_8, _g;
        if (!RTCPeerConnection) {
            return;
        }
        var state = this.getState();
        var videoPeersCount = Selectors.countPeersWantingVideo(state);
        var calls = Selectors.getJoinedCalls(state);
        var media = Selectors.getMedia(state);
        var sharedMedia = Selectors.getSharedMedia(state);
        var sharedVideoCount = sharedMedia.filter(function (m) { return m.kind === 'video'; }).length;
        if (videoPeersCount <= 1) {
            this.dispatch(Actions.adjustVideoCaptureResolution(800, 600));
        }
        if (videoPeersCount === 2) {
            this.dispatch(Actions.adjustVideoCaptureResolution(640, 480));
        }
        if (videoPeersCount >= 3) {
            this.dispatch(Actions.adjustVideoCaptureResolution(320, 240, videoPeersCount >= 5 ? 10 : 15));
        }
        // The total bandwidth we want to send depends on the number of outgoing
        // video tracks. It is specified in kilobits per second.
        var maximumBitrate = 1800000 / (videoPeersCount * sharedVideoCount);
        try {
            for (var calls_1 = tslib_1.__values(calls), calls_1_1 = calls_1.next(); !calls_1_1.done; calls_1_1 = calls_1.next()) {
                var call = calls_1_1.value;
                var peers = Selectors.getPeersForCall(state, call.roomAddress);
                try {
                    for (var peers_1 = tslib_1.__values(peers), peers_1_1 = peers_1.next(); !peers_1_1.done; peers_1_1 = peers_1.next()) {
                        var peer = peers_1_1.value;
                        var needsVideo = new Set();
                        var needsAudio = new Set();
                        var wantsVideo = peer.requestingMedia === 'video';
                        var wantsAudio = peer.requestingMedia === 'video' || peer.requestingMedia === 'audio';
                        var peerSharedMedia = new Map();
                        var overSharedSessions = new Set();
                        var connections = Selectors.getConnectionsForPeer(state, peer.address);
                        try {
                            for (var connections_1 = tslib_1.__values(connections), connections_1_1 = connections_1.next(); !connections_1_1.done; connections_1_1 = connections_1.next()) {
                                var conn = connections_1_1.value;
                                if (conn.sendingAudioMediaId) {
                                    peerSharedMedia.set(conn.sendingAudioMediaId, 'audio');
                                    if (!wantsAudio || !media[conn.sendingAudioMediaId] || !media[conn.sendingAudioMediaId].shared) {
                                        overSharedSessions.add(conn.id);
                                        if (conn.sendingVideoMediaId && wantsVideo) {
                                            needsVideo.add(conn.sendingVideoMediaId);
                                        }
                                    }
                                }
                                if (conn.sendingVideoMediaId) {
                                    var sess = this.jingle.sessions[conn.id];
                                    if (sess) {
                                        sess.setMaximumBitrate(maximumBitrate);
                                    }
                                    peerSharedMedia.set(conn.sendingVideoMediaId, 'video');
                                    var video = media[conn.sendingVideoMediaId];
                                    if ((!wantsVideo && !video.screenCapture) || !video || !video.shared) {
                                        overSharedSessions.add(conn.id);
                                        if (conn.sendingAudioMediaId && wantsAudio) {
                                            needsAudio.add(conn.sendingAudioMediaId);
                                        }
                                    }
                                }
                            }
                        }
                        catch (e_4_1) { e_4 = { error: e_4_1 }; }
                        finally {
                            try {
                                if (connections_1_1 && !connections_1_1.done && (_c = connections_1.return)) _c.call(connections_1);
                            }
                            finally { if (e_4) throw e_4.error; }
                        }
                        try {
                            for (var sharedMedia_1 = tslib_1.__values(sharedMedia), sharedMedia_1_1 = sharedMedia_1.next(); !sharedMedia_1_1.done; sharedMedia_1_1 = sharedMedia_1.next()) {
                                var track = sharedMedia_1_1.value;
                                if (!peerSharedMedia.has(track.id)) {
                                    if (track.kind === 'audio' && wantsAudio) {
                                        needsAudio.add(track.id);
                                    }
                                    if (track.kind === 'video' && wantsVideo) {
                                        needsVideo.add(track.id);
                                    }
                                    if (track.kind === 'video' && track.screenCapture && wantsAudio) {
                                        needsVideo.add(track.id);
                                    }
                                }
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (sharedMedia_1_1 && !sharedMedia_1_1.done && (_d = sharedMedia_1.return)) _d.call(sharedMedia_1);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                        try {
                            for (var overSharedSessions_1 = tslib_1.__values(overSharedSessions), overSharedSessions_1_1 = overSharedSessions_1.next(); !overSharedSessions_1_1.done; overSharedSessions_1_1 = overSharedSessions_1.next()) {
                                var sessionId = overSharedSessions_1_1.value;
                                var session = this.jingle.sessions[sessionId];
                                if (session) {
                                    session.end();
                                }
                            }
                        }
                        catch (e_6_1) { e_6 = { error: e_6_1 }; }
                        finally {
                            try {
                                if (overSharedSessions_1_1 && !overSharedSessions_1_1.done && (_e = overSharedSessions_1.return)) _e.call(overSharedSessions_1);
                            }
                            finally { if (e_6) throw e_6.error; }
                        }
                        var pairedTracks = new Map();
                        try {
                            for (var _h = tslib_1.__values(tslib_1.__spread(needsAudio, needsVideo)), _j = _h.next(); !_j.done; _j = _h.next()) {
                                var id = _j.value;
                                var track = media[id];
                                if (track) {
                                    var pair = pairedTracks.get(track.stream.id) || {};
                                    pair[track.kind] = track;
                                    pairedTracks.set(track.stream.id, pair);
                                }
                            }
                        }
                        catch (e_7_1) { e_7 = { error: e_7_1 }; }
                        finally {
                            try {
                                if (_j && !_j.done && (_f = _h.return)) _f.call(_h);
                            }
                            finally { if (e_7) throw e_7.error; }
                        }
                        var _loop_1 = function (pair) {
                            var session = this_1.jingle.createMediaSession(peer.address);
                            if (pair.audio) {
                                session.addTrack(pair.audio.track, pair.audio.stream);
                                this_1.dispatch(Actions.updateConnection(peer.address, session.sid, {
                                    sendingAudioMediaId: pair.audio.id
                                }));
                            }
                            if (pair.video) {
                                session.addTrack(pair.video.track, pair.video.stream);
                                this_1.dispatch(Actions.updateConnection(peer.address, session.sid, {
                                    sendingVideoMediaId: pair.video.id
                                }));
                            }
                            session.start({
                                offerToReceiveAudio: false,
                                offerToReceiveVideo: false
                            }, function () {
                                if (pair.video) {
                                    session.setMaximumBitrate(maximumBitrate);
                                }
                                if (pair.audio && pair.audio.localDisabled) {
                                    session.mute(session.role, 'audio');
                                }
                                if (pair.video && pair.video.localDisabled) {
                                    session.mute(session.role, 'video');
                                }
                                if (pair.video && pair.video.screenCapture) {
                                    session.send('description-info', {
                                        contents: [
                                            {
                                                application: {
                                                    applicationType: 'rtp',
                                                    screenCaptures: [
                                                        { id: pair.video.id }
                                                    ]
                                                },
                                                name: 'video'
                                            }
                                        ]
                                    });
                                }
                            });
                        };
                        var this_1 = this;
                        try {
                            for (var _k = tslib_1.__values(pairedTracks.values()), _l = _k.next(); !_l.done; _l = _k.next()) {
                                var pair = _l.value;
                                _loop_1(pair);
                            }
                        }
                        catch (e_8_1) { e_8 = { error: e_8_1 }; }
                        finally {
                            try {
                                if (_l && !_l.done && (_g = _k.return)) _g.call(_k);
                            }
                            finally { if (e_8) throw e_8.error; }
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (peers_1_1 && !peers_1_1.done && (_b = peers_1.return)) _b.call(peers_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (calls_1_1 && !calls_1_1.done && (_a = calls_1.return)) _a.call(calls_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    Mesh.prototype.plugin = function () {
        var _this = this;
        return function () {
            _this.jingle.on('incoming', function (session) {
                var state = _this.getState();
                var call = Selectors.getCallForRoom(state, session.peerID.split('/')[0]);
                if (call && call.joined) {
                    session.accept();
                }
                else {
                    session.end();
                }
                session.onDescriptionInfo = function (changes, cb) {
                    var e_9, _a, e_10, _b;
                    try {
                        for (var _c = tslib_1.__values(changes.contents || []), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var content = _d.value;
                            if (content.application && content.application.screenCaptures) {
                                try {
                                    for (var _e = tslib_1.__values(content.application.screenCaptures), _f = _e.next(); !_f.done; _f = _e.next()) {
                                        var screen_1 = _f.value;
                                        _this.dispatch(Actions.updateMedia(screen_1.id, {
                                            screenCapture: true
                                        }));
                                    }
                                }
                                catch (e_10_1) { e_10 = { error: e_10_1 }; }
                                finally {
                                    try {
                                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                                    }
                                    finally { if (e_10) throw e_10.error; }
                                }
                            }
                        }
                    }
                    catch (e_9_1) { e_9 = { error: e_9_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                        }
                        finally { if (e_9) throw e_9.error; }
                    }
                    cb();
                };
            });
            _this.jingle.on('terminated', function (session) {
                _this.dispatch(Actions.removeConnection(session.peerID, session.sid));
                // Probably terminated session because the peer is gone. Give the rest of
                // the system a chance to update before attempting to restart connections.
                setTimeout(function () {
                    _this.updateConnections();
                }, 200);
            });
            _this.jingle.on('createdSession', function (session) {
                _this.dispatch(Actions.addConnection(session.peerID, session.sid));
                session.on('peerTrackAdded', function (_, track, stream) {
                    _this.dispatch(Actions.addRemoteMedia(session.peerID.split('/')[0], session.peerID, track, stream, false));
                    if (track.kind === 'audio') {
                        _this.dispatch(Actions.updateConnection(session.peerID, session.sid, {
                            receivingAudioMediaId: track.id
                        }));
                    }
                    if (track.kind === 'video') {
                        _this.dispatch(Actions.updateConnection(session.peerID, session.sid, {
                            receivingVideoMediaId: track.id
                        }));
                    }
                });
                session.on('peerTrackRemoved', function (_, track) {
                    _this.dispatch(Actions.removeMedia(track.id));
                });
                session.on('connectionState', function () {
                    _this.dispatch(Actions.updateConnection(session.peerID, session.sid, {
                        connectionState: session.connectionState
                    }));
                    if (session.connectionState === 'failed' || session.connectionState === 'disconnected') {
                        session.end();
                    }
                });
            });
            _this.jingle.on('mute', function (session, info) {
                var state = _this.getState();
                var connections = Selectors.getConnections(state);
                if (info.name === 'audio') {
                    _this.dispatch(Actions.updateMedia(connections[session.sid].receivingAudioMediaId, { remoteDisabled: true }));
                }
                else if (info.name === 'video') {
                    _this.dispatch(Actions.updateMedia(connections[session.sid].receivingVideoMediaId, { remoteDisabled: true }));
                }
                else {
                    throw new Error('Invalid mute property');
                }
            });
            _this.jingle.on('unmute', function (session, info) {
                var state = _this.getState();
                var connections = Selectors.getConnections(state);
                if (info.name === 'audio') {
                    _this.dispatch(Actions.updateMedia(connections[session.sid].receivingAudioMediaId, { remoteDisabled: false }));
                }
                else if (info.name === 'video') {
                    _this.dispatch(Actions.updateMedia(connections[session.sid].receivingVideoMediaId, { remoteDisabled: false }));
                }
                else {
                    throw new Error('Invalid mute property');
                }
            });
        };
    };
    Mesh.prototype.notifyPeers = function (media, action) {
        var state = this.getState();
        var connections = Selectors.getConnections(state);
        Object.values(Selectors.getClient(state).jingle.sessions).forEach(function (session) {
            var conn = connections[session.sid];
            if (conn && (conn.sendingAudioMediaId === media.id || conn.sendingVideoMediaId === media.id)) {
                session[action](session.role, media.kind);
            }
        });
    };
    return Mesh;
}());
exports.default = Mesh;
