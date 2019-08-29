"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var redux_1 = require("redux");
var redux_thunk_1 = require("redux-thunk");
var Actions = require("./actions");
exports.Actions = Actions;
var ScreenSharingHelpers = require("./lib/Screensharing");
var reducers_1 = require("./reducers");
exports.reducer = reducers_1.default;
var Selectors = require("./Selectors");
exports.Selectors = Selectors;
var Audio_1 = require("./components/Audio");
exports.Audio = Audio_1.default;
var ChatComposers_1 = require("./components/ChatComposers");
exports.ChatComposers = ChatComposers_1.default;
var ChatInput_1 = require("./components/ChatInput");
exports.ChatInput = ChatInput_1.default;
var ChatList_1 = require("./components/ChatList");
exports.ChatList = ChatList_1.default;
var DeviceList_1 = require("./components/DeviceList");
exports.DeviceList = DeviceList_1.default;
var GridLayout_1 = require("./components/GridLayout");
exports.GridLayout = GridLayout_1.default;
var LocalMediaList_1 = require("./components/LocalMediaList");
exports.LocalMediaList = LocalMediaList_1.default;
var MediaControls_1 = require("./components/MediaControls");
exports.MediaControls = MediaControls_1.default;
var PeerControls_1 = require("./components/PeerControls");
exports.PeerControls = PeerControls_1.default;
var PeerList_1 = require("./components/PeerList");
exports.PeerList = PeerList_1.default;
var Provider_1 = require("./components/Provider");
exports.Provider = Provider_1.default;
exports.Connected = Provider_1.Connected;
exports.Connecting = Provider_1.Connecting;
exports.Disconnected = Provider_1.Disconnected;
exports.Failed = Provider_1.Failed;
exports.NotConnected = Provider_1.NotConnected;
exports.NotSupported = Provider_1.NotSupported;
var RemoteAudioPlayer_1 = require("./components/RemoteAudioPlayer");
exports.RemoteAudioPlayer = RemoteAudioPlayer_1.default;
var RemoteMediaList_1 = require("./components/RemoteMediaList");
exports.RemoteMediaList = RemoteMediaList_1.default;
var RequestDisplayMedia_1 = require("./components/RequestDisplayMedia");
exports.RequestDisplayMedia = RequestDisplayMedia_1.default;
var RequestUserMedia_1 = require("./components/RequestUserMedia");
exports.RequestUserMedia = RequestUserMedia_1.default;
var Room_1 = require("./components/Room");
exports.Room = Room_1.default;
var StayDownContainer_1 = require("./components/StayDownContainer");
exports.StayDownContainer = StayDownContainer_1.default;
var UserControls_1 = require("./components/UserControls");
exports.UserControls = UserControls_1.default;
var Video_1 = require("./components/Video");
exports.Video = Video_1.default;
var VolumeMeter_1 = require("./components/VolumeMeter");
exports.VolumeMeter = VolumeMeter_1.default;
exports.isSupportedBrowser = Selectors.isSupportedBrowser();
exports.screensharing = ScreenSharingHelpers;
var initial = {
    simplewebrtc: {}
};
function createStore() {
    return redux_1.createStore(redux_1.combineReducers({
        simplewebrtc: reducers_1.default
    }), initial, redux_1.compose(redux_1.applyMiddleware(redux_thunk_1.default)));
}
exports.createStore = createStore;
