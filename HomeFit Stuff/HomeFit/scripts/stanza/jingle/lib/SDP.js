"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const SDP = tslib_1.__importStar(require("sdp"));
tslib_1.__exportStar(require("sdp"), exports);
function parseSctpMap(mediaSection) {
    const sctpMapLines = SDP.matchPrefix(mediaSection, 'a=sctpmap:');
    if (sctpMapLines.length > 0) {
        const parts = SDP.matchPrefix(mediaSection, 'a=sctpmap:')[0]
            .substr(10)
            .split(' ');
        return {
            number: parts[0],
            protocol: parts[1],
            streams: parts[2]
        };
    }
    else {
        const sctpPort = SDP.matchPrefix(mediaSection, 'a=sctp-port:');
        return {
            number: sctpPort[0].substr(12),
            protocol: 'webrtc-datachannel',
            streams: '1024'
        };
    }
}
exports.parseSctpMap = parseSctpMap;
function writeSctpDescription(media, sctp) {
    return [
        `m=${media.kind} 9 ${media.protocol} ${sctp.protocol}\r\n`,
        'c=IN IP4 0.0.0.0\r\n',
        `a=sctp-port:${sctp.number}\r\n`
    ].join('');
}
exports.writeSctpDescription = writeSctpDescription;
