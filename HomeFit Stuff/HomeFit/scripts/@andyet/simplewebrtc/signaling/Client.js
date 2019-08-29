"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("webrtc-adapter");
var realtime_text_1 = require("realtime-text");
var Stanza = require("stanza");
var Actions = require("../actions");
var Selectors = require("../Selectors");
var Mesh_1 = require("./Mesh");
var MMUC_1 = require("./MMUC");
var SignalingClient = /** @class */ (function () {
    function SignalingClient(dispatch, getState, opts) {
        var _this = this;
        this.logToConsole = localStorage.logxmpp || false;
        this.terminating = false;
        this.dispatch = dispatch;
        this.getState = getState;
        this.rttBuffers = new Map();
        this.xmpp = Stanza.createClient(tslib_1.__assign({ transport: 'websocket' }, opts));
        this.xmpp.useStreamManagement = false;
        this.xmpp.sm.allowResume = false;
        this.jingle = this.xmpp.jingle;
        this.xmpp.use(MMUC_1.default);
        this.mesh = new Mesh_1.default(this);
        this.xmpp.use(this.mesh.plugin());
        this.xmpp.on('raw:*', function (event, data) {
            if (_this.logToConsole) {
                console.log(event, data);
            }
        });
        this.xmpp.on('session:started', function () {
            _this.xmpp.sendPresence();
            _this.xmpp.enableKeepAlive({
                interval: 90
            });
            _this.dispatch(Actions.connectionStateChanged('connected'));
        });
        this.xmpp.on('disconnected', function () {
            if (_this.terminating) {
                return;
            }
            _this.dispatch(Actions.connectionStateChanged('disconnected'));
            setTimeout(function () {
                var state = _this.getState();
                var configUrl = Selectors.getConfigURL(state);
                var userData = Selectors.getUserToken(state);
                _this.dispatch(Actions.connect(configUrl, userData));
            }, 1000 + Math.random() * 2000);
        });
        this.xmpp.on('muc:join', function (pres) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var roomAddress, state, room;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        roomAddress = pres.from.bare;
                        state = this.getState();
                        room = Selectors.getRoomByAddress(state, roomAddress);
                        if (!room) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.checkLockStatus(roomAddress, room.providedPassword)];
                    case 1:
                        _a.sent();
                        this.dispatch(Actions.joinRoomSuccess(roomAddress, pres.from.full, pres.talkyUserInfo.roomId, pres.muc.role, pres.muc.affiliation));
                        room = Selectors.getRoomByAddress(state, roomAddress);
                        if (room && room.autoJoinCall) {
                            this.dispatch(Actions.joinCall(roomAddress, Selectors.getDesiredMediaTypes(state, roomAddress)));
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        this.xmpp.on('muc:failed', function (pres) {
            var roomAddress = pres.from.bare;
            var room = Selectors.getRoomByAddress(_this.getState(), roomAddress);
            if (room && room.providedPassword && !room.passwordRequired) {
                _this.joinRoom(roomAddress, undefined, room.autoJoinCall);
            }
            else {
                _this.dispatch(Actions.joinRoomFailed(roomAddress, pres.error.condition === 'not-authorized'));
            }
        });
        this.xmpp.on('muc:error', function (pres) {
            _this.dispatch(Actions.joinRoomFailed(pres.from.bare, pres.error.condition === 'not-authorized'));
        });
        this.xmpp.on('muc:available', function (pres) {
            var roomAddress = pres.from.bare;
            var peerAddress = pres.from.full;
            var state = _this.getState();
            var room = Selectors.getRoomByAddress(state, roomAddress);
            if (!room) {
                return;
            }
            if (pres.muc.codes && pres.muc.codes.indexOf('110') >= 0) {
                _this.dispatch(Actions.selfUpdated(roomAddress, peerAddress, room.id, pres.muc.role, pres.muc.affiliation));
                return;
            }
            if (!_this.rttBuffers.has(peerAddress)) {
                var buffer = new realtime_text_1.DisplayBuffer(function (_a) {
                    var text = _a.text;
                    _this.dispatch(Actions.peerUpdated(peerAddress, {
                        rtt: text
                    }));
                });
                _this.rttBuffers.set(peerAddress, buffer);
            }
            var customerData = pres.talkyUserInfo.customerData || {};
            _this.dispatch(Actions.peerOnline(roomAddress, peerAddress, {
                affiliation: pres.muc.affiliation,
                customerData: customerData,
                displayName: customerData.displayName || pres.nick,
                id: pres.talkyUserInfo.sessionId,
                joinedCall: !!pres.mmuc,
                requestingMedia: (pres.mmuc || {}).media,
                role: pres.muc.role
            }));
        });
        this.xmpp.on('muc:unavailable', function (pres) {
            if (pres.muc.codes && pres.muc.codes.indexOf('110') >= 0) {
                _this.dispatch(Actions.leaveRoom(pres.from.bare));
                return;
            }
            _this.rttBuffers.delete(pres.from.full);
            _this.dispatch(Actions.peerOffline(pres.from.bare, pres.from.full));
        });
        this.xmpp.on('muc:destroyed', function (pres) {
            _this.dispatch(Actions.leaveRoom(pres.from.bare));
        });
        this.xmpp.on('chat:state', function (msg) {
            _this.dispatch(Actions.peerUpdated(msg.from.full, {
                chatState: msg.chatState
            }));
        });
        this.xmpp.on('attention', function (msg) {
            _this.dispatch(Actions.peerUpdated(msg.from.full, {
                requestingAttention: true
            }));
            setTimeout(function () {
                _this.dispatch(Actions.peerUpdated(msg.from.full, {
                    requestingAttention: false
                }));
            }, 5000);
        });
        this.xmpp.on('message', function (msg) {
            if (msg.type !== 'groupchat') {
                return;
            }
            if (msg.rtt) {
                var buffer = _this.rttBuffers.get(msg.from.full);
                if (buffer) {
                    buffer.process(msg.rtt);
                }
            }
            if (msg.body) {
                var buffer = _this.rttBuffers.get(msg.from.full);
                if (buffer) {
                    buffer.commit();
                }
                _this.dispatch(Actions.receiveChat(msg.from.bare, msg.from.full, {
                    body: msg.body,
                    displayName: msg.nick,
                    id: msg.id,
                    replace: msg.replace,
                    time: msg.delay ? msg.delay.stamp : new Date(),
                }));
            }
        });
        this.xmpp.on('message', function (msg) { return _this.processMessage(msg); });
    }
    SignalingClient.prototype.connect = function () {
        this.xmpp.connect();
    };
    SignalingClient.prototype.disconnect = function () {
        this.terminating = true;
        this.dispatch(Actions.connectionStateChanged('disconnected'));
        this.xmpp.disconnect();
    };
    SignalingClient.prototype.joinRoom = function (roomAddress, password, autoJoinCall) {
        var state = this.getState();
        var config = Selectors.getAPIConfig(state);
        var displayName = Selectors.getUserDisplayName(state);
        var opts = {
            joinMuc: {
                password: password
            },
            nick: displayName
        };
        this.xmpp.joinRoom(roomAddress, config.id, opts);
        if (autoJoinCall !== false) {
            this.dispatch(Actions.joinCall(roomAddress, Selectors.getDesiredMediaTypes(state, roomAddress)));
        }
    };
    SignalingClient.prototype.destroyRoom = function (roomAddress) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.xmpp.destroyRoom(roomAddress)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SignalingClient.prototype.sendRoomPresence = function (roomAddress, opts) {
        if (opts === void 0) { opts = {}; }
        var state = this.getState();
        var displayName = Selectors.getUserDisplayName(state);
        var room = Selectors.getRoomByAddress(state, roomAddress);
        var call = Selectors.getCallForRoom(state, roomAddress);
        var media = Selectors.getDesiredMediaTypes(state, roomAddress);
        if (!room || !room.joined) {
            return;
        }
        this.xmpp.sendPresence(tslib_1.__assign({ mmuc: call && call.joined ? {
                media: media
            } : undefined, nick: displayName || true, to: roomAddress }, opts));
    };
    SignalingClient.prototype.sendAllRoomsPresence = function (opts) {
        var e_1, _a;
        if (opts === void 0) { opts = {}; }
        var state = this.getState();
        var rooms = Object.keys(Selectors.getRooms(state));
        try {
            for (var rooms_1 = tslib_1.__values(rooms), rooms_1_1 = rooms_1.next(); !rooms_1_1.done; rooms_1_1 = rooms_1.next()) {
                var roomAddress = rooms_1_1.value;
                this.sendRoomPresence(roomAddress, opts);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (rooms_1_1 && !rooms_1_1.done && (_a = rooms_1.return)) _a.call(rooms_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    SignalingClient.prototype.sendAllCallsSpeakingUpdate = function (speaking) {
        var e_2, _a;
        var state = this.getState();
        var calls = Selectors.getJoinedCalls(state);
        try {
            for (var calls_1 = tslib_1.__values(calls), calls_1_1 = calls_1.next(); !calls_1_1.done; calls_1_1 = calls_1.next()) {
                var call = calls_1_1.value;
                this.xmpp.sendMessage({
                    mmuc: {
                        speaking: speaking
                    },
                    to: call.roomAddress,
                    type: 'groupchat'
                });
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
    SignalingClient.prototype.lockRoom = function (roomAddress, password) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var state, room, err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        state = this.getState();
                        room = Selectors.getRoomByAddress(state, roomAddress);
                        if (!room || !room.joined || room.selfAffiliation !== 'owner') {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.xmpp.configureRoom(roomAddress, {
                                fields: [
                                    {
                                        name: 'FORM_TYPE',
                                        value: 'http://jabber.org/protocol/muc#roomconfig'
                                    },
                                    {
                                        name: 'muc#roomconfig_whois',
                                        type: 'text-single',
                                        value: 'moderators'
                                    },
                                    {
                                        name: 'muc#roomconfig_roomsecret',
                                        type: 'text-single',
                                        value: password
                                    },
                                    {
                                        name: 'muc#roomconfig_passwordprotectedroom',
                                        type: 'boolean',
                                        value: '1'
                                    }
                                ]
                            })];
                    case 2:
                        _a.sent();
                        this.dispatch(Actions.roomLocked(roomAddress, password));
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        console.error(err_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SignalingClient.prototype.unlockRoom = function (roomAddress) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var state, room, err_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        state = this.getState();
                        room = Selectors.getRoomByAddress(state, roomAddress);
                        if (!room || !room.joined || room.selfAffiliation !== 'owner') {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.xmpp.configureRoom(roomAddress, {
                                fields: [
                                    {
                                        name: 'FORM_TYPE',
                                        value: 'http://jabber.org/protocol/muc#roomconfig'
                                    },
                                    {
                                        name: 'muc#roomconfig_whois',
                                        type: 'text-single',
                                        value: 'moderators'
                                    },
                                    {
                                        name: 'muc#roomconfig_roomsecret',
                                        type: 'text-single',
                                        value: ''
                                    },
                                    {
                                        name: 'muc#roomconfig_passwordprotectedroom',
                                        type: 'boolean',
                                        value: '1'
                                    }
                                ]
                            })];
                    case 2:
                        _a.sent();
                        this.dispatch(Actions.roomUnlocked(roomAddress));
                        return [3 /*break*/, 4];
                    case 3:
                        err_2 = _a.sent();
                        console.error(err_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SignalingClient.prototype.fetchRoomConfig = function (roomAddress, initial) {
        if (initial === void 0) { initial = false; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var e_3, _a, config, state, room, res, form, _b, _c, field;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        config = {};
                        state = this.getState();
                        room = Selectors.getRoomByAddress(state, roomAddress);
                        if (!initial && (!room || !room.joined)) {
                            throw new Error('Room not joined');
                        }
                        return [4 /*yield*/, this.xmpp.getRoomConfig(roomAddress)];
                    case 1:
                        res = _d.sent();
                        form = res.mucOwner.form;
                        try {
                            for (_b = tslib_1.__values(form.fields), _c = _b.next(); !_c.done; _c = _b.next()) {
                                field = _c.value;
                                if (field.name === 'muc#roomconfig_roomsecret') {
                                    if (field.value) {
                                        config.password = field.value;
                                    }
                                    else {
                                        config.password = undefined;
                                    }
                                }
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        return [2 /*return*/, config];
                }
            });
        });
    };
    SignalingClient.prototype.checkLockStatus = function (roomAddress, providedPassword, forceInfo) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var room, config, err_3, res, err_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        room = Selectors.getRoomByAddress(this.getState(), roomAddress);
                        if (!room) {
                            return [2 /*return*/];
                        }
                        if (!(room.selfAffiliation === 'owner' && !forceInfo)) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.fetchRoomConfig(roomAddress, true)];
                    case 2:
                        config = _a.sent();
                        if (config.password) {
                            this.dispatch(Actions.roomLocked(roomAddress, config.password));
                        }
                        else if (providedPassword) {
                            this.dispatch(Actions.lockRoom(roomAddress, providedPassword));
                        }
                        else {
                            this.dispatch(Actions.roomUnlocked(roomAddress));
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        err_3 = _a.sent();
                        console.error(err_3);
                        return [2 /*return*/, this.checkLockStatus(roomAddress, providedPassword, true)];
                    case 4: return [3 /*break*/, 8];
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.xmpp.getDiscoInfo(roomAddress)];
                    case 6:
                        res = _a.sent();
                        if (res.discoInfo.features.indexOf('muc_passwordprotected') >= 0) {
                            this.dispatch(Actions.roomLocked(roomAddress));
                        }
                        else {
                            this.dispatch(Actions.roomUnlocked(roomAddress));
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        err_4 = _a.sent();
                        console.error(err_4);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    SignalingClient.prototype.processMessage = function (msg) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var roomAddress, room;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        roomAddress = msg.from.bare;
                        room = Selectors.getRoomByAddress(this.getState(), roomAddress);
                        if (msg.type === 'groupchat' && msg.mmuc) {
                            if (room && room.selfAddress !== msg.from.full && msg.mmuc) {
                                this.dispatch(Actions.peerUpdated(msg.from.full, {
                                    speaking: msg.mmuc.speaking || false
                                }));
                            }
                        }
                        if (!(msg.muc && msg.muc.codes && msg.muc.codes.indexOf('104') >= 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.checkLockStatus(roomAddress)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return SignalingClient;
}());
exports.default = SignalingClient;
