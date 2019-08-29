"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    const Tune = JXT.define({
        element: 'tune',
        fields: {
            artist: Utils.textSub(NS.TUNE, 'artist'),
            length: Utils.numberSub(NS.TUNE, 'length'),
            rating: Utils.numberSub(NS.TUNE, 'rating'),
            source: Utils.textSub(NS.TUNE, 'source'),
            title: Utils.textSub(NS.TUNE, 'title'),
            track: Utils.textSub(NS.TUNE, 'track'),
            uri: Utils.textSub(NS.TUNE, 'uri')
        },
        name: 'tune',
        namespace: NS.TUNE
    });
    JXT.extendPubsubItem(Tune);
    JXT.extendMessage(Tune);
}
exports.default = default_1;
