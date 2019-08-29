"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var redux_1 = require("redux");
var API_1 = require("./API");
var Calls_1 = require("./Calls");
var Chats_1 = require("./Chats");
var Connections_1 = require("./Connections");
var Devices_1 = require("./Devices");
var Media_1 = require("./Media");
var Peers_1 = require("./Peers");
var Rooms_1 = require("./Rooms");
var User_1 = require("./User");
var reducer = redux_1.combineReducers({
    api: API_1.default,
    calls: Calls_1.default,
    chats: Chats_1.default,
    connections: Connections_1.default,
    devices: Devices_1.default,
    media: Media_1.default,
    peers: Peers_1.default,
    rooms: Rooms_1.default,
    user: User_1.default
});
exports.default = reducer;
