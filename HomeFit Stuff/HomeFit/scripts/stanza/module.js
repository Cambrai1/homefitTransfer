import jxt from 'jxt';
import { randomBytes as randomBytes$1, createHash as createHash$1, createHmac as createHmac$1 } from 'crypto';
import { __awaiter } from 'tslib';
import fetch from 'cross-fetch';
import { priorityQueue } from 'async';
import WS from 'ws';
import { EventEmitter } from 'events';
import { matchPrefix, getMediaSections, getDescription, getKind, isRejected, parseMLine, getDirection, getMid, getIceParameters, getDtlsParameters, parseRtpParameters, parseRtpEncodingParameters, parseRtcpParameters, parseMsid, parseCandidate, writeSessionBoilerplate, writeRtpDescription, writeIceParameters, writeDtlsParameters, writeCandidate } from 'sdp';

const punycode = require('punycode');
let StringPrep;
try {
    StringPrep = require('node-stringprep');
}
catch (err) {
    StringPrep = false;
}
const HAS_STRINGPREP = !!StringPrep && !!StringPrep.StringPrep;
const NATIVE_STRINGPREP = HAS_STRINGPREP && new StringPrep.StringPrep('nodeprep').isNative();
function toUnicode(data) {
    if (HAS_STRINGPREP) {
        return punycode.toUnicode(StringPrep.toUnicode(data));
    }
    else {
        return punycode.toUnicode(data);
    }
}
function nameprep(str) {
    if (HAS_STRINGPREP) {
        const name = new StringPrep.StringPrep('nameprep');
        return name.prepare(str);
    }
    else {
        return str.toLowerCase();
    }
}
function nodeprep(str) {
    if (HAS_STRINGPREP) {
        const node = new StringPrep.StringPrep('nodeprep');
        return node.prepare(str);
    }
    else {
        return str.toLowerCase();
    }
}
function resourceprep(str) {
    if (HAS_STRINGPREP) {
        const resource = new StringPrep.StringPrep('resourceprep');
        return resource.prepare(str);
    }
    else {
        return str;
    }
}

// All of our StringPrep fallbacks work correctly
// in the ASCII range, so we can reliably mark
// ASCII-only JIDs as prepped.
const ASCII = /^[\x00-\x7F]*$/;
function bareJID(local, domain) {
    if (local) {
        return local + '@' + domain;
    }
    return domain;
}
function fullJID(local, domain, resource) {
    if (resource) {
        return bareJID(local, domain) + '/' + resource;
    }
    return bareJID(local, domain);
}
function prep(data) {
    let local = data.local;
    let domain = data.domain;
    let resource = data.resource;
    let unescapedLocal = local;
    if (local) {
        local = nodeprep(local);
        unescapedLocal = unescape(local);
    }
    if (resource) {
        resource = resourceprep(resource);
    }
    if (domain[domain.length - 1] === '.') {
        domain = domain.slice(0, domain.length - 1);
    }
    domain = nameprep(domain
        .split('.')
        .map(toUnicode)
        .join('.'));
    return {
        bare: bareJID(local, domain),
        domain,
        full: fullJID(local, domain, resource),
        local,
        prepped: data.prepped || NATIVE_STRINGPREP,
        resource,
        unescapedBare: bareJID(unescapedLocal, domain),
        unescapedFull: fullJID(unescapedLocal, domain, resource),
        unescapedLocal
    };
}
function parse(jid, trusted) {
    let local = '';
    let domain = '';
    let resource = '';
    trusted = trusted || ASCII.test(jid);
    const resourceStart = jid.indexOf('/');
    if (resourceStart > 0) {
        resource = jid.slice(resourceStart + 1);
        jid = jid.slice(0, resourceStart);
    }
    const localEnd = jid.indexOf('@');
    if (localEnd > 0) {
        local = jid.slice(0, localEnd);
        jid = jid.slice(localEnd + 1);
    }
    domain = jid;
    const preppedJID = prep({
        domain,
        local,
        resource
    });
    preppedJID.prepped = preppedJID.prepped || trusted;
    return preppedJID;
}
function equal(jid1, jid2, requirePrep) {
    jid1 = new JID(jid1);
    jid2 = new JID(jid2);
    if (arguments.length === 2) {
        requirePrep = true;
    }
    return (jid1.local === jid2.local &&
        jid1.domain === jid2.domain &&
        jid1.resource === jid2.resource &&
        (requirePrep ? jid1.prepped && jid2.prepped : true));
}
function equalBare(jid1, jid2, requirePrep) {
    jid1 = new JID(jid1);
    jid2 = new JID(jid2);
    if (arguments.length === 2) {
        requirePrep = true;
    }
    return (jid1.local === jid2.local &&
        jid1.domain === jid2.domain &&
        (requirePrep ? jid1.prepped && jid2.prepped : true));
}
function isBare(jid) {
    jid = new JID(jid);
    const hasResource = !!jid.resource;
    return !hasResource;
}
function isFull(jid) {
    jid = new JID(jid);
    const hasResource = !!jid.resource;
    return hasResource;
}
function escape(val) {
    return val
        .replace(/^\s+|\s+$/g, '')
        .replace(/\\5c/g, '\\5c5c')
        .replace(/\\20/g, '\\5c20')
        .replace(/\\22/g, '\\5c22')
        .replace(/\\26/g, '\\5c26')
        .replace(/\\27/g, '\\5c27')
        .replace(/\\2f/g, '\\5c2f')
        .replace(/\\3a/g, '\\5c3a')
        .replace(/\\3c/g, '\\5c3c')
        .replace(/\\3e/g, '\\5c3e')
        .replace(/\\40/g, '\\5c40')
        .replace(/ /g, '\\20')
        .replace(/\"/g, '\\22')
        .replace(/\&/g, '\\26')
        .replace(/\'/g, '\\27')
        .replace(/\//g, '\\2f')
        .replace(/:/g, '\\3a')
        .replace(/</g, '\\3c')
        .replace(/>/g, '\\3e')
        .replace(/@/g, '\\40');
}
function unescape(val) {
    return val
        .replace(/\\20/g, ' ')
        .replace(/\\22/g, '"')
        .replace(/\\26/g, '&')
        .replace(/\\27/g, `'`)
        .replace(/\\2f/g, '/')
        .replace(/\\3a/g, ':')
        .replace(/\\3c/g, '<')
        .replace(/\\3e/g, '>')
        .replace(/\\40/g, '@')
        .replace(/\\5c/g, '\\');
}
function create(local, domain, resource) {
    return new JID(local, domain, resource);
}
class JID {
    constructor(localOrJID, domain, resource) {
        let parsed = {};
        if (localOrJID && !domain && !resource) {
            if (typeof localOrJID === 'string') {
                parsed = parse(localOrJID);
            }
            else if (localOrJID._isJID || localOrJID instanceof JID) {
                parsed = localOrJID;
            }
            else {
                throw new Error('Invalid argument type');
            }
        }
        else if (domain) {
            let trusted = ASCII.test(localOrJID) && ASCII.test(domain);
            if (resource) {
                trusted = trusted && ASCII.test(resource);
            }
            parsed = prep({
                domain,
                local: escape(localOrJID),
                prepped: trusted,
                resource
            });
        }
        else {
            parsed = {};
        }
        this._isJID = true;
        this.local = parsed.local || '';
        this.domain = parsed.domain || '';
        this.resource = parsed.resource || '';
        this.bare = parsed.bare || '';
        this.full = parsed.full || '';
        this.unescapedLocal = parsed.unescapedLocal || '';
        this.unescapedBare = parsed.unescapedBare || '';
        this.unescapedFull = parsed.unescapedFull || '';
        this.prepped = parsed.prepped;
    }
    toString() {
        return this.full;
    }
    toJSON() {
        return this.full;
    }
}

var jid = /*#__PURE__*/Object.freeze({
    prep: prep,
    parse: parse,
    equal: equal,
    equalBare: equalBare,
    isBare: isBare,
    isFull: isFull,
    escape: escape,
    unescape: unescape,
    create: create,
    JID: JID
});

class Anonymous {
    response(cred) {
        return cred.trace || '';
    }
    challenge() {
        return undefined;
    }
}
Anonymous.prototype.name = 'ANONYMOUS';
Anonymous.prototype.clientFirst = true;

class External {
    response(cred) {
        return cred.authzid || '';
    }
    challenge() {
        return undefined;
    }
}
External.prototype.name = 'EXTERNAL';
External.prototype.clientFirst = true;

class Plain {
    response(cred) {
        let str = '';
        str += cred.authzid || '';
        str += '\0';
        str += cred.username;
        str += '\0';
        str += cred.password;
        return str;
    }
    challenge() {
        return undefined;
    }
}
Plain.prototype.name = 'PLAIN';
Plain.prototype.clientFirst = true;

const ianaNames = new Map([
    ['md2', 'md2'],
    ['md5', 'md5'],
    ['sha-1', 'sha1'],
    ['sha-224', 'sha224'],
    ['sha-256', 'sha256'],
    ['sha-384', 'sha384'],
    ['sha-512', 'sha512']
]);
function getHashes() {
    return ['sha-1', 'sha-256', 'sha-384', 'sha-512', 'md5'];
}
function createHash(alg) {
    return createHash$1(ianaNames.get(alg.toLowerCase()) || alg);
}
function createHmac(alg, key) {
    return createHmac$1(ianaNames.get(alg.toLowerCase()) || alg, key);
}
function randomBytes(size) {
    return randomBytes$1(size);
}

function parse$1(chal) {
    const dtives = {};
    const tokens = chal.split(/,(?=(?:[^"]|"[^"]*")*$)/);
    for (let i = 0, len = tokens.length; i < len; i++) {
        const dtiv = /(\w+)=["]?([^"]+)["]?$/.exec(tokens[i]);
        if (dtiv) {
            dtives[dtiv[1]] = dtiv[2];
        }
    }
    return dtives;
}
function genNonce() {
    return randomBytes(16).toString('hex');
}
class DigestMD5 {
    constructor(options) {
        options = options || {};
        this._genNonce = options.genNonce || genNonce;
    }
    response(cred) {
        if (this._completed) {
            return undefined;
        }
        let uri = cred.serviceType + '/' + cred.host;
        if (cred.serviceName && cred.host !== cred.serviceName) {
            uri += '/' + cred.serviceName;
        }
        const realm = cred.realm || this._realm || '';
        const cnonce = this._genNonce();
        const nc = '00000001';
        const qop = 'auth';
        let str = '';
        str += 'username="' + cred.username + '"';
        if (realm) {
            str += ',realm="' + realm + '"';
        }
        str += ',nonce="' + this._nonce + '"';
        str += ',cnonce="' + cnonce + '"';
        str += ',nc=' + nc;
        str += ',qop=' + qop;
        str += ',digest-uri="' + uri + '"';
        const base = createHash('md5')
            .update(cred.username)
            .update(':')
            .update(realm)
            .update(':')
            .update(cred.password)
            .digest();
        let ha1 = createHash('md5')
            .update(base)
            .update(':')
            .update(this._nonce)
            .update(':')
            .update(cnonce);
        if (cred.authzid) {
            ha1.update(':').update(cred.authzid);
        }
        ha1 = ha1.digest('hex');
        let ha2 = createHash('md5')
            .update('AUTHENTICATE:')
            .update(uri);
        ha2 = ha2.digest('hex');
        const digest = createHash('md5')
            .update(ha1)
            .update(':')
            .update(this._nonce)
            .update(':')
            .update(nc)
            .update(':')
            .update(cnonce)
            .update(':')
            .update(qop)
            .update(':')
            .update(ha2)
            .digest('hex');
        str += ',response=' + digest;
        if (this._charset === 'utf-8') {
            str += ',charset=utf-8';
        }
        if (cred.authzid) {
            str += 'authzid="' + cred.authzid + '"';
        }
        return str;
    }
    challenge(chal) {
        const dtives = parse$1(chal);
        this._completed = !!dtives.rspauth;
        this._realm = dtives.realm;
        this._nonce = dtives.nonce;
        this._qop = (dtives.qop || 'auth').split(',');
        this._stale = dtives.stale;
        this._maxbuf = parseInt(dtives.maxbuf, 10) || 65536;
        this._charset = dtives.charset;
        this._algo = dtives.algorithm;
        this._cipher = dtives.cipher;
        if (this._cipher) {
            this._cipher.split(',');
        }
        return this;
    }
}
DigestMD5.prototype.name = 'DIGEST-MD5';
DigestMD5.prototype.clientFirst = false;

const RESP = {};
const CLIENT_KEY = 'Client Key';
const SERVER_KEY = 'Server Key';
function parse$2(chal) {
    const dtives = {};
    const tokens = chal.split(/,(?=(?:[^"]|"[^"]*")*$)/);
    for (let i = 0, len = tokens.length; i < len; i++) {
        const dtiv = /(\w+)=["]?([^"]+)["]?$/.exec(tokens[i]);
        if (dtiv) {
            dtives[dtiv[1]] = dtiv[2];
        }
    }
    return dtives;
}
function saslname(name) {
    const escaped = [];
    let curr = '';
    for (let i = 0; i < name.length; i++) {
        curr = name[i];
        if (curr === ',') {
            escaped.push('=2C');
        }
        else if (curr === '=') {
            escaped.push('=3D');
        }
        else {
            escaped.push(curr);
        }
    }
    return escaped.join('');
}
function genNonce$1(len) {
    return randomBytes((len || 32) / 2).toString('hex');
}
function XOR(a, b) {
    const length = Math.min(a.length, b.length);
    const buffer = Buffer.alloc(Math.max(a.length, b.length));
    for (let i = 0; i < length; ++i) {
        // tslint:disable-next-line no-bitwise
        buffer[i] = a[i] ^ b[i];
    }
    return buffer;
}
function H(text) {
    return createHash('sha1')
        .update(text)
        .digest();
}
function HMAC(key, msg) {
    return createHmac('sha1', key)
        .update(msg)
        .digest();
}
function Hi(text, salt, iterations) {
    let ui1 = HMAC(text, Buffer.concat([salt, Buffer.from([0, 0, 0, 1], 'binary')]));
    let ui = ui1;
    for (let i = 0; i < iterations - 1; i++) {
        ui1 = HMAC(text, ui1);
        ui = XOR(ui, ui1);
    }
    return ui;
}
class SCRAM {
    constructor(options) {
        options = options || {};
        this._genNonce = options.genNonce || genNonce$1;
        this._stage = 'initial';
    }
    response(cred) {
        return RESP[this._stage](this, cred);
    }
    challenge(chal) {
        const values = parse$2(chal);
        this._salt = Buffer.from(values.s || '', 'base64');
        this._iterationCount = parseInt(values.i, 10);
        this._nonce = values.r;
        this._verifier = values.v;
        this._error = values.e;
        this._challenge = chal;
        return this;
    }
}
SCRAM.prototype.name = 'SCRAM-SHA-1';
SCRAM.prototype.clientFirst = true;
RESP.initial = function (mech, cred) {
    mech._cnonce = mech._genNonce();
    let authzid = '';
    if (cred.authzid) {
        authzid = 'a=' + saslname(cred.authzid);
    }
    mech._gs2Header = 'n,' + authzid + ',';
    const nonce = 'r=' + mech._cnonce;
    const username = 'n=' + saslname(cred.username || '');
    mech._clientFirstMessageBare = username + ',' + nonce;
    const result = mech._gs2Header + mech._clientFirstMessageBare;
    mech._stage = 'challenge';
    return result;
};
RESP.challenge = function (mech, cred) {
    const gs2Header = Buffer.from(mech._gs2Header).toString('base64');
    mech._clientFinalMessageWithoutProof = 'c=' + gs2Header + ',r=' + mech._nonce;
    let saltedPassword;
    let clientKey;
    let serverKey;
    // If our cached salt is the same, we can reuse cached credentials to speed
    // up the hashing process.
    if (cred.salt && Buffer.compare(cred.salt, mech._salt) === 0) {
        if (cred.clientKey && cred.serverKey) {
            clientKey = cred.clientKey;
            serverKey = cred.serverKey;
        }
        else if (cred.saltedPassword) {
            saltedPassword = cred.saltedPassword;
            clientKey = HMAC(saltedPassword, CLIENT_KEY);
            serverKey = HMAC(saltedPassword, SERVER_KEY);
        }
    }
    else {
        saltedPassword = Hi(cred.password || '', mech._salt, mech._iterationCount);
        clientKey = HMAC(saltedPassword, CLIENT_KEY);
        serverKey = HMAC(saltedPassword, SERVER_KEY);
    }
    const storedKey = H(clientKey);
    const authMessage = mech._clientFirstMessageBare +
        ',' +
        mech._challenge +
        ',' +
        mech._clientFinalMessageWithoutProof;
    const clientSignature = HMAC(storedKey, authMessage);
    const clientProof = XOR(clientKey, clientSignature).toString('base64');
    mech._serverSignature = HMAC(serverKey, authMessage);
    const result = mech._clientFinalMessageWithoutProof + ',p=' + clientProof;
    mech._stage = 'final';
    mech.cache = {
        clientKey: clientKey,
        salt: mech._salt,
        saltedPassword: saltedPassword,
        serverKey: serverKey
    };
    return result;
};
RESP.final = function () {
    // TODO: Signal errors
    return '';
};

class XOAuth2 {
    response(cred) {
        let str = '';
        str += '\0';
        str += cred.username;
        str += '\0';
        str += cred.token;
        return str;
    }
    challenge() {
        return undefined;
    }
}
XOAuth2.prototype.name = 'X-OAUTH2';
XOAuth2.prototype.clientFirst = true;

class Factory {
    constructor() {
        this._mechs = [];
    }
    use(name, mech) {
        if (!mech) {
            mech = name;
            name = mech.prototype.name;
        }
        this._mechs.push({ name: name, mech: mech });
        return this;
    }
    create(mechs) {
        for (let i = 0, len = this._mechs.length; i < len; i++) {
            for (let j = 0, jlen = mechs.length; j < jlen; j++) {
                const entry = this._mechs[i];
                if (entry.name === mechs[j]) {
                    return new entry.mech();
                }
            }
        }
        return null;
    }
}

// ================================================================
// RFCS
// ================================================================
// RFC 6120
const BIND = 'urn:ietf:params:xml:ns:xmpp-bind';
const CLIENT = 'jabber:client';
const SASL = 'urn:ietf:params:xml:ns:xmpp-sasl';
const SERVER = 'jabber:server';
const SESSION = 'urn:ietf:params:xml:ns:xmpp-session';
const STANZA_ERROR = 'urn:ietf:params:xml:ns:xmpp-stanzas';
const STREAM = 'http://etherx.jabber.org/streams';
const STREAM_ERROR = 'urn:ietf:params:xml:ns:xmpp-streams';
// RFC 6121
const ROSTER = 'jabber:iq:roster';
const ROSTER_VERSIONING = 'urn:xmpp:features:rosterver';
const SUBSCRIPTION_PREAPPROVAL = 'urn:xmpp:features:pre-approval';
// RFC 7395
const FRAMING = 'urn:ietf:params:xml:ns:xmpp-framing';
// ================================================================
// XEPS
// ================================================================
// XEP-0004
const DATAFORM = 'jabber:x:data';
// XEP-0030
const DISCO_INFO = 'http://jabber.org/protocol/disco#info';
const DISCO_ITEMS = 'http://jabber.org/protocol/disco#items';
// XEP-0033
const ADDRESS = 'http://jabber.org/protocol/address';
// XEP-0045
const MUC = 'http://jabber.org/protocol/muc';
const MUC_ADMIN = 'http://jabber.org/protocol/muc#admin';
const MUC_OWNER = 'http://jabber.org/protocol/muc#owner';
const MUC_USER = 'http://jabber.org/protocol/muc#user';
// XEP-0047
const IBB = 'http://jabber.org/protocol/ibb';
// XEP-0048
const BOOKMARKS = 'storage:bookmarks';
// XEP-0049
const PRIVATE = 'jabber:iq:private';
// XEP-0050
const ADHOC_COMMANDS = 'http://jabber.org/protocol/commands';
// XEP-0054
const VCARD_TEMP = 'vcard-temp';
// XEP-0059
const RSM = 'http://jabber.org/protocol/rsm';
// XEP-0060
const PUBSUB = 'http://jabber.org/protocol/pubsub';
const PUBSUB_ERRORS = 'http://jabber.org/protocol/pubsub#errors';
const PUBSUB_EVENT = 'http://jabber.org/protocol/pubsub#event';
const PUBSUB_OWNER = 'http://jabber.org/protocol/pubsub#owner';
// XEP-0066
const OOB_IQ = 'jabber:iq:oob';
const OOB = 'jabber:x:oob';
// XEP-0077
const REGISTER = 'jabber:iq:register';
// XEP-0080
const GEOLOC = 'http://jabber.org/protocol/geoloc';
// XEP-0084
const AVATAR_DATA = 'urn:xmpp:avatar:data';
const AVATAR_METADATA = 'urn:xmpp:avatar:metadata';
// XEP-0085
const CHAT_STATES = 'http://jabber.org/protocol/chatstates';
// XEP-0092
const VERSION = 'jabber:iq:version';
// XEP-0107
const MOOD = 'http://jabber.org/protocol/mood';
// XEP-0114
const COMPONENT = 'jabber:component:accept';
// XEP-0115
const CAPS = 'http://jabber.org/protocol/caps';
// XEP-0118
const TUNE = 'http://jabber.org/protocol/tune';
// XEP-0122
const DATAFORM_VALIDATION = 'http://jabber.org/protocol/xdata-validate';
// XEP-0124
const BOSH = 'http://jabber.org/protocol/httpbind';
// XEP-0131
const SHIM = 'http://jabber.org/protocol/shim';
// XEP-0141
const DATAFORM_LAYOUT = 'http://jabber.org/protocol/xdata-layout';
// XEP-0152
const REACH_0 = 'urn:xmpp:reach:0';
// XEP-0153
const VCARD_TEMP_UPDATE = 'vcard-temp:x:update';
// XEP-0156
const ALT_CONNECTIONS_WEBSOCKET = 'urn:xmpp:alt-connections:websocket';
const ALT_CONNECTIONS_XBOSH = 'urn:xmpp:alt-connections:xbosh';
// XEP-0163
const PEP_NOTIFY = ns => `${ns}+notify`;
// XEP-0166
const JINGLE_1 = 'urn:xmpp:jingle:1';
const JINGLE_ERRORS_1 = 'urn:xmpp:jingle:errors:1';
// XEP-0167
const JINGLE_RTP_1 = 'urn:xmpp:jingle:apps:rtp:1';
const JINGLE_RTP_INFO_1 = 'urn:xmpp:jingle:apps:rtp:info:1';
const JINGLE_RTP_AUDIO = 'urn:xmpp:jingle:apps:rtp:audio';
const JINGLE_RTP_VIDEO = 'urn:xmpp:jingle:apps:rtp:video';
// XEP-0172
const NICK = 'http://jabber.org/protocol/nick';
// XEP-0176
const JINGLE_ICE_UDP_1 = 'urn:xmpp:jingle:transports:ice-udp:1';
// XEP-0184
const RECEIPTS = 'urn:xmpp:receipts';
// XEP-0186
const INVISIBLE_0 = 'urn:xmpp:invisible:0';
// XEP-0191
const BLOCKING = 'urn:xmpp:blocking';
// XEP-0198
const SMACKS_3 = 'urn:xmpp:sm:3';
// XEP-0199
const PING = 'urn:xmpp:ping';
// XEP-0202
const TIME = 'urn:xmpp:time';
// XEP-0203
const DELAY = 'urn:xmpp:delay';
// XEP-0206
const BOSH_XMPP = 'urn:xmpp:xbosh';
// XEP-0215
const DISCO_EXTERNAL_1 = 'urn:xmpp:extdisco:1';
// XEP-0221
const DATAFORM_MEDIA = 'urn:xmpp:media-element';
// XEP-0224
const ATTENTION_0 = 'urn:xmpp:attention:0';
// XEP-0231
const BOB = 'urn:xmpp:bob';
// XEP-0234
const FILE_TRANSFER_3 = 'urn:xmpp:jingle:apps:file-transfer:3';
const FILE_TRANSFER_4 = 'urn:xmpp:jingle:apps:file-transfer:4';
// XEP-0249
const MUC_DIRECT_INVITE = 'jabber:x:conference';
// XEP-0261
const JINGLE_IBB_1 = 'urn:xmpp:jingle:transports:ibb:1';
// XEP-0264
const THUMBS_0 = 'urn:xmpp:thumbs:0';
// XEP-0276
const DECLOAKING_0 = 'urn:xmpp:decloaking:0';
// XEP-0280
const CARBONS_2 = 'urn:xmpp:carbons:2';
// XEP-0293
const JINGLE_RTP_RTCP_FB_0 = 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0';
// XEP-0294
const JINGLE_RTP_HDREXT_0 = 'urn:xmpp:jingle:apps:rtp:rtp-hdrext:0';
// XEP-0297
const FORWARD_0 = 'urn:xmpp:forward:0';
// XEP-0300
const HASHES_1 = 'urn:xmpp:hashes:1';
const HASH_NAME = name => `urn:xmpp:hash-function-text-names:${name}`;
// XEP-0301
const RTT_0 = 'urn:xmpp:rtt:0';
// XEP-0307
const MUC_UNIQUE = 'http://jabber.org/protocol/muc#unique';
// XEP-308
const CORRECTION_0 = 'urn:xmpp:message-correct:0';
// XEP-0310
const PSA = 'urn:xmpp:psa';
const MAM_2 = 'urn:xmpp:mam:2';
// XEP-0317
const HATS_0 = 'urn:xmpp:hats:0';
// XEP-0319
const IDLE_1 = 'urn:xmpp:idle:1';
// XEP-0320
const JINGLE_DTLS_0 = 'urn:xmpp:jingle:apps:dtls:0';
// XEP-0328
const JID_PREP_0 = 'urn:xmpp:jidprep:0';
// XEP-0333
const CHAT_MARKERS_0 = 'urn:xmpp:chat-markers:0';
// XEP-0334
const HINTS = 'urn:xmpp:hints';
// XEP-0335
const JSON_0 = 'urn:xmpp:json:0';
// XEP-0337
const EVENTLOG = 'urn:xmpp:eventlog';
// XEP-0338
const JINGLE_GROUPING_0 = 'urn:xmpp:jingle:apps:grouping:0';
// XEP-0339
const JINGLE_RTP_SSMA_0 = 'urn:xmpp:jingle:apps:rtp:ssma:0';
// XEP-0343
const DTLS_SCTP_1 = 'urn:xmpp:jingle:transports:dtls-sctp:1';
// XEP-0352
const CSI = 'urn:xmpp:csi:0';
// XEP-0357
const PUSH_0 = 'urn:xmpp:push:0';
// XEP-0363
const HTTP_UPLOAD_0 = 'urn:xmpp:http:upload:0';
// XEP-0372
const REFERENCE_0 = 'urn:xmpp:reference:0';
// XEP-0380
const EME_0 = 'urn:xmpp:eme:0';
// XEP-0384
const OMEMO_AXOLOTL = 'eu.siacs.conversations.axolotl';
// ================================================================
// OTHER
// ================================================================
const XRD = 'http://docs.oasis-open.org/ns/xri/xrd-1.0';

function Addresses (JXT) {
    const Utils = JXT.utils;
    const Address = JXT.define({
        element: 'address',
        fields: {
            delivered: Utils.boolAttribute('delivered'),
            description: Utils.attribute('desc'),
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node'),
            type: Utils.attribute('type'),
            uri: Utils.attribute('uri')
        },
        name: '_address',
        namespace: ADDRESS
    });
    const Addresses = Utils.subMultiExtension(ADDRESS, 'addresses', Address);
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'addresses', Addresses);
    });
    JXT.withPresence(function (Presence) {
        JXT.add(Presence, 'addresses', Addresses);
    });
}

function Avatar (JXT) {
    const Utils = JXT.utils;
    const Avatar = JXT.define({
        element: 'info',
        fields: {
            bytes: Utils.attribute('bytes'),
            height: Utils.attribute('height'),
            id: Utils.attribute('id'),
            type: Utils.attribute('type', 'image/png'),
            url: Utils.attribute('url'),
            width: Utils.attribute('width')
        },
        name: 'avatar',
        namespace: AVATAR_METADATA
    });
    const avatars = {
        get: function () {
            const metadata = Utils.find(this.xml, AVATAR_METADATA, 'metadata');
            const results = [];
            if (metadata.length) {
                const avatarInfo = Utils.find(metadata[0], AVATAR_METADATA, 'info');
                for (const info of avatarInfo) {
                    results.push(new Avatar({}, info));
                }
            }
            return results;
        },
        set: function (value) {
            const metadata = Utils.findOrCreate(this.xml, AVATAR_METADATA, 'metadata');
            Utils.setAttribute(metadata, 'xmlns', AVATAR_METADATA);
            for (const info of value) {
                const avatar = new Avatar(info);
                metadata.appendChild(avatar.xml);
            }
        }
    };
    JXT.withPubsubItem(function (Item) {
        JXT.add(Item, 'avatars', avatars);
        JXT.add(Item, 'avatarData', Utils.textSub(AVATAR_DATA, 'data'));
    });
}

function Bind (JXT) {
    const Utils = JXT.utils;
    const Bind = JXT.define({
        element: 'bind',
        fields: {
            jid: Utils.jidSub(BIND, 'jid'),
            resource: Utils.textSub(BIND, 'resource')
        },
        name: 'bind',
        namespace: BIND
    });
    JXT.extendIQ(Bind);
    JXT.extendStreamFeatures(Bind);
}

function Blocking (JXT) {
    const Utils = JXT.utils;
    const jidList = {
        get: function () {
            const result = [];
            const items = Utils.find(this.xml, BLOCKING, 'item');
            if (!items.length) {
                return result;
            }
            for (const item of items) {
                result.push(new JID(Utils.getAttribute(item, 'jid', '')));
            }
            return result;
        },
        set: function (values) {
            const self = this;
            for (const value of values) {
                const item = Utils.createElement(BLOCKING, 'item', BLOCKING);
                Utils.setAttribute(item, 'jid', value.toString());
                self.xml.appendChild(item);
            }
        }
    };
    const Block = JXT.define({
        element: 'block',
        fields: {
            jids: jidList
        },
        name: 'block',
        namespace: BLOCKING
    });
    const Unblock = JXT.define({
        element: 'unblock',
        fields: {
            jids: jidList
        },
        name: 'unblock',
        namespace: BLOCKING
    });
    const BlockList = JXT.define({
        element: 'blocklist',
        fields: {
            jids: jidList
        },
        name: 'blockList',
        namespace: BLOCKING
    });
    JXT.extendIQ(Block);
    JXT.extendIQ(Unblock);
    JXT.extendIQ(BlockList);
}

function BOB$1 (JXT) {
    const Utils = JXT.utils;
    const BOB$1 = JXT.define({
        element: 'data',
        fields: {
            cid: Utils.attribute('cid'),
            data: Utils.text(),
            maxAge: Utils.numberAttribute('max-age'),
            type: Utils.attribute('type')
        },
        name: 'bob',
        namespace: BOB
    });
    JXT.extendIQ(BOB$1);
    JXT.extendMessage(BOB$1);
    JXT.extendPresence(BOB$1);
}

function Bookmarks (JXT) {
    const Utils = JXT.utils;
    const Conference = JXT.define({
        element: 'conference',
        fields: {
            autoJoin: Utils.boolAttribute('autojoin'),
            jid: Utils.jidAttribute('jid'),
            name: Utils.attribute('name'),
            nick: Utils.textSub(BOOKMARKS, 'nick')
        },
        name: '_conference',
        namespace: BOOKMARKS
    });
    const Bookmarks = JXT.define({
        element: 'storage',
        name: 'bookmarks',
        namespace: BOOKMARKS
    });
    JXT.extend(Bookmarks, Conference, 'conferences');
    JXT.withDefinition('query', PRIVATE, function (PrivateStorage) {
        JXT.extend(PrivateStorage, Bookmarks);
    });
}

function BOSH$1 (JXT) {
    const Utils = JXT.utils;
    JXT.define({
        element: 'body',
        fields: {
            accept: Utils.attribute('accept'),
            ack: Utils.numberAttribute('ack'),
            authid: Utils.attribute('authid'),
            charsets: Utils.attribute('charsets'),
            condition: Utils.attribute('condition'),
            content: Utils.attribute('content'),
            from: Utils.jidAttribute('from', true),
            hold: Utils.numberAttribute('hold'),
            inactivity: Utils.numberAttribute('inactivity'),
            key: Utils.attribute('key'),
            lang: Utils.langAttribute(),
            maxpause: Utils.numberAttribute('maxpause'),
            newKey: Utils.attribute('newkey'),
            pause: Utils.numberAttribute('pause'),
            payload: {
                get: function () {
                    const results = [];
                    for (let i = 0, len = this.xml.childNodes.length; i < len; i++) {
                        const obj = JXT.build(this.xml.childNodes[i]);
                        if (obj !== undefined) {
                            results.push(obj);
                        }
                    }
                    return results;
                },
                set: function (values) {
                    for (const types of values) {
                        this.xml.appendChild(types.xml);
                    }
                }
            },
            polling: Utils.numberAttribute('polling'),
            requests: Utils.numberAttribute('requests'),
            resport: Utils.numberAttribute('report'),
            restart: Utils.attribute('xmpp:restart'),
            restartLogic: Utils.boolAttribute('xmpp:restartLogic'),
            rid: Utils.numberAttribute('rid'),
            sid: Utils.attribute('sid'),
            stream: Utils.attribute('stream'),
            time: Utils.attribute('time'),
            to: Utils.jidAttribute('to', true),
            type: Utils.attribute('type'),
            uri: Utils.textSub(BOSH, 'uri'),
            ver: Utils.attribute('ver'),
            // These three should be using namespaced attributes, but browsers are stupid
            // when it comes to serializing attributes with namespaces
            version: Utils.attribute('xmpp:version', '1.0'),
            wait: Utils.numberAttribute('wait')
        },
        name: 'bosh',
        namespace: BOSH,
        prefixes: {
            xmpp: BOSH_XMPP
        }
    });
}

function Carbons (JXT) {
    const Sent = JXT.define({
        element: 'sent',
        eventName: 'carbon:sent',
        name: 'carbonSent',
        namespace: CARBONS_2
    });
    const Received = JXT.define({
        element: 'received',
        eventName: 'carbon:received',
        name: 'carbonReceived',
        namespace: CARBONS_2
    });
    const Private = JXT.define({
        element: 'private',
        eventName: 'carbon:private',
        name: 'carbonPrivate',
        namespace: CARBONS_2
    });
    const Enable = JXT.define({
        element: 'enable',
        name: 'enableCarbons',
        namespace: CARBONS_2
    });
    const Disable = JXT.define({
        element: 'disable',
        name: 'disableCarbons',
        namespace: CARBONS_2
    });
    JXT.withDefinition('forwarded', FORWARD_0, function (Forwarded) {
        JXT.extend(Sent, Forwarded);
        JXT.extend(Received, Forwarded);
    });
    JXT.extendMessage(Sent);
    JXT.extendMessage(Received);
    JXT.extendMessage(Private);
    JXT.extendIQ(Enable);
    JXT.extendIQ(Disable);
}

const ACTIONS = ['next', 'prev', 'complete', 'cancel'];
const CONDITIONS = [
    'bad-action',
    'bad-locale',
    'bad-payload',
    'bad-sessionid',
    'malformed-action',
    'session-expired'
];
function Command (JXT) {
    const Utils = JXT.utils;
    const Command = JXT.define({
        element: 'command',
        fields: {
            action: Utils.attribute('action'),
            actions: {
                get: function () {
                    const result = [];
                    const actionSet = Utils.find(this.xml, ADHOC_COMMANDS, 'actions');
                    if (!actionSet.length) {
                        return [];
                    }
                    for (const action of ACTIONS) {
                        const existing = Utils.find(actionSet[0], ADHOC_COMMANDS, action);
                        if (existing.length) {
                            result.push(action);
                        }
                    }
                    return result;
                },
                set: function (values) {
                    const actionSet = Utils.findOrCreate(this.xml, ADHOC_COMMANDS, 'actions');
                    for (let i = 0, len = actionSet.childNodes.length; i < len; i++) {
                        actionSet.removeChild(actionSet.childNodes[i]);
                    }
                    for (const value of values) {
                        actionSet.appendChild(Utils.createElement(ADHOC_COMMANDS, value.toLowerCase(), ADHOC_COMMANDS));
                    }
                }
            },
            execute: Utils.subAttribute(ADHOC_COMMANDS, 'actions', 'execute'),
            node: Utils.attribute('node'),
            sessionid: Utils.attribute('sessionid'),
            status: Utils.attribute('status')
        },
        name: 'command',
        namespace: ADHOC_COMMANDS
    });
    const Note = JXT.define({
        element: 'note',
        fields: {
            type: Utils.attribute('type'),
            value: Utils.text()
        },
        name: '_commandNote',
        namespace: ADHOC_COMMANDS
    });
    JXT.extend(Command, Note, 'notes');
    JXT.extendIQ(Command);
    JXT.withStanzaError(function (StanzaError) {
        JXT.add(StanzaError, 'adhocCommandCondition', Utils.enumSub(ADHOC_COMMANDS, CONDITIONS));
    });
    JXT.withDataForm(function (DataForm) {
        JXT.extend(Command, DataForm);
    });
}

function CSI$1 (JXT) {
    const CSIFeature = JXT.define({
        element: 'csi',
        name: 'clientStateIndication',
        namespace: CSI
    });
    JXT.define({
        element: 'active',
        eventName: 'csi:active',
        name: 'csiActive',
        namespace: CSI,
        topLevel: true
    });
    JXT.define({
        element: 'inactive',
        eventName: 'csi:inactive',
        name: 'csiInactive',
        namespace: CSI,
        topLevel: true
    });
    JXT.extendStreamFeatures(CSIFeature);
}

const SINGLE_FIELDS = ['text-single', 'text-private', 'list-single', 'jid-single'];
function Dataforms (JXT) {
    const Utils = JXT.utils;
    const Field = JXT.define({
        element: 'field',
        fields: {
            desc: Utils.textSub(DATAFORM, 'desc'),
            label: Utils.attribute('label'),
            name: Utils.attribute('var'),
            required: Utils.boolSub(DATAFORM, 'required'),
            type: {
                get: function () {
                    return Utils.getAttribute(this.xml, 'type', 'text-single');
                },
                set: function (value) {
                    this._type = value;
                    Utils.setAttribute(this.xml, 'type', value);
                }
            },
            value: {
                get: function () {
                    const vals = Utils.getMultiSubText(this.xml, DATAFORM, 'value');
                    if (this._type === 'boolean') {
                        return vals[0] === '1' || vals[0] === 'true';
                    }
                    if (vals.length > 1) {
                        if (this._type === 'text-multi') {
                            return vals.join('\n');
                        }
                        if (this._type === 'jid-multi') {
                            return vals.map(function (jid) {
                                return new JID(jid);
                            });
                        }
                        return vals;
                    }
                    if (SINGLE_FIELDS.indexOf(this._type) >= 0) {
                        if (this._type === 'jid-single') {
                            return new JID(vals[0]);
                        }
                        return vals[0];
                    }
                    return vals;
                },
                set: function (value) {
                    if (this._type === 'boolean' || value === true || value === false) {
                        const truthy = value === true || value === 'true' || value === '1';
                        const sub = Utils.createElement(DATAFORM, 'value', DATAFORM);
                        sub.textContent = truthy ? '1' : '0';
                        this.xml.appendChild(sub);
                    }
                    else {
                        if (this._type === 'text-multi' && typeof value === 'string') {
                            value = value.split('\n');
                        }
                        Utils.setMultiSubText(this.xml, DATAFORM, 'value', value, function (val) {
                            const sub = Utils.createElement(DATAFORM, 'value', DATAFORM);
                            sub.textContent = val;
                            this.xml.appendChild(sub);
                        }.bind(this));
                    }
                }
            }
        },
        init: function (data) {
            this._type = (data || {}).type || this.type;
        },
        name: '_field',
        namespace: DATAFORM
    });
    const Option = JXT.define({
        element: 'option',
        fields: {
            label: Utils.attribute('label'),
            value: Utils.textSub(DATAFORM, 'value')
        },
        name: '_formoption',
        namespace: DATAFORM
    });
    const Item = JXT.define({
        element: 'item',
        name: '_formitem',
        namespace: DATAFORM
    });
    const Media = JXT.define({
        element: 'media',
        fields: {
            height: Utils.numberAttribute('height'),
            width: Utils.numberAttribute('width')
        },
        name: 'media',
        namespace: DATAFORM_MEDIA
    });
    const MediaURI = JXT.define({
        element: 'uri',
        fields: {
            type: Utils.attribute('type'),
            uri: Utils.text()
        },
        name: '_mediaURI',
        namespace: DATAFORM_MEDIA
    });
    const Validation = JXT.define({
        element: 'validate',
        fields: {
            basic: Utils.boolSub(DATAFORM_VALIDATION, 'basic'),
            dataType: Utils.attribute('datatype'),
            open: Utils.boolSub(DATAFORM_VALIDATION, 'open'),
            regex: Utils.textSub(DATAFORM_VALIDATION, 'regex')
        },
        name: 'validation',
        namespace: DATAFORM_VALIDATION
    });
    const Range = JXT.define({
        element: 'range',
        fields: {
            max: Utils.attribute('max'),
            min: Utils.attribute('min')
        },
        name: 'range',
        namespace: DATAFORM_VALIDATION
    });
    const ListRange = JXT.define({
        element: 'list-range',
        fields: {
            max: Utils.numberAttribute('max'),
            min: Utils.numberAttribute('min')
        },
        name: 'select',
        namespace: DATAFORM_VALIDATION
    });
    const layoutContents = {
        get: function () {
            const result = [];
            for (let i = 0, len = this.xml.childNodes.length; i < len; i++) {
                const child = this.xml.childNodes[i];
                if (child.namespaceURI !== DATAFORM_LAYOUT) {
                    continue;
                }
                switch (child.localName) {
                    case 'text':
                        result.push({
                            text: child.textContent
                        });
                        break;
                    case 'fieldref':
                        result.push({
                            field: child.getAttribute('var')
                        });
                        break;
                    case 'reportedref':
                        result.push({
                            reported: true
                        });
                        break;
                    case 'section':
                        result.push({
                            section: new Section(null, child, this).toJSON()
                        });
                        break;
                }
            }
            return result;
        },
        set: function (values) {
            for (let i = 0, len = values.length; i < len; i++) {
                const value = values[i];
                if (value.text) {
                    const text = Utils.createElement(DATAFORM_LAYOUT, 'text', DATAFORM_LAYOUT);
                    text.textContent = value.text;
                    this.xml.appendChild(text);
                }
                if (value.field) {
                    const field = Utils.createElement(DATAFORM_LAYOUT, 'fieldref', DATAFORM_LAYOUT);
                    field.setAttribute('var', value.field);
                    this.xml.appendChild(field);
                }
                if (value.reported) {
                    this.xml.appendChild(Utils.createElement(DATAFORM_LAYOUT, 'reportedref', DATAFORM_LAYOUT));
                }
                if (value.section) {
                    const sectionXML = Utils.createElement(DATAFORM_LAYOUT, 'section', DATAFORM_LAYOUT);
                    this.xml.appendChild(sectionXML);
                    const section = new Section(null, sectionXML);
                    section.label = value.section.label;
                    section.contents = value.section.contents;
                }
            }
        }
    };
    const Section = JXT.define({
        element: 'section',
        fields: {
            contents: layoutContents,
            label: Utils.attribute('label')
        },
        name: '_section',
        namespace: DATAFORM_LAYOUT
    });
    const Page = JXT.define({
        element: 'page',
        fields: {
            contents: layoutContents,
            label: Utils.attribute('label')
        },
        name: '_page',
        namespace: DATAFORM_LAYOUT
    });
    const DataForm = JXT.define({
        element: 'x',
        fields: {
            instructions: Utils.multiTextSub(DATAFORM, 'instructions'),
            reportedFields: Utils.subMultiExtension(DATAFORM, 'reported', Field),
            title: Utils.textSub(DATAFORM, 'title'),
            type: Utils.attribute('type', 'form')
        },
        init: function () {
            // Propagate reported field types to items
            if (!this.reportedFields.length) {
                return;
            }
            const fieldTypes = {};
            for (const reported of this.reportedFields) {
                fieldTypes[reported.name] = reported.type;
            }
            for (const item of this.items) {
                for (const field of item.fields) {
                    field.type = field._type = fieldTypes[field.name];
                }
            }
        },
        name: 'form',
        namespace: DATAFORM
    });
    JXT.extend(DataForm, Field, 'fields');
    JXT.extend(DataForm, Item, 'items');
    JXT.extend(DataForm, Page, 'layout');
    JXT.extend(Field, Media);
    JXT.extend(Field, Validation);
    JXT.extend(Field, Option, 'options');
    JXT.extend(Item, Field, 'fields');
    JXT.extend(Media, MediaURI, 'uris');
    JXT.extend(Validation, Range);
    JXT.extend(Validation, ListRange);
    JXT.extendMessage(DataForm);
}

function Delayed (JXT) {
    const Utils = JXT.utils;
    const DelayedDelivery = JXT.define({
        element: 'delay',
        fields: {
            from: Utils.jidAttribute('from'),
            reason: Utils.text(),
            stamp: Utils.dateAttribute('stamp')
        },
        name: 'delay',
        namespace: DELAY
    });
    JXT.extendMessage(DelayedDelivery);
    JXT.extendPresence(DelayedDelivery);
}

function Disco (JXT) {
    const Utils = JXT.utils;
    const DiscoCaps = JXT.define({
        element: 'c',
        fields: {
            ext: Utils.attribute('ext'),
            hash: Utils.attribute('hash'),
            node: Utils.attribute('node'),
            ver: Utils.attribute('ver')
        },
        name: 'caps',
        namespace: CAPS
    });
    const DiscoInfo = JXT.define({
        element: 'query',
        fields: {
            features: Utils.multiSubAttribute(DISCO_INFO, 'feature', 'var'),
            node: Utils.attribute('node')
        },
        name: 'discoInfo',
        namespace: DISCO_INFO
    });
    const DiscoIdentity = JXT.define({
        element: 'identity',
        fields: {
            category: Utils.attribute('category'),
            lang: Utils.langAttribute(),
            name: Utils.attribute('name'),
            type: Utils.attribute('type')
        },
        name: '_discoIdentity',
        namespace: DISCO_INFO
    });
    const DiscoItems = JXT.define({
        element: 'query',
        fields: {
            node: Utils.attribute('node')
        },
        name: 'discoItems',
        namespace: DISCO_ITEMS
    });
    const DiscoItem = JXT.define({
        element: 'item',
        fields: {
            jid: Utils.jidAttribute('jid'),
            name: Utils.attribute('name'),
            node: Utils.attribute('node')
        },
        name: '_discoItem',
        namespace: DISCO_ITEMS
    });
    JXT.extend(DiscoItems, DiscoItem, 'items');
    JXT.extend(DiscoInfo, DiscoIdentity, 'identities');
    JXT.extendIQ(DiscoInfo);
    JXT.extendIQ(DiscoItems);
    JXT.extendPresence(DiscoCaps);
    JXT.extendStreamFeatures(DiscoCaps);
    JXT.withDataForm(function (DataForm) {
        JXT.extend(DiscoInfo, DataForm, 'extensions');
    });
    JXT.withDefinition('set', RSM, function (RSM) {
        JXT.extend(DiscoItems, RSM);
    });
}

const CONDITIONS$1 = [
    'bad-request',
    'conflict',
    'feature-not-implemented',
    'forbidden',
    'gone',
    'internal-server-error',
    'item-not-found',
    'jid-malformed',
    'not-acceptable',
    'not-allowed',
    'not-authorized',
    'payment-required',
    'recipient-unavailable',
    'redirect',
    'registration-required',
    'remote-server-not-found',
    'remote-server-timeout',
    'resource-constraint',
    'service-unavailable',
    'subscription-required',
    'undefined-condition',
    'unexpected-request'
];
function StanzaError (JXT) {
    const Utils = JXT.utils;
    const StanzaError = JXT.define({
        element: 'error',
        fields: {
            $text: {
                get: function () {
                    return Utils.getSubLangText(this.xml, STANZA_ERROR, 'text', this.lang);
                }
            },
            by: Utils.jidAttribute('by'),
            code: Utils.attribute('code'),
            condition: Utils.enumSub(STANZA_ERROR, CONDITIONS$1),
            gone: {
                get: function () {
                    return Utils.getSubText(this.xml, STANZA_ERROR, 'gone');
                },
                set: function (value) {
                    this.condition = 'gone';
                    Utils.setSubText(this.xml, STANZA_ERROR, 'gone', value);
                }
            },
            lang: {
                get: function () {
                    return (this.parent || {}).lang || '';
                }
            },
            redirect: {
                get: function () {
                    return Utils.getSubText(this.xml, STANZA_ERROR, 'redirect');
                },
                set: function (value) {
                    this.condition = 'redirect';
                    Utils.setSubText(this.xml, STANZA_ERROR, 'redirect', value);
                }
            },
            text: {
                get: function () {
                    const text = this.$text;
                    return text[this.lang] || '';
                },
                set: function (value) {
                    Utils.setSubLangText(this.xml, STANZA_ERROR, 'text', value, this.lang);
                }
            },
            type: Utils.attribute('type')
        },
        name: 'error',
        namespace: CLIENT
    });
    JXT.extendMessage(StanzaError);
    JXT.extendPresence(StanzaError);
    JXT.extendIQ(StanzaError);
}

function EME (JXT) {
    const Utils = JXT.utils;
    const EncryptionMethod = JXT.define({
        element: 'encryption',
        fields: {
            name: Utils.attribute('name'),
            namespace: Utils.attribute('namespace')
        },
        name: 'encryptionMethod',
        namespace: EME_0
    });
    JXT.extendMessage(EncryptionMethod);
}

function ExtDisco (JXT) {
    const Utils = JXT.utils;
    const Services = JXT.define({
        element: 'services',
        fields: {
            type: Utils.attribute('type')
        },
        name: 'services',
        namespace: DISCO_EXTERNAL_1
    });
    const Credentials = JXT.define({
        element: 'credentials',
        name: 'credentials',
        namespace: DISCO_EXTERNAL_1
    });
    const Service = JXT.define({
        element: 'service',
        fields: {
            host: Utils.attribute('host'),
            password: Utils.attribute('password'),
            port: Utils.attribute('port'),
            transport: Utils.attribute('transport'),
            type: Utils.attribute('type'),
            username: Utils.attribute('username')
        },
        name: 'service',
        namespace: DISCO_EXTERNAL_1
    });
    JXT.extend(Services, Service, 'services');
    JXT.extend(Credentials, Service);
    JXT.extendIQ(Services);
    JXT.extendIQ(Credentials);
    JXT.withDataForm(function (DataForm) {
        JXT.extend(Service, DataForm);
    });
}

const FT_NS = FILE_TRANSFER_4;
function File (JXT) {
    const Utils = JXT.utils;
    const File = JXT.define({
        element: 'file',
        fields: {
            date: Utils.dateSub(FT_NS, 'date'),
            description: Utils.textSub(FT_NS, 'desc'),
            mediaType: Utils.textSub(FT_NS, 'media-type'),
            name: Utils.textSub(FT_NS, 'name'),
            size: Utils.numberSub(FT_NS, 'size')
        },
        name: 'file',
        namespace: FT_NS
    });
    const Range = JXT.define({
        element: 'range',
        fields: {
            length: Utils.numberAttribute('length'),
            offset: Utils.numberAttribute('offset')
        },
        name: 'range',
        namespace: FT_NS
    });
    const FileTransfer = JXT.define({
        element: 'description',
        fields: {
            applicationType: {
                value: FT_NS,
                writable: true
            }
        },
        name: '_' + FT_NS,
        namespace: FT_NS,
        tags: ['jingle-application']
    });
    const Received = JXT.define({
        element: 'received',
        fields: {
            creator: Utils.attribute('creator'),
            infoType: {
                value: '{' + FT_NS + '}received'
            },
            name: Utils.attribute('name')
        },
        name: '_{' + FT_NS + '}received',
        namespace: FT_NS,
        tags: ['jingle-info']
    });
    const Checksum = JXT.define({
        element: 'checksum',
        fields: {
            creator: Utils.attribute('creator'),
            infoType: {
                value: '{' + FT_NS + '}checksum'
            },
            name: Utils.attribute('name')
        },
        name: '_{' + FT_NS + '}checksum',
        namespace: FT_NS,
        tags: ['jingle-info']
    });
    JXT.extend(File, Range);
    JXT.extend(Checksum, File);
    JXT.extend(FileTransfer, File);
    JXT.withDefinition('hash', HASHES_1, function (Hash) {
        JXT.extend(File, Hash, 'hashes');
        JXT.extend(Range, Hash, 'hashes');
    });
    JXT.withDefinition('content', JINGLE_1, function (Content) {
        JXT.extend(Content, FileTransfer);
    });
    JXT.withDefinition('jingle', JINGLE_1, function (Jingle) {
        JXT.extend(Jingle, Received);
        JXT.extend(Jingle, Checksum);
    });
}

const FT_NS$1 = FILE_TRANSFER_3;
function File3 (JXT) {
    const Utils = JXT.utils;
    const File = JXT.define({
        element: 'file',
        fields: {
            date: Utils.dateSub(FT_NS$1, 'date'),
            desc: Utils.textSub(FT_NS$1, 'desc'),
            name: Utils.textSub(FT_NS$1, 'name'),
            size: Utils.numberSub(FT_NS$1, 'size')
        },
        name: '_file',
        namespace: FT_NS$1
    });
    const Range = JXT.define({
        element: 'range',
        fields: {
            offset: Utils.numberAttribute('offset')
        },
        name: 'range',
        namespace: FT_NS$1
    });
    const Thumbnail = JXT.define({
        element: 'thumbnail',
        fields: {
            cid: Utils.attribute('cid'),
            height: Utils.numberAttribute('height'),
            mimeType: Utils.attribute('mime-type'),
            width: Utils.numberAttribute('width')
        },
        name: 'thumbnail',
        namespace: THUMBS_0
    });
    const FileTransfer = JXT.define({
        element: 'description',
        fields: {
            applicationType: {
                value: 'filetransfer',
                writable: true
            },
            offer: Utils.subExtension('offer', FT_NS$1, 'offer', File),
            request: Utils.subExtension('request', FT_NS$1, 'request', File)
        },
        name: '_filetransfer',
        namespace: FT_NS$1,
        tags: ['jingle-application']
    });
    JXT.extend(File, Range);
    JXT.extend(File, Thumbnail);
    JXT.withDefinition('hash', HASHES_1, function (Hash) {
        JXT.extend(File, Hash, 'hashes');
    });
    JXT.withDefinition('content', JINGLE_1, function (Content) {
        JXT.extend(Content, FileTransfer);
    });
}

function Forwarded (JXT) {
    const Forwarded = JXT.define({
        element: 'forwarded',
        name: 'forwarded',
        namespace: FORWARD_0
    });
    JXT.withMessage(function (Message) {
        JXT.extend(Message, Forwarded);
        JXT.extend(Forwarded, Message);
    });
    JXT.withPresence(function (Presence) {
        JXT.extend(Presence, Forwarded);
        JXT.extend(Forwarded, Presence);
    });
    JXT.withIQ(function (IQ) {
        JXT.extend(IQ, Forwarded);
        JXT.extend(Forwarded, IQ);
    });
    JXT.withDefinition('delay', DELAY, function (Delayed) {
        JXT.extend(Forwarded, Delayed);
    });
}

function Framing (JXT) {
    const Utils = JXT.utils;
    JXT.define({
        element: 'open',
        fields: {
            from: Utils.jidAttribute('from', true),
            id: Utils.attribute('id'),
            lang: Utils.langAttribute(),
            to: Utils.jidAttribute('to', true),
            version: Utils.attribute('version', '1.0')
        },
        name: 'openStream',
        namespace: FRAMING,
        topLevel: true
    });
    JXT.define({
        element: 'close',
        fields: {
            seeOtherURI: Utils.attribute('see-other-uri')
        },
        name: 'closeStream',
        namespace: FRAMING,
        topLevel: true
    });
}

function GeoLoc (JXT) {
    const Utils = JXT.utils;
    const GeoLoc = JXT.define({
        element: 'geoloc',
        fields: {
            accuracy: Utils.numberSub(GEOLOC, 'accuracy', true),
            altitude: Utils.numberSub(GEOLOC, 'alt', true),
            area: Utils.textSub(GEOLOC, 'area'),
            bearing: Utils.numberSub(GEOLOC, 'bearing', true),
            building: Utils.textSub(GEOLOC, 'building'),
            country: Utils.textSub(GEOLOC, 'country'),
            countrycode: Utils.textSub(GEOLOC, 'countrycode'),
            datum: Utils.textSub(GEOLOC, 'datum'),
            description: Utils.textSub(GEOLOC, 'description'),
            error: Utils.numberSub(GEOLOC, 'error', true),
            floor: Utils.textSub(GEOLOC, 'floor'),
            heading: Utils.numberSub(GEOLOC, 'bearing', true),
            latitude: Utils.numberSub(GEOLOC, 'lat', true),
            locality: Utils.textSub(GEOLOC, 'locality'),
            longitude: Utils.numberSub(GEOLOC, 'lon', true),
            postalcode: Utils.textSub(GEOLOC, 'postalcode'),
            region: Utils.textSub(GEOLOC, 'region'),
            room: Utils.textSub(GEOLOC, 'room'),
            speed: Utils.numberSub(GEOLOC, 'speed', true),
            street: Utils.textSub(GEOLOC, 'street'),
            text: Utils.textSub(GEOLOC, 'text'),
            timestamp: Utils.dateSub(GEOLOC, 'timestamp'),
            tzo: Utils.tzoSub(GEOLOC, 'tzo'),
            uri: Utils.textSub(GEOLOC, 'uri')
        },
        name: 'geoloc',
        namespace: GEOLOC
    });
    JXT.extendPubsubItem(GeoLoc);
}

function Hash (JXT) {
    JXT.define({
        element: 'hash',
        fields: {
            algo: JXT.utils.attribute('algo'),
            value: JXT.utils.text()
        },
        name: 'hash',
        namespace: HASHES_1
    });
}

function Hats (JXT) {
    const Hat = JXT.define({
        element: 'hat',
        fields: {
            displayName: JXT.utils.attribute('displayName'),
            lang: JXT.utils.langAttribute(),
            name: JXT.utils.attribute('name')
        },
        name: '_hat',
        namespace: HATS_0
    });
    JXT.withPresence(function (Presence) {
        JXT.add(Presence, 'hats', JXT.utils.subMultiExtension(HATS_0, 'hats', Hat));
    });
}

const EXPORT_MAP = {
    noCopy: 'no-copy',
    noPermanentStore: 'no-permanent-store',
    noStore: 'no-store',
    store: 'store'
};
const IMPORT_MAP = {
    'no-copy': 'noCopy',
    'no-permanent-store': 'noPermanentStore',
    'no-store': 'noStore',
    store: 'store'
};
function Hints (JXT) {
    const Utils = JXT.utils;
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'processingHints', {
            get: function () {
                const results = {};
                for (let i = 0, len = this.xml.childNodes.length; i < len; i++) {
                    const child = this.xml.childNodes[i];
                    const name = child.localName;
                    if (child.namespaceURI !== HINTS) {
                        continue;
                    }
                    if (IMPORT_MAP[name]) {
                        results[IMPORT_MAP[name]] = true;
                    }
                }
                return results;
            },
            set: function (hints) {
                for (let i = 0, len = this.xml.childNodes.length; i < len; i++) {
                    const child = this.xml.childNodes[i];
                    if (child.namespaceURI === HINTS) {
                        this.xml.removeChild(this.xml.childNodes[i]);
                    }
                }
                for (const key of Object.keys(hints)) {
                    if (!hints[key] || !EXPORT_MAP[key]) {
                        continue;
                    }
                    const child = Utils.createElement(HINTS, EXPORT_MAP[key]);
                    this.xml.appendChild(child);
                }
            }
        });
    });
}

function UDP (JXT) {
    const Utils = JXT.utils;
    const ICE = JXT.define({
        element: 'transport',
        fields: {
            gatheringComplete: Utils.boolSub(JINGLE_ICE_UDP_1, 'gathering-complete'),
            pwd: Utils.attribute('pwd'),
            transportType: {
                value: 'iceUdp',
                writable: true
            },
            ufrag: Utils.attribute('ufrag')
        },
        name: '_iceUdp',
        namespace: JINGLE_ICE_UDP_1,
        tags: ['jingle-transport']
    });
    const RemoteCandidate = JXT.define({
        element: 'remote-candidate',
        fields: {
            component: Utils.attribute('component'),
            ip: Utils.attribute('ip'),
            port: Utils.attribute('port')
        },
        name: 'remoteCandidate',
        namespace: JINGLE_ICE_UDP_1
    });
    const Candidate = JXT.define({
        element: 'candidate',
        fields: {
            component: Utils.attribute('component'),
            foundation: Utils.attribute('foundation'),
            generation: Utils.attribute('generation'),
            id: Utils.attribute('id'),
            ip: Utils.attribute('ip'),
            network: Utils.attribute('network'),
            port: Utils.attribute('port'),
            priority: Utils.attribute('priority'),
            protocol: Utils.attribute('protocol'),
            relAddr: Utils.attribute('rel-addr'),
            relPort: Utils.attribute('rel-port'),
            tcpType: Utils.attribute('tcptype'),
            type: Utils.attribute('type')
        },
        name: '_iceUdpCandidate',
        namespace: JINGLE_ICE_UDP_1
    });
    const Fingerprint = JXT.define({
        element: 'fingerprint',
        fields: {
            hash: Utils.attribute('hash'),
            required: Utils.boolAttribute('required'),
            setup: Utils.attribute('setup'),
            value: Utils.text()
        },
        name: '_iceFingerprint',
        namespace: JINGLE_DTLS_0
    });
    const SctpMap = JXT.define({
        element: 'sctpmap',
        fields: {
            number: Utils.attribute('number'),
            protocol: Utils.attribute('protocol'),
            streams: Utils.attribute('streams')
        },
        name: '_sctpMap',
        namespace: DTLS_SCTP_1
    });
    JXT.extend(ICE, Candidate, 'candidates');
    JXT.extend(ICE, RemoteCandidate);
    JXT.extend(ICE, Fingerprint, 'fingerprints');
    JXT.extend(ICE, SctpMap, 'sctp');
    JXT.withDefinition('content', JINGLE_1, function (Content) {
        JXT.extend(Content, ICE);
    });
}

function IBB$1 (JXT) {
    const Utils = JXT.utils;
    const IBB$1 = {
        get: function () {
            let data = Utils.find(this.xml, IBB, 'data');
            if (data.length) {
                data = data[0];
                return {
                    action: 'data',
                    data: Buffer.from(Utils.getText(data), 'base64'),
                    seq: parseInt(Utils.getAttribute(data, 'seq') || '0', 10),
                    sid: Utils.getAttribute(data, 'sid')
                };
            }
            let open = Utils.find(this.xml, IBB, 'open');
            if (open.length) {
                open = open[0];
                let ack = Utils.getAttribute(open, 'stanza');
                if (ack === 'message') {
                    ack = false;
                }
                else {
                    ack = true;
                }
                return {
                    ack: ack,
                    action: 'open',
                    blockSize: Utils.getAttribute(open, 'block-size'),
                    sid: Utils.getAttribute(open, 'sid')
                };
            }
            const close = Utils.find(this.xml, IBB, 'close');
            if (close.length) {
                return {
                    action: 'close',
                    sid: Utils.getAttribute(close[0], 'sid')
                };
            }
        },
        set: function (value) {
            if (value.action === 'data') {
                const data = Utils.createElement(IBB, 'data');
                Utils.setAttribute(data, 'sid', value.sid);
                Utils.setAttribute(data, 'seq', value.seq.toString());
                Utils.setText(data, value.data.toString('base64'));
                this.xml.appendChild(data);
            }
            if (value.action === 'open') {
                const open = Utils.createElement(IBB, 'open');
                Utils.setAttribute(open, 'sid', value.sid);
                Utils.setAttribute(open, 'block-size', (value.blockSize || '4096').toString());
                if (value.ack === false) {
                    Utils.setAttribute(open, 'stanza', 'message');
                }
                else {
                    Utils.setAttribute(open, 'stanza', 'iq');
                }
                this.xml.appendChild(open);
            }
            if (value.action === 'close') {
                const close = Utils.createElement(IBB, 'close');
                Utils.setAttribute(close, 'sid', value.sid);
                this.xml.appendChild(close);
            }
        }
    };
    const JingleIBB = JXT.define({
        element: 'transport',
        fields: {
            ack: {
                get: function () {
                    const value = Utils.getAttribute(this.xml, 'stanza');
                    if (value === 'message') {
                        return false;
                    }
                    return true;
                },
                set: function (value) {
                    if (value.ack === false) {
                        Utils.setAttribute(this.xml, 'stanza', 'message');
                    }
                    else {
                        Utils.setAttribute(this.xml, 'stanza', 'iq');
                    }
                }
            },
            blockSize: Utils.numberAttribute('block-size'),
            sid: Utils.attribute('sid'),
            transportType: {
                value: JINGLE_IBB_1,
                writable: true
            }
        },
        name: '_' + JINGLE_IBB_1,
        namespace: JINGLE_IBB_1,
        tags: ['jingle-transport']
    });
    JXT.withDefinition('content', JINGLE_1, function (Content) {
        JXT.extend(Content, JingleIBB);
    });
    JXT.withIQ(function (IQ) {
        JXT.add(IQ, 'ibb', IBB$1);
    });
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'ibb', IBB$1);
    });
}

const internals = {};
internals.defineIQ = function (JXT, name, namespace) {
    const Utils = JXT.utils;
    const IQ = JXT.define({
        element: 'iq',
        fields: {
            from: Utils.jidAttribute('from', true),
            id: Utils.attribute('id'),
            lang: Utils.langAttribute(),
            to: Utils.jidAttribute('to', true),
            type: Utils.attribute('type')
        },
        name: name,
        namespace: namespace,
        topLevel: true
    });
    const toJSON = IQ.prototype.toJSON;
    Object.assign(IQ.prototype, {
        toJSON() {
            const result = toJSON.call(this);
            result.resultReply = this.resultReply;
            result.errorReply = this.errorReply;
            return result;
        },
        resultReply(data) {
            data = data || {};
            data.to = this.from;
            data.id = this.id;
            data.type = 'result';
            return new IQ(data);
        },
        errorReply(data) {
            data = data || {};
            data.to = this.from;
            data.id = this.id;
            data.type = 'error';
            return new IQ(data);
        }
    });
};
function IQ (JXT) {
    internals.defineIQ(JXT, 'iq', CLIENT);
    internals.defineIQ(JXT, 'serverIQ', SERVER);
    internals.defineIQ(JXT, 'componentIQ', COMPONENT);
}

function JIDPrep (JXT) {
    JXT.withIQ(function (IQ) {
        JXT.add(IQ, 'jidPrep', {
            get: function () {
                const data = JXT.utils.getSubText(this.xml, JID_PREP_0, 'jid');
                if (data) {
                    const jid = new JID(data);
                    jid.prepped = true;
                    return jid;
                }
            },
            set: function (value) {
                JXT.utils.setSubText(this.xml, JID_PREP_0, 'jid', (value || '').toString());
            }
        });
    });
}

const CONDITIONS$2 = ['out-of-order', 'tie-break', 'unknown-session', 'unsupported-info'];
const REASONS = [
    'alternative-session',
    'busy',
    'cancel',
    'connectivity-error',
    'decline',
    'expired',
    'failed-application',
    'failed-transport',
    'general-error',
    'gone',
    'incompatible-parameters',
    'media-error',
    'security-error',
    'success',
    'timeout',
    'unsupported-applications',
    'unsupported-transports'
];
function Jingle (JXT) {
    const Utils = JXT.utils;
    const Jingle = JXT.define({
        element: 'jingle',
        fields: {
            action: Utils.attribute('action'),
            info: {
                get: function () {
                    const opts = JXT.tagged('jingle-info').map(function (Info) {
                        return Info.prototype._name;
                    });
                    for (let i = 0, len = opts.length; i < len; i++) {
                        if (this._extensions[opts[i]]) {
                            return this._extensions[opts[i]];
                        }
                    }
                    if (Utils.getAttribute(this.xml, 'action') === 'session-info') {
                        if (this.xml.children.length === 0) {
                            return {
                                infoType: 'ping'
                            };
                        }
                        return {
                            infoType: 'unknown'
                        };
                    }
                },
                set: function (value) {
                    if (value.infoType === 'ping') {
                        return;
                    }
                    const ext = '_' + value.infoType;
                    this[ext] = value;
                }
            },
            initiator: Utils.attribute('initiator'),
            responder: Utils.attribute('responder'),
            sid: Utils.attribute('sid')
        },
        name: 'jingle',
        namespace: JINGLE_1
    });
    const Content = JXT.define({
        element: 'content',
        fields: {
            application: {
                get: function () {
                    const opts = JXT.tagged('jingle-application').map(function (Description) {
                        return Description.prototype._name;
                    });
                    for (let i = 0, len = opts.length; i < len; i++) {
                        if (this._extensions[opts[i]]) {
                            return this._extensions[opts[i]];
                        }
                    }
                },
                set: function (value) {
                    const ext = '_' + value.applicationType;
                    this[ext] = value;
                }
            },
            creator: Utils.attribute('creator'),
            disposition: Utils.attribute('disposition', 'session'),
            name: Utils.attribute('name'),
            security: {
                get: function () {
                    const opts = JXT.tagged('jingle-security').map(function (Security) {
                        return Security.prototype._name;
                    });
                    for (let i = 0, len = opts.length; i < len; i++) {
                        if (this._extensions[opts[i]]) {
                            return this._extensions[opts[i]];
                        }
                    }
                },
                set: function (value) {
                    const ext = '_' + value.securityType;
                    this[ext] = value;
                }
            },
            senders: Utils.attribute('senders', 'both'),
            transport: {
                get: function () {
                    const opts = JXT.tagged('jingle-transport').map(function (Transport) {
                        return Transport.prototype._name;
                    });
                    for (let i = 0, len = opts.length; i < len; i++) {
                        if (this._extensions[opts[i]]) {
                            return this._extensions[opts[i]];
                        }
                    }
                },
                set: function (value) {
                    const ext = '_' + value.transportType;
                    this[ext] = value;
                }
            }
        },
        name: '_jingleContent',
        namespace: JINGLE_1
    });
    const Reason = JXT.define({
        element: 'reason',
        fields: {
            alternativeSession: {
                get: function () {
                    return Utils.getSubText(this.xml, JINGLE_1, 'alternative-session');
                },
                set: function (value) {
                    this.condition = 'alternative-session';
                    Utils.setSubText(this.xml, JINGLE_1, 'alternative-session', value);
                }
            },
            condition: Utils.enumSub(JINGLE_1, REASONS),
            text: Utils.textSub(JINGLE_1, 'text')
        },
        name: 'reason',
        namespace: JINGLE_1
    });
    JXT.extend(Jingle, Content, 'contents');
    JXT.extend(Jingle, Reason);
    JXT.extendIQ(Jingle);
    JXT.withStanzaError(function (StanzaError) {
        JXT.add(StanzaError, 'jingleCondition', Utils.enumSub(JINGLE_ERRORS_1, CONDITIONS$2));
    });
}

function JSONData (JXT) {
    const JSONExtension = {
        get: function () {
            const data = JXT.utils.getSubText(this.xml, JSON_0, 'json');
            if (data) {
                return JSON.parse(data);
            }
        },
        set: function (value) {
            value = JSON.stringify(value);
            if (value) {
                JXT.utils.setSubText(this.xml, JSON_0, 'json', value);
            }
        }
    };
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'json', JSONExtension);
    });
    JXT.withPubsubItem(function (Item) {
        JXT.add(Item, 'json', JSONExtension);
    });
}

function Eventlog (JXT) {
    const Utils = JXT.utils;
    const Log = JXT.define({
        element: 'log',
        fields: {
            facility: Utils.attribute('facility'),
            id: Utils.attribute('id'),
            level: Utils.attribute('level'),
            message: Utils.textSub(EVENTLOG, 'message'),
            module: Utils.attribute('module'),
            object: Utils.attribute('object'),
            stackTrace: Utils.textSub(EVENTLOG, 'stackTrace'),
            subject: Utils.attribute('subject'),
            timestamp: Utils.dateAttribute('timestamp'),
            type: Utils.attribute('type')
        },
        name: 'log',
        namespace: EVENTLOG
    });
    const Tag = JXT.define({
        element: 'tag',
        fields: {
            name: Utils.attribute('name'),
            type: Utils.attribute('type'),
            value: Utils.attribute('value')
        },
        name: '_logtag',
        namespace: EVENTLOG
    });
    JXT.extend(Log, Tag, 'tags');
    JXT.extendMessage(Log);
    JXT.extendPubsubItem(Log);
}

function MAM (JXT) {
    const Utils = JXT.utils;
    const MAMQuery = JXT.define({
        element: 'query',
        fields: {
            node: Utils.attribute('node'),
            queryid: Utils.attribute('queryid')
        },
        name: 'mam',
        namespace: MAM_2
    });
    const Result = JXT.define({
        element: 'result',
        fields: {
            id: Utils.attribute('id'),
            queryid: Utils.attribute('queryid')
        },
        name: 'mamItem',
        namespace: MAM_2
    });
    const Fin = JXT.define({
        element: 'fin',
        fields: {
            complete: Utils.boolAttribute('complete'),
            stable: Utils.boolAttribute('stable')
        },
        name: 'mamResult',
        namespace: MAM_2
    });
    const Prefs = JXT.define({
        element: 'prefs',
        fields: {
            always: {
                get: function () {
                    const results = [];
                    let container = Utils.find(this.xml, MAM_2, 'always');
                    if (container.length === 0) {
                        return results;
                    }
                    container = container[0];
                    const jids = Utils.getMultiSubText(container, MAM_2, 'jid');
                    for (const jid of jids) {
                        results.push(new JID(jid.textContent));
                    }
                    return results;
                },
                set: function (value) {
                    if (value.length > 0) {
                        const container = Utils.findOrCreate(this.xml, MAM_2, 'always');
                        Utils.setMultiSubText(container, MAM_2, 'jid', value);
                    }
                }
            },
            defaultCondition: Utils.attribute('default'),
            never: {
                get: function () {
                    const results = [];
                    let container = Utils.find(this.xml, MAM_2, 'always');
                    if (container.length === 0) {
                        return results;
                    }
                    container = container[0];
                    const jids = Utils.getMultiSubText(container, MAM_2, 'jid');
                    for (const jid of jids) {
                        results.push(new JID(jid.textContent));
                    }
                    return results;
                },
                set: function (value) {
                    if (value.length > 0) {
                        const container = Utils.findOrCreate(this.xml, MAM_2, 'never');
                        Utils.setMultiSubText(container, MAM_2, 'jid', value);
                    }
                }
            }
        },
        name: 'mamPrefs',
        namespace: MAM_2
    });
    JXT.extendMessage(Result);
    JXT.extendIQ(MAMQuery);
    JXT.extendIQ(Prefs);
    JXT.extendIQ(Fin);
    JXT.withDataForm(function (DataForm) {
        JXT.extend(MAMQuery, DataForm);
    });
    JXT.withDefinition('forwarded', FORWARD_0, function (Forwarded) {
        JXT.extend(Result, Forwarded);
    });
    JXT.withDefinition('set', RSM, function (RSM) {
        JXT.extend(MAMQuery, RSM);
        JXT.extend(Fin, RSM);
    });
}

function Markers (JXT) {
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'markable', JXT.utils.boolSub(CHAT_MARKERS_0, 'markable'));
        JXT.add(Message, 'received', JXT.utils.subAttribute(CHAT_MARKERS_0, 'received', 'id'));
        JXT.add(Message, 'displayed', JXT.utils.subAttribute(CHAT_MARKERS_0, 'displayed', 'id'));
        JXT.add(Message, 'acknowledged', JXT.utils.subAttribute(CHAT_MARKERS_0, 'acknowledged', 'id'));
    });
}

const internals$1 = {};
internals$1.defineMessage = function (JXT, name, namespace) {
    const Utils = JXT.utils;
    JXT.define({
        element: 'message',
        fields: {
            $body: {
                get: function getBody$() {
                    return Utils.getSubLangText(this.xml, namespace, 'body', this.lang);
                }
            },
            attention: Utils.boolSub(ATTENTION_0, 'attention'),
            body: {
                get: function getBody() {
                    const bodies = this.$body;
                    return bodies[this.lang] || '';
                },
                set: function setBody(value) {
                    Utils.setSubLangText(this.xml, namespace, 'body', value, this.lang);
                }
            },
            chatState: Utils.enumSub(CHAT_STATES, [
                'active',
                'composing',
                'paused',
                'inactive',
                'gone'
            ]),
            from: Utils.jidAttribute('from', true),
            id: Utils.attribute('id'),
            lang: Utils.langAttribute(),
            parentThread: Utils.subAttribute(namespace, 'thread', 'parent'),
            receipt: Utils.subAttribute(RECEIPTS, 'received', 'id'),
            replace: Utils.subAttribute(CORRECTION_0, 'replace', 'id'),
            requestReceipt: Utils.boolSub(RECEIPTS, 'request'),
            subject: Utils.textSub(namespace, 'subject'),
            thread: Utils.textSub(namespace, 'thread'),
            to: Utils.jidAttribute('to', true),
            type: Utils.attribute('type', 'normal')
        },
        name: name,
        namespace: namespace,
        topLevel: true
    });
};
function Message (JXT) {
    internals$1.defineMessage(JXT, 'message', CLIENT);
    internals$1.defineMessage(JXT, 'serverMessage', SERVER);
    internals$1.defineMessage(JXT, 'componentMessage', COMPONENT);
}

const MOODS = [
    'afraid',
    'amazed',
    'amorous',
    'angry',
    'annoyed',
    'anxious',
    'aroused',
    'ashamed',
    'bored',
    'brave',
    'calm',
    'cautious',
    'cold',
    'confident',
    'confused',
    'contemplative',
    'contented',
    'cranky',
    'crazy',
    'creative',
    'curious',
    'dejected',
    'depressed',
    'disappointed',
    'disgusted',
    'dismayed',
    'distracted',
    'embarrassed',
    'envious',
    'excited',
    'flirtatious',
    'frustrated',
    'grateful',
    'grieving',
    'grumpy',
    'guilty',
    'happy',
    'hopeful',
    'hot',
    'humbled',
    'humiliated',
    'hungry',
    'hurt',
    'impressed',
    'in_awe',
    'in_love',
    'indignant',
    'interested',
    'intoxicated',
    'invincible',
    'jealous',
    'lonely',
    'lucky',
    'mean',
    'moody',
    'nervous',
    'neutral',
    'offended',
    'outraged',
    'playful',
    'proud',
    'relaxed',
    'relieved',
    'remorseful',
    'restless',
    'sad',
    'sarcastic',
    'serious',
    'shocked',
    'shy',
    'sick',
    'sleepy',
    'spontaneous',
    'stressed',
    'strong',
    'surprised',
    'thankful',
    'thirsty',
    'tired',
    'undefined',
    'weak',
    'worried'
];
function Mood (JXT) {
    const Mood = JXT.define({
        element: 'mood',
        fields: {
            text: JXT.utils.textSub(MOOD, 'text'),
            value: JXT.utils.enumSub(MOOD, MOODS)
        },
        name: 'mood',
        namespace: MOOD
    });
    JXT.extendMessage(Mood);
    JXT.extendPubsubItem(Mood);
}

function proxy(child, field) {
    return {
        get: function () {
            if (this._extensions[child]) {
                return this[child][field];
            }
        },
        set: function (value) {
            this[child][field] = value;
        }
    };
}
function MUC$1 (JXT) {
    const Utils = JXT.utils;
    const UserItem = JXT.define({
        element: 'item',
        fields: {
            affiliation: Utils.attribute('affiliation'),
            jid: Utils.jidAttribute('jid'),
            nick: Utils.attribute('nick'),
            reason: Utils.textSub(MUC_USER, 'reason'),
            role: Utils.attribute('role')
        },
        name: '_mucUserItem',
        namespace: MUC_USER
    });
    const UserActor = JXT.define({
        element: 'actor',
        fields: {
            jid: Utils.jidAttribute('jid'),
            nick: Utils.attribute('nick')
        },
        name: '_mucUserActor',
        namespace: MUC_USER
    });
    const Destroyed = JXT.define({
        element: 'destroy',
        fields: {
            jid: Utils.jidAttribute('jid'),
            reason: Utils.textSub(MUC_USER, 'reason')
        },
        name: 'destroyed',
        namespace: MUC_USER
    });
    const Invite = JXT.define({
        element: 'invite',
        fields: {
            continue: Utils.boolSub(MUC_USER, 'continue'),
            from: Utils.jidAttribute('from'),
            reason: Utils.textSub(MUC_USER, 'reason'),
            thread: Utils.subAttribute(MUC_USER, 'continue', 'thread'),
            to: Utils.jidAttribute('to')
        },
        name: 'invite',
        namespace: MUC_USER
    });
    const Decline = JXT.define({
        element: 'decline',
        fields: {
            from: Utils.jidAttribute('from'),
            reason: Utils.textSub(MUC_USER, 'reason'),
            to: Utils.jidAttribute('to')
        },
        name: 'decline',
        namespace: MUC_USER
    });
    const AdminItem = JXT.define({
        element: 'item',
        fields: {
            affiliation: Utils.attribute('affiliation'),
            jid: Utils.jidAttribute('jid'),
            nick: Utils.attribute('nick'),
            reason: Utils.textSub(MUC_ADMIN, 'reason'),
            role: Utils.attribute('role')
        },
        name: '_mucAdminItem',
        namespace: MUC_ADMIN
    });
    const AdminActor = JXT.define({
        element: 'actor',
        fields: {
            jid: Utils.jidAttribute('jid'),
            nick: Utils.attribute('nick')
        },
        name: 'actor',
        namespace: MUC_USER
    });
    const Destroy = JXT.define({
        element: 'destroy',
        fields: {
            jid: Utils.jidAttribute('jid'),
            password: Utils.textSub(MUC_OWNER, 'password'),
            reason: Utils.textSub(MUC_OWNER, 'reason')
        },
        name: 'destroy',
        namespace: MUC_OWNER
    });
    const MUC$1 = JXT.define({
        element: 'x',
        fields: {
            actor: proxy('_mucUserItem', '_mucUserActor'),
            affiliation: proxy('_mucUserItem', 'affiliation'),
            codes: {
                get: function () {
                    return Utils.getMultiSubText(this.xml, MUC_USER, 'status', function (sub) {
                        return Utils.getAttribute(sub, 'code');
                    });
                },
                set: function (value) {
                    const self = this;
                    Utils.setMultiSubText(this.xml, MUC_USER, 'status', value, function (val) {
                        const child = Utils.createElement(MUC_USER, 'status', MUC_USER);
                        Utils.setAttribute(child, 'code', val);
                        self.xml.appendChild(child);
                    });
                }
            },
            jid: proxy('_mucUserItem', 'jid'),
            nick: proxy('_mucUserItem', 'nick'),
            password: Utils.textSub(MUC_USER, 'password'),
            reason: proxy('_mucUserItem', 'reason'),
            role: proxy('_mucUserItem', 'role')
        },
        name: 'muc',
        namespace: MUC_USER
    });
    const MUCAdmin = JXT.define({
        element: 'query',
        fields: {
            actor: proxy('_mucAdminItem', '_mucAdminActor'),
            affiliation: proxy('_mucAdminItem', 'affiliation'),
            jid: proxy('_mucAdminItem', 'jid'),
            nick: proxy('_mucAdminItem', 'nick'),
            reason: proxy('_mucAdminItem', 'reason'),
            role: proxy('_mucAdminItem', 'role')
        },
        name: 'mucAdmin',
        namespace: MUC_ADMIN
    });
    const MUCOwner = JXT.define({
        element: 'query',
        name: 'mucOwner',
        namespace: MUC_OWNER
    });
    const MUCJoin = JXT.define({
        element: 'x',
        fields: {
            history: {
                get: function () {
                    let hist = Utils.find(this.xml, MUC, 'history');
                    if (!hist.length) {
                        return {};
                    }
                    hist = hist[0];
                    const maxchars = hist.getAttribute('maxchars') || '';
                    const maxstanzas = hist.getAttribute('maxstanzas') || '';
                    const seconds = hist.getAttribute('seconds') || '';
                    const since = hist.getAttribute('since') || '';
                },
                set: function (opts) {
                    const existing = Utils.find(this.xml, MUC, 'history');
                    if (existing.length) {
                        for (let i = 0; i < existing.length; i++) {
                            this.xml.removeChild(existing[i]);
                        }
                    }
                    const hist = Utils.createElement(MUC, 'history', MUC);
                    this.xml.appendChild(hist);
                    if (opts.maxchars !== undefined) {
                        hist.setAttribute('maxchars', '' + opts.maxchars);
                    }
                    if (opts.maxstanzas !== undefined) {
                        hist.setAttribute('maxstanzas', '' + opts.maxstanzas);
                    }
                    if (opts.seconds !== undefined) {
                        hist.setAttribute('seconds', '' + opts.seconds);
                    }
                    if (opts.since) {
                        hist.setAttribute('since', opts.since.toISOString());
                    }
                }
            },
            password: Utils.textSub(MUC, 'password')
        },
        name: 'joinMuc',
        namespace: MUC
    });
    const DirectInvite = JXT.define({
        element: 'x',
        fields: {
            continue: Utils.boolAttribute('continue'),
            jid: Utils.jidAttribute('jid'),
            password: Utils.attribute('password'),
            reason: Utils.attribute('reason'),
            thread: Utils.attribute('thread')
        },
        name: 'mucInvite',
        namespace: MUC_DIRECT_INVITE
    });
    JXT.extend(UserItem, UserActor);
    JXT.extend(MUC$1, UserItem);
    JXT.extend(MUC$1, Invite, 'invites');
    JXT.extend(MUC$1, Decline);
    JXT.extend(MUC$1, Destroyed);
    JXT.extend(AdminItem, AdminActor);
    JXT.extend(MUCAdmin, AdminItem, 'items');
    JXT.extend(MUCOwner, Destroy);
    JXT.extendPresence(MUC$1);
    JXT.extendPresence(MUCJoin);
    JXT.extendMessage(MUC$1);
    JXT.extendMessage(DirectInvite);
    JXT.withIQ(function (IQ) {
        JXT.add(IQ, 'mucUnique', Utils.textSub(MUC_UNIQUE, 'unique'));
        JXT.extend(IQ, MUCAdmin);
        JXT.extend(IQ, MUCOwner);
    });
    JXT.withDataForm(function (DataForm) {
        JXT.extend(MUCOwner, DataForm);
    });
}

function Nick (JXT) {
    const nick = JXT.utils.textSub(NICK, 'nick');
    JXT.withPubsubItem(function (Item) {
        JXT.add(Item, 'nick', nick);
    });
    JXT.withPresence(function (Presence) {
        JXT.add(Presence, 'nick', nick);
    });
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'nick', nick);
    });
}

function OMEMO (JXT) {
    const Utils = JXT.utils;
    const OMEMO = JXT.define({
        element: 'encrypted',
        fields: {
            payload: Utils.textSub(OMEMO_AXOLOTL, 'payload')
        },
        name: 'omemo',
        namespace: OMEMO_AXOLOTL
    });
    const Header = JXT.define({
        element: 'header',
        fields: {
            iv: Utils.textSub(OMEMO_AXOLOTL, 'iv'),
            sid: Utils.attribute('sid')
        },
        name: 'header',
        namespace: OMEMO_AXOLOTL
    });
    const Key = JXT.define({
        element: 'key',
        fields: {
            preKey: Utils.boolAttribute('prekey'),
            rid: Utils.attribute('rid'),
            value: Utils.text()
        },
        namespace: OMEMO_AXOLOTL
    });
    const DeviceList = JXT.define({
        element: 'list',
        fields: {
            devices: Utils.multiSubAttribute(OMEMO_AXOLOTL, 'device', 'id')
        },
        name: 'omemoDeviceList',
        namespace: OMEMO_AXOLOTL
    });
    const PreKeyPublic = JXT.define({
        element: 'preKeyPublic',
        fields: {
            id: Utils.attribute('preKeyId'),
            value: Utils.text()
        },
        name: 'preKeyPublic',
        namespace: OMEMO_AXOLOTL
    });
    const SignedPreKeyPublic = JXT.define({
        element: 'signedPreKeyPublic',
        fields: {
            id: Utils.attribute('signedPreKeyId'),
            value: Utils.text()
        },
        name: 'signedPreKeyPublic',
        namespace: OMEMO_AXOLOTL
    });
    const Bundle = JXT.define({
        element: 'bundle',
        fields: {
            identityKey: Utils.textSub(OMEMO_AXOLOTL, 'identityKey'),
            preKeys: Utils.subMultiExtension(OMEMO_AXOLOTL, 'prekeys', PreKeyPublic),
            signedPreKeySignature: Utils.textSub(OMEMO_AXOLOTL, 'signedPreKeySignature')
        },
        name: 'omemoDevice',
        namespace: OMEMO_AXOLOTL
    });
    JXT.extend(Bundle, SignedPreKeyPublic);
    JXT.extend(Header, Key, 'keys', true);
    JXT.extend(OMEMO, Header);
    JXT.withMessage(function (Message) {
        JXT.extend(Message, OMEMO);
    });
    JXT.withPubsubItem(function (Item) {
        JXT.extend(Item, Bundle);
        JXT.extend(Item, DeviceList);
    });
}

function OOB$1 (JXT) {
    const OOB$1 = JXT.define({
        element: 'x',
        fields: {
            desc: JXT.utils.textSub(OOB, 'desc'),
            url: JXT.utils.textSub(OOB, 'url')
        },
        name: 'oob',
        namespace: OOB
    });
    const OOB_IQ$1 = JXT.define({
        element: 'query',
        fields: {
            desc: JXT.utils.textSub(OOB, 'desc'),
            url: JXT.utils.textSub(OOB, 'url')
        },
        name: 'oob',
        namespace: OOB_IQ
    });
    JXT.extendMessage(OOB$1, 'oobURIs');
    JXT.extendIQ(OOB_IQ$1);
}

function Ping (JXT) {
    const Ping = JXT.define({
        element: 'ping',
        name: 'ping',
        namespace: PING
    });
    JXT.extendIQ(Ping);
}

const internals$2 = {};
internals$2.definePresence = function (JXT, name, namespace) {
    const Utils = JXT.utils;
    JXT.define({
        element: 'presence',
        fields: {
            $status: {
                get: function () {
                    return Utils.getSubLangText(this.xml, namespace, 'status', this.lang);
                }
            },
            avatarId: {
                get: function () {
                    const update = Utils.find(this.xml, VCARD_TEMP_UPDATE, 'x');
                    if (!update.length) {
                        return '';
                    }
                    return Utils.getSubText(update[0], VCARD_TEMP_UPDATE, 'photo');
                },
                set: function (value) {
                    const update = Utils.findOrCreate(this.xml, VCARD_TEMP_UPDATE, 'x');
                    if (value === '') {
                        Utils.setBoolSub(update, VCARD_TEMP_UPDATE, 'photo', true);
                    }
                    else if (value === true) {
                        return;
                    }
                    else if (value) {
                        Utils.setSubText(update, VCARD_TEMP_UPDATE, 'photo', value);
                    }
                    else {
                        this.xml.removeChild(update);
                    }
                }
            },
            decloak: Utils.subAttribute(DECLOAKING_0, 'decloak', 'reason'),
            from: Utils.jidAttribute('from', true),
            id: Utils.attribute('id'),
            idleSince: Utils.dateSubAttribute(IDLE_1, 'idle', 'since'),
            lang: Utils.langAttribute(),
            priority: Utils.numberSub(namespace, 'priority', false, 0),
            show: Utils.textSub(namespace, 'show'),
            status: {
                get: function () {
                    const statuses = this.$status;
                    return statuses[this.lang] || '';
                },
                set: function (value) {
                    Utils.setSubLangText(this.xml, namespace, 'status', value, this.lang);
                }
            },
            to: Utils.jidAttribute('to', true),
            type: {
                get: function () {
                    return Utils.getAttribute(this.xml, 'type', 'available');
                },
                set: function (value) {
                    if (value === 'available') {
                        value = false;
                    }
                    Utils.setAttribute(this.xml, 'type', value);
                }
            }
        },
        name: name,
        namespace: namespace,
        topLevel: true
    });
};
function Presence (JXT) {
    internals$2.definePresence(JXT, 'presence', CLIENT);
    internals$2.definePresence(JXT, 'serverPresence', SERVER);
    internals$2.definePresence(JXT, 'componentPresence', COMPONENT);
}

function Private (JXT) {
    const PrivateStorage = JXT.define({
        element: 'query',
        name: 'privateStorage',
        namespace: PRIVATE
    });
    JXT.extendIQ(PrivateStorage);
}

const CONDITIONS$3 = ['server-unavailable', 'connection-paused'];
function PSA$1 (JXT) {
    const PSA$1 = JXT.define({
        element: 'state-annotation',
        fields: {
            condition: JXT.utils.enumSub(PSA, CONDITIONS$3),
            description: JXT.utils.textSub(PSA, 'description'),
            from: JXT.utils.jidAttribute('from')
        },
        name: 'state',
        namespace: PSA
    });
    JXT.extendPresence(PSA$1);
}

function Pubsub (JXT) {
    const Utils = JXT.utils;
    const Pubsub = JXT.define({
        element: 'pubsub',
        fields: {
            create: {
                get: function () {
                    const node = Utils.getSubAttribute(this.xml, PUBSUB, 'create', 'node');
                    if (node) {
                        return node;
                    }
                    return Utils.getBoolSub(this.xml, PUBSUB, 'create');
                },
                set: function (value) {
                    if (value === true || !value) {
                        Utils.setBoolSub(this.xml, PUBSUB, 'create', value);
                    }
                    else {
                        Utils.setSubAttribute(this.xml, PUBSUB, 'create', 'node', value);
                    }
                }
            },
            publishOptions: {
                get: function () {
                    const DataForm = JXT.getDefinition('x', DATAFORM);
                    const conf = Utils.find(this.xml, PUBSUB, 'publish-options');
                    if (conf.length && conf[0].childNodes.length) {
                        return new DataForm({}, conf[0].childNodes[0]);
                    }
                },
                set: function (value) {
                    const DataForm = JXT.getDefinition('x', DATAFORM);
                    const conf = Utils.findOrCreate(this.xml, PUBSUB, 'publish-options');
                    if (value) {
                        const form = new DataForm(value);
                        conf.appendChild(form.xml);
                    }
                }
            }
        },
        name: 'pubsub',
        namespace: PUBSUB
    });
    const Configure = JXT.define({
        element: 'configure',
        name: 'config',
        namespace: PUBSUB
    });
    const Subscribe = JXT.define({
        element: 'subscribe',
        fields: {
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node')
        },
        name: 'subscribe',
        namespace: PUBSUB
    });
    const Subscription = JXT.define({
        element: 'subscription',
        fields: {
            configurable: Utils.boolSub('subscribe-options'),
            configurationRequired: {
                get: function () {
                    const options = Utils.find(this.xml, PUBSUB, 'subscribe-options');
                    if (options.length) {
                        return Utils.getBoolSub(options[0], PUBSUB, 'required');
                    }
                    return false;
                }
            },
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node'),
            subid: Utils.attribute('subid'),
            type: Utils.attribute('subscription')
        },
        name: 'subscription',
        namespace: PUBSUB
    });
    const Subscriptions = JXT.define({
        element: 'subscriptions',
        fields: {
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node')
        },
        name: 'subscriptions',
        namespace: PUBSUB
    });
    const Affiliation = JXT.define({
        element: 'affiliation',
        fields: {
            node: Utils.attribute('node'),
            type: Utils.attribute('affiliation')
        },
        name: 'affiliation',
        namespace: PUBSUB
    });
    const Affiliations = JXT.define({
        element: 'affiliations',
        fields: {
            node: Utils.attribute('node')
        },
        name: 'affiliations',
        namespace: PUBSUB
    });
    const SubscriptionOptions = JXT.define({
        element: 'options',
        fields: {
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node'),
            subid: Utils.attribute('subid')
        },
        name: 'subscriptionOptions',
        namespace: PUBSUB
    });
    const Unsubscribe = JXT.define({
        element: 'unsubscribe',
        fields: {
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node'),
            subid: Utils.attribute('subid')
        },
        name: 'unsubscribe',
        namespace: PUBSUB
    });
    const Publish = JXT.define({
        element: 'publish',
        fields: {
            node: Utils.attribute('node')
        },
        name: 'publish',
        namespace: PUBSUB
    });
    const Retract = JXT.define({
        element: 'retract',
        fields: {
            id: Utils.subAttribute(PUBSUB, 'item', 'id'),
            node: Utils.attribute('node'),
            notify: Utils.boolAttribute('notify')
        },
        name: 'retract',
        namespace: PUBSUB
    });
    const Retrieve = JXT.define({
        element: 'items',
        fields: {
            max: Utils.attribute('max_items'),
            node: Utils.attribute('node')
        },
        name: 'retrieve',
        namespace: PUBSUB
    });
    const Item = JXT.define({
        element: 'item',
        fields: {
            id: Utils.attribute('id'),
            publisher: Utils.jidAttribute('publisher')
        },
        name: 'item',
        namespace: PUBSUB
    });
    JXT.extend(Pubsub, Configure);
    JXT.extend(Pubsub, Subscribe);
    JXT.extend(Pubsub, Unsubscribe);
    JXT.extend(Pubsub, Publish);
    JXT.extend(Pubsub, Retract);
    JXT.extend(Pubsub, Retrieve);
    JXT.extend(Pubsub, Subscription);
    JXT.extend(Pubsub, SubscriptionOptions);
    JXT.extend(Pubsub, Subscriptions);
    JXT.extend(Pubsub, Affiliations);
    JXT.extend(Publish, Item, 'items');
    JXT.extend(Retrieve, Item, 'items');
    JXT.extend(Subscriptions, Subscription, 'list');
    JXT.extend(Affiliations, Affiliation, 'list');
    JXT.extendIQ(Pubsub);
    JXT.withDataForm(function (DataForm) {
        JXT.extend(SubscriptionOptions, DataForm);
        JXT.extend(Item, DataForm);
        JXT.extend(Configure, DataForm);
    });
    JXT.withDefinition('set', RSM, function (RSM) {
        JXT.extend(Pubsub, RSM);
    });
}

const CONDITIONS$4 = [
    'closed-node',
    'configuration-required',
    'invalid-jid',
    'invalid-options',
    'invalid-payload',
    'invalid-subid',
    'item-forbidden',
    'item-required',
    'jid-required',
    'max-items-exceeded',
    'max-nodes-exceeded',
    'nodeid-required',
    'not-in-roster-group',
    'not-subscribed',
    'payload-too-big',
    'payload-required',
    'pending-subscription',
    'presence-subscription-required',
    'subid-required',
    'too-many-subscriptions',
    'unsupported',
    'unsupported-access-model'
];
function PubsubError (JXT) {
    JXT.withStanzaError(function (StanzaError) {
        JXT.add(StanzaError, 'pubsubCondition', JXT.utils.enumSub(PUBSUB_ERRORS, CONDITIONS$4));
        JXT.add(StanzaError, 'pubsubUnsupportedFeature', {
            get: function () {
                return JXT.utils.getSubAttribute(this.xml, PUBSUB_ERRORS, 'unsupported', 'feature');
            },
            set: function (value) {
                if (value) {
                    this.pubsubCondition = 'unsupported';
                }
                JXT.utils.setSubAttribute(this.xml, PUBSUB_ERRORS, 'unsupported', 'feature', value);
            }
        });
    });
}

function PubsubEvents (JXT) {
    const Utils = JXT.utils;
    const Event = JXT.define({
        element: 'event',
        name: 'event',
        namespace: PUBSUB_EVENT
    });
    const EventPurge = JXT.define({
        element: 'purge',
        fields: {
            node: Utils.attribute('node')
        },
        name: 'purged',
        namespace: PUBSUB_EVENT
    });
    const EventDelete = JXT.define({
        element: 'delete',
        fields: {
            node: Utils.attribute('node'),
            redirect: Utils.subAttribute(PUBSUB_EVENT, 'redirect', 'uri')
        },
        name: 'deleted',
        namespace: PUBSUB_EVENT
    });
    const EventSubscription = JXT.define({
        element: 'subscription',
        fields: {
            expiry: {
                get: function () {
                    const text = Utils.getAttribute(this.xml, 'expiry');
                    if (text === 'presence') {
                        return text;
                    }
                    else if (text) {
                        return new Date(text);
                    }
                },
                set: function (value) {
                    if (!value) {
                        return;
                    }
                    if (typeof value !== 'string') {
                        value = value.toISOString();
                    }
                    Utils.setAttribute(this.xml, 'expiry', value);
                }
            },
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node'),
            subid: Utils.attribute('subid'),
            type: Utils.attribute('subscription')
        },
        name: 'subscriptionChanged',
        namespace: PUBSUB_EVENT
    });
    const EventConfiguration = JXT.define({
        element: 'configuration',
        fields: {
            node: Utils.attribute('node')
        },
        name: 'configurationChanged',
        namespace: PUBSUB_EVENT
    });
    const EventItems = JXT.define({
        element: 'items',
        fields: {
            node: Utils.attribute('node'),
            retracted: {
                get: function () {
                    const results = [];
                    const retracted = Utils.find(this.xml, PUBSUB_EVENT, 'retract');
                    for (const xml of retracted) {
                        results.push(xml.getAttribute('id'));
                    }
                    return results;
                },
                set: function (value) {
                    const self = this;
                    for (const id of value) {
                        const retracted = Utils.createElement(PUBSUB_EVENT, 'retract', PUBSUB_EVENT);
                        retracted.setAttribute('id', id);
                        self.xml.appendChild(retracted);
                    }
                }
            }
        },
        name: 'updated',
        namespace: PUBSUB_EVENT
    });
    const EventItem = JXT.define({
        element: 'item',
        fields: {
            id: Utils.attribute('id'),
            node: Utils.attribute('node'),
            publisher: Utils.jidAttribute('publisher')
        },
        name: '_eventItem',
        namespace: PUBSUB_EVENT
    });
    JXT.extend(EventItems, EventItem, 'published');
    JXT.extend(Event, EventItems);
    JXT.extend(Event, EventSubscription);
    JXT.extend(Event, EventConfiguration);
    JXT.extend(Event, EventDelete);
    JXT.extend(Event, EventPurge);
    JXT.extendMessage(Event);
    JXT.withDataForm(function (DataForm) {
        JXT.extend(EventConfiguration, DataForm);
    });
}

function PubsubOwner (JXT) {
    const Utils = JXT.utils;
    const PubsubOwner = JXT.define({
        element: 'pubsub',
        fields: {
            del: Utils.subAttribute(PUBSUB_OWNER, 'delete', 'node'),
            purge: Utils.subAttribute(PUBSUB_OWNER, 'purge', 'node'),
            redirect: {
                get: function () {
                    const del = Utils.find(this.xml, PUBSUB_OWNER, 'delete');
                    if (del.length) {
                        return Utils.getSubAttribute(del[0], PUBSUB_OWNER, 'redirect', 'uri');
                    }
                    return '';
                },
                set: function (value) {
                    const del = Utils.findOrCreate(this.xml, PUBSUB_OWNER, 'delete');
                    Utils.setSubAttribute(del, PUBSUB_OWNER, 'redirect', 'uri', value);
                }
            }
        },
        name: 'pubsubOwner',
        namespace: PUBSUB_OWNER
    });
    const Subscription = JXT.define({
        element: 'subscription',
        fields: {
            configurable: Utils.boolSub('subscribe-options'),
            configurationRequired: {
                get: function () {
                    const options = Utils.find(this.xml, PUBSUB_OWNER, 'subscribe-options');
                    if (options.length) {
                        return Utils.getBoolSub(options[0], PUBSUB_OWNER, 'required');
                    }
                    return false;
                }
            },
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node'),
            subid: Utils.attribute('subid'),
            type: Utils.attribute('subscription')
        },
        name: 'subscription',
        namespace: PUBSUB_OWNER
    });
    const Subscriptions = JXT.define({
        element: 'subscriptions',
        fields: {
            node: Utils.attribute('node')
        },
        name: 'subscriptions',
        namespace: PUBSUB_OWNER
    });
    const Affiliation = JXT.define({
        element: 'affiliation',
        fields: {
            jid: Utils.jidAttribute('jid'),
            type: Utils.attribute('affiliation')
        },
        name: 'affiliation',
        namespace: PUBSUB_OWNER
    });
    const Affiliations = JXT.define({
        element: 'affiliations',
        fields: {
            node: Utils.attribute('node')
        },
        name: 'affiliations',
        namespace: PUBSUB_OWNER
    });
    const Configure = JXT.define({
        element: 'configure',
        fields: {
            node: Utils.attribute('node')
        },
        name: 'config',
        namespace: PUBSUB_OWNER
    });
    const Default = JXT.define({
        element: 'default',
        name: 'default',
        namespace: PUBSUB_OWNER
    });
    JXT.extend(PubsubOwner, Configure);
    JXT.extend(PubsubOwner, Subscriptions);
    JXT.extend(PubsubOwner, Affiliations);
    JXT.extend(PubsubOwner, Default);
    JXT.extend(Subscriptions, Subscription, 'list');
    JXT.extend(Affiliations, Affiliation, 'list');
    JXT.extendIQ(PubsubOwner);
    JXT.withDataForm(function (DataForm) {
        JXT.extend(Configure, DataForm);
    });
}

function Push (JXT) {
    const Utils = JXT.utils;
    const Enable = JXT.define({
        element: 'enable',
        fields: {
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node')
        },
        name: 'enablePush',
        namespace: PUSH_0
    });
    const Disable = JXT.define({
        element: 'disable',
        fields: {
            jid: Utils.jidAttribute('jid'),
            node: Utils.attribute('node')
        },
        name: 'disablePush',
        namespace: PUSH_0
    });
    const Notification = JXT.define({
        element: 'notification',
        name: 'pushNotification',
        namespace: PUSH_0
    });
    JXT.withDataForm(DataForm => {
        JXT.extend(Notification, DataForm);
        JXT.extend(Enable, DataForm);
    });
    JXT.extendIQ(Enable);
    JXT.extendIQ(Disable);
}

function Reach (JXT) {
    const Utils = JXT.utils;
    const ReachURI = JXT.define({
        element: 'addr',
        fields: {
            $desc: {
                get: function () {
                    return Utils.getSubLangText(this.xml, REACH_0, 'desc', this.lang);
                }
            },
            desc: {
                get: function () {
                    const descs = this.$desc;
                    return descs[this.lang] || '';
                },
                set: function (value) {
                    Utils.setSubLangText(this.xml, REACH_0, 'desc', value, this.lang);
                }
            },
            uri: Utils.attribute('uri')
        },
        name: '_reachAddr',
        namespace: REACH_0
    });
    const reachability = {
        get: function () {
            const reach = Utils.find(this.xml, REACH_0, 'reach');
            const results = [];
            if (reach.length) {
                const addrs = Utils.find(reach[0], REACH_0, 'addr');
                for (const addr of addrs) {
                    results.push(new ReachURI({}, addr));
                }
            }
            return results;
        },
        set: function (value) {
            const reach = Utils.findOrCreate(this.xml, REACH_0, 'reach');
            Utils.setAttribute(reach, 'xmlns', REACH_0);
            for (const info of value) {
                const addr = new ReachURI(info);
                reach.appendChild(addr.xml);
            }
        }
    };
    JXT.withPubsubItem(function (Item) {
        JXT.add(Item, 'reach', reachability);
    });
    JXT.withPresence(function (Presence) {
        JXT.add(Presence, 'reach', reachability);
    });
}

function Register (JXT) {
    const Utils = JXT.utils;
    const Register = JXT.define({
        element: 'query',
        fields: {
            address: Utils.textSub(REGISTER, 'address'),
            city: Utils.textSub(REGISTER, 'city'),
            date: Utils.textSub(REGISTER, 'date'),
            email: Utils.textSub(REGISTER, 'email'),
            first: Utils.textSub(REGISTER, 'first'),
            instructions: Utils.textSub(REGISTER, 'instructions'),
            key: Utils.textSub(REGISTER, 'key'),
            last: Utils.textSub(REGISTER, 'last'),
            misc: Utils.textSub(REGISTER, 'misc'),
            name: Utils.textSub(REGISTER, 'name'),
            nick: Utils.textSub(REGISTER, 'nick'),
            password: Utils.textSub(REGISTER, 'password'),
            phone: Utils.textSub(REGISTER, 'phone'),
            registered: Utils.boolSub(REGISTER, 'registered'),
            remove: Utils.boolSub(REGISTER, 'remove'),
            state: Utils.textSub(REGISTER, 'state'),
            text: Utils.textSub(REGISTER, 'text'),
            url: Utils.textSub(REGISTER, 'url'),
            username: Utils.textSub(REGISTER, 'username'),
            zip: Utils.textSub(REGISTER, 'zip')
        },
        name: 'register',
        namespace: REGISTER
    });
    JXT.extendIQ(Register);
    JXT.withDefinition('x', OOB, function (OOB) {
        JXT.extend(Register, OOB);
    });
    JXT.withDataForm(function (DataForm) {
        JXT.extend(Register, DataForm);
    });
}

function References (JXT) {
    const Utils = JXT.utils;
    const Reference = JXT.define({
        element: 'reference',
        fields: {
            anchor: Utils.attribute('anchor'),
            begin: Utils.numberAttribute('begin'),
            end: Utils.numberAttribute('end'),
            type: Utils.attribute('type'),
            uri: Utils.attribute('uri')
        },
        name: 'reference',
        namespace: REFERENCE_0
    });
    const References = Utils.multiExtension(Reference);
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'references', References);
    });
}

function Roster (JXT) {
    const Utils = JXT.utils;
    const Roster = JXT.define({
        element: 'query',
        fields: {
            ver: {
                get: function () {
                    return Utils.getAttribute(this.xml, 'ver');
                },
                set: function (value) {
                    const force = value === '';
                    Utils.setAttribute(this.xml, 'ver', value, force);
                }
            }
        },
        name: 'roster',
        namespace: ROSTER
    });
    const RosterItem = JXT.define({
        element: 'item',
        fields: {
            groups: Utils.multiTextSub(ROSTER, 'group'),
            jid: Utils.jidAttribute('jid', true),
            name: Utils.attribute('name'),
            preApproved: Utils.boolAttribute(ROSTER, 'approved'),
            subscription: Utils.attribute('subscription', 'none'),
            subscriptionRequested: {
                get: function () {
                    const ask = Utils.getAttribute(this.xml, 'ask');
                    return ask === 'subscribe';
                }
            }
        },
        name: '_rosterItem',
        namespace: ROSTER
    });
    JXT.extend(Roster, RosterItem, 'items');
    JXT.extendIQ(Roster);
}

function RSM$1 (JXT) {
    const Utils = JXT.utils;
    JXT.define({
        element: 'set',
        fields: {
            after: Utils.textSub(RSM, 'after'),
            before: {
                get: function () {
                    return Utils.getSubText(this.xml, RSM, 'before');
                },
                set: function (value) {
                    if (value === true) {
                        Utils.findOrCreate(this.xml, RSM, 'before');
                    }
                    else {
                        Utils.setSubText(this.xml, RSM, 'before', value);
                    }
                }
            },
            count: Utils.numberSub(RSM, 'count', false, 0),
            first: Utils.textSub(RSM, 'first'),
            firstIndex: Utils.numberSubAttribute(RSM, 'first', 'index'),
            index: Utils.numberSub(RSM, 'index', false),
            last: Utils.textSub(RSM, 'last'),
            max: Utils.numberSub(RSM, 'max', false)
        },
        name: 'rsm',
        namespace: RSM
    });
}

function RTP (JXT) {
    const Utils = JXT.utils;
    const Feedback = {
        get: function () {
            let existing = Utils.find(this.xml, JINGLE_RTP_RTCP_FB_0, 'rtcp-fb');
            const result = [];
            for (const xml of existing) {
                result.push({
                    subtype: Utils.getAttribute(xml, 'subtype'),
                    type: Utils.getAttribute(xml, 'type')
                });
            }
            existing = Utils.find(this.xml, JINGLE_RTP_RTCP_FB_0, 'rtcp-fb-trr-int');
            for (const xml of existing) {
                result.push({
                    type: Utils.getAttribute(xml, 'type'),
                    value: Utils.getAttribute(xml, 'value')
                });
            }
            return result;
        },
        set: function (values) {
            const self = this;
            let existing = Utils.find(this.xml, JINGLE_RTP_RTCP_FB_0, 'rtcp-fb');
            for (const item of existing) {
                self.xml.removeChild(item);
            }
            existing = Utils.find(this.xml, JINGLE_RTP_RTCP_FB_0, 'rtcp-fb-trr-int');
            for (const item of existing) {
                self.xml.removeChild(item);
            }
            for (const value of values) {
                let fb;
                if (value.type === 'trr-int') {
                    fb = Utils.createElement(JINGLE_RTP_RTCP_FB_0, 'rtcp-fb-trr-int', JINGLE_RTP_1);
                    Utils.setAttribute(fb, 'type', value.type);
                    Utils.setAttribute(fb, 'value', value.value);
                }
                else {
                    fb = Utils.createElement(JINGLE_RTP_RTCP_FB_0, 'rtcp-fb', JINGLE_RTP_1);
                    Utils.setAttribute(fb, 'type', value.type);
                    Utils.setAttribute(fb, 'subtype', value.subtype);
                }
                self.xml.appendChild(fb);
            }
        }
    };
    const Bandwidth = JXT.define({
        element: 'bandwidth',
        fields: {
            bandwidth: Utils.text(),
            type: Utils.attribute('type')
        },
        name: 'bandwidth',
        namespace: JINGLE_RTP_1
    });
    const RTP = JXT.define({
        element: 'description',
        fields: {
            applicationType: {
                value: 'rtp',
                writable: true
            },
            encryption: {
                get: function () {
                    let enc = Utils.find(this.xml, JINGLE_RTP_1, 'encryption');
                    if (!enc.length) {
                        return [];
                    }
                    enc = enc[0];
                    const self = this;
                    const data = Utils.find(enc, JINGLE_RTP_1, 'crypto');
                    const results = [];
                    for (const xml of data) {
                        results.push(new Crypto({}, xml, self).toJSON());
                    }
                    return results;
                },
                set: function (values) {
                    let enc = Utils.find(this.xml, JINGLE_RTP_1, 'encryption');
                    if (enc.length) {
                        this.xml.removeChild(enc);
                    }
                    if (!values.length) {
                        return;
                    }
                    Utils.setBoolSubAttribute(this.xml, JINGLE_RTP_1, 'encryption', 'required', true);
                    enc = Utils.find(this.xml, JINGLE_RTP_1, 'encryption')[0];
                    const self = this;
                    for (const value of values) {
                        const content = new Crypto(value, null, self);
                        enc.appendChild(content.xml);
                    }
                }
            },
            feedback: Feedback,
            headerExtensions: {
                get: function () {
                    const existing = Utils.find(this.xml, JINGLE_RTP_HDREXT_0, 'rtp-hdrext');
                    const result = [];
                    for (const xml of existing) {
                        result.push({
                            id: Utils.getAttribute(xml, 'id'),
                            senders: Utils.getAttribute(xml, 'senders'),
                            uri: Utils.getAttribute(xml, 'uri')
                        });
                    }
                    return result;
                },
                set: function (values) {
                    const self = this;
                    const existing = Utils.find(this.xml, JINGLE_RTP_HDREXT_0, 'rtp-hdrext');
                    for (const item of existing) {
                        self.xml.removeChild(item);
                    }
                    for (const value of values) {
                        const hdr = Utils.createElement(JINGLE_RTP_HDREXT_0, 'rtp-hdrext', JINGLE_RTP_1);
                        Utils.setAttribute(hdr, 'id', value.id);
                        Utils.setAttribute(hdr, 'uri', value.uri);
                        Utils.setAttribute(hdr, 'senders', value.senders);
                        self.xml.appendChild(hdr);
                    }
                }
            },
            media: Utils.attribute('media'),
            mux: Utils.boolSub(JINGLE_RTP_1, 'rtcp-mux'),
            reducedSize: Utils.boolSub(JINGLE_RTP_1, 'rtcp-rsize'),
            ssrc: Utils.attribute('ssrc')
        },
        name: '_rtp',
        namespace: JINGLE_RTP_1,
        tags: ['jingle-application']
    });
    const PayloadType = JXT.define({
        element: 'payload-type',
        fields: {
            channels: Utils.attribute('channels'),
            clockrate: Utils.attribute('clockrate'),
            feedback: Feedback,
            id: Utils.attribute('id'),
            maxptime: Utils.attribute('maxptime'),
            name: Utils.attribute('name'),
            parameters: {
                get: function () {
                    const result = [];
                    const params = Utils.find(this.xml, JINGLE_RTP_1, 'parameter');
                    for (const param of params) {
                        result.push({
                            key: Utils.getAttribute(param, 'name'),
                            value: Utils.getAttribute(param, 'value')
                        });
                    }
                    return result;
                },
                set: function (values) {
                    const self = this;
                    for (const value of values) {
                        const param = Utils.createElement(JINGLE_RTP_1, 'parameter');
                        Utils.setAttribute(param, 'name', value.key);
                        Utils.setAttribute(param, 'value', value.value);
                        self.xml.appendChild(param);
                    }
                }
            },
            ptime: Utils.attribute('ptime')
        },
        name: '_payloadType',
        namespace: JINGLE_RTP_1
    });
    const Crypto = JXT.define({
        element: 'crypto',
        fields: {
            cipherSuite: Utils.attribute('crypto-suite'),
            keyParams: Utils.attribute('key-params'),
            sessionParams: Utils.attribute('session-params'),
            tag: Utils.attribute('tag')
        },
        name: 'crypto',
        namespace: JINGLE_RTP_1
    });
    const ContentGroup = JXT.define({
        element: 'group',
        fields: {
            contents: Utils.multiSubAttribute(JINGLE_GROUPING_0, 'content', 'name'),
            semantics: Utils.attribute('semantics')
        },
        name: '_group',
        namespace: JINGLE_GROUPING_0
    });
    const SourceGroup = JXT.define({
        element: 'ssrc-group',
        fields: {
            semantics: Utils.attribute('semantics'),
            sources: Utils.multiSubAttribute(JINGLE_RTP_SSMA_0, 'source', 'ssrc')
        },
        name: '_sourceGroup',
        namespace: JINGLE_RTP_SSMA_0
    });
    const Source = JXT.define({
        element: 'source',
        fields: {
            parameters: {
                get: function () {
                    const result = [];
                    const params = Utils.find(this.xml, JINGLE_RTP_SSMA_0, 'parameter');
                    for (const param of params) {
                        result.push({
                            key: Utils.getAttribute(param, 'name'),
                            value: Utils.getAttribute(param, 'value')
                        });
                    }
                    return result;
                },
                set: function (values) {
                    const self = this;
                    for (const value of values) {
                        const param = Utils.createElement(JINGLE_RTP_SSMA_0, 'parameter');
                        Utils.setAttribute(param, 'name', value.key);
                        Utils.setAttribute(param, 'value', value.value);
                        self.xml.appendChild(param);
                    }
                }
            },
            ssrc: Utils.attribute('ssrc')
        },
        name: '_source',
        namespace: JINGLE_RTP_SSMA_0
    });
    const Stream = JXT.define({
        element: 'stream',
        fields: {
            id: Utils.attribute('id'),
            track: Utils.attribute('track')
        },
        name: '_stream',
        namespace: 'urn:xmpp:jingle:apps:rtp:msid:0'
    });
    const Mute = JXT.define({
        element: 'mute',
        fields: {
            creator: Utils.attribute('creator'),
            name: Utils.attribute('name')
        },
        name: 'mute',
        namespace: JINGLE_RTP_INFO_1
    });
    const Unmute = JXT.define({
        element: 'unmute',
        fields: {
            creator: Utils.attribute('creator'),
            name: Utils.attribute('name')
        },
        name: 'unmute',
        namespace: JINGLE_RTP_INFO_1
    });
    JXT.extend(RTP, Bandwidth);
    JXT.extend(RTP, PayloadType, 'payloads');
    JXT.extend(RTP, Source, 'sources');
    JXT.extend(RTP, SourceGroup, 'sourceGroups');
    JXT.extend(RTP, Stream, 'streams');
    JXT.withDefinition('content', JINGLE_1, function (Content) {
        JXT.extend(Content, RTP);
    });
    JXT.withDefinition('jingle', JINGLE_1, function (Jingle) {
        JXT.extend(Jingle, Mute);
        JXT.extend(Jingle, Unmute);
        JXT.extend(Jingle, ContentGroup, 'groups');
        JXT.add(Jingle, 'ringing', Utils.boolSub(JINGLE_RTP_INFO_1, 'ringing'));
        JXT.add(Jingle, 'hold', Utils.boolSub(JINGLE_RTP_INFO_1, 'hold'));
        JXT.add(Jingle, 'active', Utils.boolSub(JINGLE_RTP_INFO_1, 'active'));
    });
}

const TYPE_MAP = {
    erase: 'e',
    insert: 't',
    wait: 'w'
};
const ACTION_MAP = {
    e: 'erase',
    t: 'insert',
    w: 'wait'
};
function RTT (JXT) {
    const Utils = JXT.utils;
    const RTT = JXT.define({
        element: 'rtt',
        fields: {
            actions: {
                get: function () {
                    const results = [];
                    for (let i = 0, len = this.xml.childNodes.length; i < len; i++) {
                        const child = this.xml.childNodes[i];
                        const name = child.localName;
                        const action = {};
                        if (child.namespaceURI !== RTT_0) {
                            continue;
                        }
                        if (ACTION_MAP[name]) {
                            action.type = ACTION_MAP[name];
                        }
                        else {
                            continue;
                        }
                        const pos = Utils.getAttribute(child, 'p');
                        if (pos) {
                            action.pos = parseInt(pos, 10);
                        }
                        const n = Utils.getAttribute(child, 'n');
                        if (n) {
                            action.num = parseInt(n, 10);
                        }
                        const t = Utils.getText(child);
                        if (t && name === 't') {
                            action.text = t;
                        }
                        results.push(action);
                    }
                    return results;
                },
                set: function (actions) {
                    const self = this;
                    for (let i = 0, len = this.xml.childNodes.length; i < len; i++) {
                        this.xml.removeChild(this.xml.childNodes[i]);
                    }
                    for (const action of actions) {
                        if (!TYPE_MAP[action.type]) {
                            return;
                        }
                        const child = Utils.createElement(RTT_0, TYPE_MAP[action.type], RTT_0);
                        if (action.pos !== undefined) {
                            Utils.setAttribute(child, 'p', action.pos.toString());
                        }
                        if (action.num) {
                            Utils.setAttribute(child, 'n', action.num.toString());
                        }
                        if (action.text) {
                            Utils.setText(child, action.text);
                        }
                        self.xml.appendChild(child);
                    }
                }
            },
            event: Utils.attribute('event', 'edit'),
            id: Utils.attribute('id'),
            seq: Utils.numberAttribute('seq')
        },
        name: 'rtt',
        namespace: RTT_0
    });
    JXT.extendMessage(RTT);
}

const CONDITIONS$5 = [
    'aborted',
    'account-disabled',
    'credentials-expired',
    'encryption-required',
    'incorrect-encoding',
    'invalid-authzid',
    'invalid-mechanism',
    'malformed-request',
    'mechanism-too-weak',
    'not-authorized',
    'temporary-auth-failure',
    'not-supported'
];
function SASL$1 (JXT) {
    const Utils = JXT.utils;
    const Mechanisms = JXT.define({
        element: 'mechanisms',
        fields: {
            mechanisms: Utils.multiTextSub(SASL, 'mechanism')
        },
        name: 'sasl',
        namespace: SASL
    });
    JXT.define({
        element: 'auth',
        eventName: 'sasl:auth',
        fields: {
            mechanism: Utils.attribute('mechanism'),
            value: Utils.text()
        },
        name: 'saslAuth',
        namespace: SASL,
        topLevel: true
    });
    JXT.define({
        element: 'challenge',
        eventName: 'sasl:challenge',
        fields: {
            value: Utils.text()
        },
        name: 'saslChallenge',
        namespace: SASL,
        topLevel: true
    });
    JXT.define({
        element: 'response',
        eventName: 'sasl:response',
        fields: {
            value: Utils.text()
        },
        name: 'saslResponse',
        namespace: SASL,
        topLevel: true
    });
    JXT.define({
        element: 'abort',
        eventName: 'sasl:abort',
        name: 'saslAbort',
        namespace: SASL,
        topLevel: true
    });
    JXT.define({
        element: 'success',
        eventName: 'sasl:success',
        fields: {
            value: Utils.text()
        },
        name: 'saslSuccess',
        namespace: SASL,
        topLevel: true
    });
    JXT.define({
        element: 'failure',
        eventName: 'sasl:failure',
        fields: {
            $text: {
                get: function () {
                    return Utils.getSubLangText(this.xml, SASL, 'text', this.lang);
                }
            },
            condition: Utils.enumSub(SASL, CONDITIONS$5),
            lang: {
                get: function () {
                    return this._lang || '';
                },
                set: function (value) {
                    this._lang = value;
                }
            },
            text: {
                get: function () {
                    const text = this.$text;
                    return text[this.lang] || '';
                },
                set: function (value) {
                    Utils.setSubLangText(this.xml, SASL, 'text', value, this.lang);
                }
            }
        },
        name: 'saslFailure',
        namespace: SASL,
        topLevel: true
    });
    JXT.extendStreamFeatures(Mechanisms);
}

function Session (JXT) {
    const Session = JXT.define({
        element: 'session',
        fields: {
            optional: JXT.utils.boolSub(SESSION, 'optional'),
            required: JXT.utils.boolSub(SESSION, 'required')
        },
        name: 'session',
        namespace: SESSION
    });
    JXT.extendIQ(Session);
    JXT.extendStreamFeatures(Session);
}

function Shim (JXT) {
    const Utils = JXT.utils;
    const SHIM$1 = {
        get: function () {
            const headerSet = Utils.find(this.xml, SHIM, 'headers');
            if (headerSet.length) {
                return Utils.getMultiSubText(headerSet[0], SHIM, 'header', function (header) {
                    const name = Utils.getAttribute(header, 'name');
                    if (name) {
                        return {
                            name: name,
                            value: Utils.getText(header)
                        };
                    }
                });
            }
            return [];
        },
        set: function (values) {
            const headerSet = Utils.findOrCreate(this.xml, SHIM, 'headers');
            JXT.setMultiSubText(headerSet, SHIM, 'header', values, function (val) {
                const header = Utils.createElement(SHIM, 'header', SHIM);
                Utils.setAttribute(header, 'name', val.name);
                Utils.setText(header, val.value);
                headerSet.appendChild(header);
            });
        }
    };
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'headers', SHIM$1);
    });
    JXT.withPresence(function (Presence) {
        JXT.add(Presence, 'headers', SHIM$1);
    });
}

function SM (JXT) {
    const Utils = JXT.utils;
    const SMFeature = JXT.define({
        element: 'sm',
        name: 'streamManagement',
        namespace: SMACKS_3
    });
    JXT.define({
        element: 'enable',
        eventName: 'stream:management:enable',
        fields: {
            resume: Utils.boolAttribute('resume')
        },
        name: 'smEnable',
        namespace: SMACKS_3,
        topLevel: true
    });
    JXT.define({
        element: 'enabled',
        eventName: 'stream:management:enabled',
        fields: {
            id: Utils.attribute('id'),
            resume: Utils.boolAttribute('resume')
        },
        name: 'smEnabled',
        namespace: SMACKS_3,
        topLevel: true
    });
    JXT.define({
        element: 'resume',
        eventName: 'stream:management:resume',
        fields: {
            h: Utils.numberAttribute('h', false, 0),
            previd: Utils.attribute('previd')
        },
        name: 'smResume',
        namespace: SMACKS_3,
        topLevel: true
    });
    JXT.define({
        element: 'resumed',
        eventName: 'stream:management:resumed',
        fields: {
            h: Utils.numberAttribute('h', false, 0),
            previd: Utils.attribute('previd')
        },
        name: 'smResumed',
        namespace: SMACKS_3,
        topLevel: true
    });
    JXT.define({
        element: 'failed',
        eventName: 'stream:management:failed',
        name: 'smFailed',
        namespace: SMACKS_3,
        topLevel: true
    });
    JXT.define({
        element: 'a',
        eventName: 'stream:management:ack',
        fields: {
            h: Utils.numberAttribute('h', false, 0)
        },
        name: 'smAck',
        namespace: SMACKS_3,
        topLevel: true
    });
    JXT.define({
        element: 'r',
        eventName: 'stream:management:request',
        name: 'smRequest',
        namespace: SMACKS_3,
        topLevel: true
    });
    JXT.extendStreamFeatures(SMFeature);
}

function Stream (JXT) {
    const Utils = JXT.utils;
    JXT.define({
        element: 'stream',
        fields: {
            from: Utils.jidAttribute('from', true),
            id: Utils.attribute('id'),
            lang: Utils.langAttribute(),
            to: Utils.jidAttribute('to', true),
            version: Utils.attribute('version', '1.0')
        },
        name: 'stream',
        namespace: STREAM
    });
}

const CONDITIONS$6 = [
    'bad-format',
    'bad-namespace-prefix',
    'conflict',
    'connection-timeout',
    'host-gone',
    'host-unknown',
    'improper-addressing',
    'internal-server-error',
    'invalid-from',
    'invalid-namespace',
    'invalid-xml',
    'not-authorized',
    'not-well-formed',
    'policy-violation',
    'remote-connection-failed',
    'reset',
    'resource-constraint',
    'restricted-xml',
    'see-other-host',
    'system-shutdown',
    'undefined-condition',
    'unsupported-encoding',
    'unsupported-feature',
    'unsupported-stanza-type',
    'unsupported-version'
];
function StreamError (JXT) {
    const Utils = JXT.utils;
    JXT.define({
        element: 'error',
        fields: {
            $text: {
                get: function () {
                    return Utils.getSubLangText(this.xml, STREAM_ERROR, 'text', this.lang);
                }
            },
            condition: Utils.enumSub(STREAM_ERROR, CONDITIONS$6),
            lang: {
                get: function () {
                    return this._lang || '';
                },
                set: function (value) {
                    this._lang = value;
                }
            },
            seeOtherHost: {
                get: function () {
                    return Utils.getSubText(this.xml, STREAM_ERROR, 'see-other-host');
                },
                set: function (value) {
                    this.condition = 'see-other-host';
                    Utils.setSubText(this.xml, STREAM_ERROR, 'see-other-host', value);
                }
            },
            text: {
                get: function () {
                    const text = this.$text;
                    return text[this.lang] || '';
                },
                set: function (value) {
                    Utils.setSubLangText(this.xml, STREAM_ERROR, 'text', value, this.lang);
                }
            }
        },
        name: 'streamError',
        namespace: STREAM,
        topLevel: true
    });
}

function StreamFeatures (JXT) {
    JXT.define({
        element: 'features',
        name: 'streamFeatures',
        namespace: STREAM,
        topLevel: true
    });
    const RosterVerFeature = JXT.define({
        element: 'ver',
        name: 'rosterVersioning',
        namespace: ROSTER_VERSIONING
    });
    const SubscriptionPreApprovalFeature = JXT.define({
        element: 'sub',
        name: 'subscriptionPreApproval',
        namespace: SUBSCRIPTION_PREAPPROVAL
    });
    JXT.extendStreamFeatures(RosterVerFeature);
    JXT.extendStreamFeatures(SubscriptionPreApprovalFeature);
}

function Time (JXT) {
    const EntityTime = JXT.define({
        element: 'time',
        fields: {
            tzo: JXT.utils.tzoSub(TIME, 'tzo', 0),
            utc: JXT.utils.dateSub(TIME, 'utc')
        },
        name: 'time',
        namespace: TIME
    });
    JXT.extendIQ(EntityTime);
}

function Tune (JXT) {
    const Utils = JXT.utils;
    const Tune = JXT.define({
        element: 'tune',
        fields: {
            artist: Utils.textSub(TUNE, 'artist'),
            length: Utils.numberSub(TUNE, 'length'),
            rating: Utils.numberSub(TUNE, 'rating'),
            source: Utils.textSub(TUNE, 'source'),
            title: Utils.textSub(TUNE, 'title'),
            track: Utils.textSub(TUNE, 'track'),
            uri: Utils.textSub(TUNE, 'uri')
        },
        name: 'tune',
        namespace: TUNE
    });
    JXT.extendPubsubItem(Tune);
    JXT.extendMessage(Tune);
}

function Upload (JXT) {
    const Utils = JXT.utils;
    const Request = JXT.define({
        element: 'request',
        fields: {
            filename: Utils.attribute('filename'),
            size: Utils.numberAttribute('size'),
            type: Utils.attribute('content-type')
        },
        name: 'uploadRequest',
        namespace: HTTP_UPLOAD_0
    });
    const Slot = JXT.define({
        element: 'slot',
        name: 'uploadSlots',
        namespace: HTTP_UPLOAD_0
    });
    const Put = JXT.define({
        element: 'put',
        fields: {
            url: Utils.attribute('url')
        },
        name: 'put',
        namespace: HTTP_UPLOAD_0
    });
    const Header = JXT.define({
        element: 'header',
        fields: {
            name: Utils.attribute('name'),
            value: Utils.text()
        },
        name: '_header',
        namespace: HTTP_UPLOAD_0
    });
    const Get = JXT.define({
        element: 'get',
        fields: {
            url: Utils.attribute('url')
        },
        name: 'get',
        namespace: HTTP_UPLOAD_0
    });
    JXT.extend(Put, Header, 'headers');
    JXT.extend(Slot, Put);
    JXT.extend(Slot, Get);
    JXT.extendIQ(Slot);
    JXT.extendIQ(Request);
}

function VCardTemp (JXT) {
    const Utils = JXT.utils;
    const VCardTemp = JXT.define({
        element: 'vCard',
        fields: {
            birthday: Utils.dateSub(VCARD_TEMP, 'BDAY'),
            description: Utils.textSub(VCARD_TEMP, 'DESC'),
            fullName: Utils.textSub(VCARD_TEMP, 'FN'),
            jids: Utils.multiTextSub(VCARD_TEMP, 'JABBERID'),
            nicknames: Utils.multiTextSub(VCARD_TEMP, 'NICKNAME'),
            role: Utils.textSub(VCARD_TEMP, 'ROLE'),
            title: Utils.textSub(VCARD_TEMP, 'TITLE'),
            website: Utils.textSub(VCARD_TEMP, 'URL')
        },
        name: 'vCardTemp',
        namespace: VCARD_TEMP
    });
    const Email = JXT.define({
        element: 'EMAIL',
        fields: {
            email: Utils.textSub(VCARD_TEMP, 'USERID'),
            home: Utils.boolSub(VCARD_TEMP, 'HOME'),
            preferred: Utils.boolSub(VCARD_TEMP, 'PREF'),
            work: Utils.boolSub(VCARD_TEMP, 'WORK')
        },
        name: '_email',
        namespace: VCARD_TEMP
    });
    const PhoneNumber = JXT.define({
        element: 'TEL',
        fields: {
            home: Utils.boolSub(VCARD_TEMP, 'HOME'),
            mobile: Utils.boolSub(VCARD_TEMP, 'CELL'),
            number: Utils.textSub(VCARD_TEMP, 'NUMBER'),
            preferred: Utils.boolSub(VCARD_TEMP, 'PREF'),
            work: Utils.boolSub(VCARD_TEMP, 'WORK')
        },
        name: '_tel',
        namespace: VCARD_TEMP
    });
    const Address = JXT.define({
        element: 'ADR',
        fields: {
            city: Utils.textSub(VCARD_TEMP, 'LOCALITY'),
            country: Utils.textSub(VCARD_TEMP, 'CTRY'),
            home: Utils.boolSub(VCARD_TEMP, 'HOME'),
            pobox: Utils.textSub(VCARD_TEMP, 'POBOX'),
            postalCode: Utils.textSub(VCARD_TEMP, 'PCODE'),
            preferred: Utils.boolSub(VCARD_TEMP, 'PREF'),
            region: Utils.textSub(VCARD_TEMP, 'REGION'),
            street: Utils.textSub(VCARD_TEMP, 'STREET'),
            street2: Utils.textSub(VCARD_TEMP, 'EXTADD'),
            work: Utils.boolSub(VCARD_TEMP, 'WORK')
        },
        name: '_address',
        namespace: VCARD_TEMP
    });
    const Organization = JXT.define({
        element: 'ORG',
        fields: {
            name: Utils.textSub(VCARD_TEMP, 'ORGNAME'),
            unit: Utils.textSub(VCARD_TEMP, 'ORGUNIT')
        },
        name: 'organization',
        namespace: VCARD_TEMP
    });
    const Name = JXT.define({
        element: 'N',
        fields: {
            family: Utils.textSub(VCARD_TEMP, 'FAMILY'),
            given: Utils.textSub(VCARD_TEMP, 'GIVEN'),
            middle: Utils.textSub(VCARD_TEMP, 'MIDDLE'),
            prefix: Utils.textSub(VCARD_TEMP, 'PREFIX'),
            suffix: Utils.textSub(VCARD_TEMP, 'SUFFIX')
        },
        name: 'name',
        namespace: VCARD_TEMP
    });
    const Photo = JXT.define({
        element: 'PHOTO',
        fields: {
            data: Utils.textSub(VCARD_TEMP, 'BINVAL'),
            type: Utils.textSub(VCARD_TEMP, 'TYPE'),
            url: Utils.textSub(VCARD_TEMP, 'EXTVAL')
        },
        name: 'photo',
        namespace: VCARD_TEMP
    });
    JXT.extend(VCardTemp, Email, 'emails');
    JXT.extend(VCardTemp, Address, 'addresses');
    JXT.extend(VCardTemp, PhoneNumber, 'phoneNumbers');
    JXT.extend(VCardTemp, Organization);
    JXT.extend(VCardTemp, Name);
    JXT.extend(VCardTemp, Photo);
    JXT.extendIQ(VCardTemp);
}

function Version (JXT) {
    const Version = JXT.define({
        element: 'query',
        fields: {
            name: JXT.utils.textSub(VERSION, 'name'),
            os: JXT.utils.textSub(VERSION, 'os'),
            version: JXT.utils.textSub(VERSION, 'version')
        },
        name: 'version',
        namespace: VERSION
    });
    JXT.extendIQ(Version);
}

function Visibility (JXT) {
    JXT.withIQ(function (IQ) {
        JXT.add(IQ, 'visible', JXT.utils.boolSub(INVISIBLE_0, 'visible'));
        JXT.add(IQ, 'invisible', JXT.utils.boolSub(INVISIBLE_0, 'invisible'));
    });
}

function XRD$1 (JXT) {
    const Utils = JXT.utils;
    const Properties = {
        get: function () {
            const results = {};
            const props = Utils.find(this.xml, XRD, 'Property');
            for (let i = 0, len = props.length; i < len; i++) {
                const property = props[i];
                const type = Utils.getAttribute(property, 'type');
                results[type] = property.textContent;
            }
            return results;
        }
    };
    const XRD$1 = JXT.define({
        element: 'XRD',
        fields: {
            aliases: Utils.multiSubText(XRD, 'Alias'),
            expires: Utils.dateSub(XRD, 'Expires'),
            properties: Properties,
            subject: Utils.subText(XRD, 'Subject')
        },
        name: 'xrd',
        namespace: XRD
    });
    const Link = JXT.define({
        element: 'Link',
        fields: {
            href: Utils.attribute('href'),
            properties: Properties,
            rel: Utils.attribute('rel'),
            template: Utils.attribute('template'),
            titles: Utils.subLangText(XRD, 'Title', 'default'),
            type: Utils.attribute('type')
        },
        name: '_xrdlink',
        namespace: XRD
    });
    JXT.extend(XRD$1, Link, 'links');
}

const VERSION$1 = {
    client: CLIENT,
    component: COMPONENT,
    server: SERVER
};
function XMPPShortcuts (JXT) {
    // ----------------------------------------------------------------
    // Shortcuts for common extension calls
    // ----------------------------------------------------------------
    JXT.extendMessage = function (JXTClass, multiName) {
        this.withMessage(Message => {
            this.extend(Message, JXTClass, multiName);
        });
    };
    JXT.extendPresence = function (JXTClass, multiName) {
        this.withPresence(Presence => {
            this.extend(Presence, JXTClass, multiName);
        });
    };
    JXT.extendIQ = function (JXTClass, multiName) {
        this.withIQ(IQ => {
            this.extend(IQ, JXTClass, multiName);
        });
    };
    JXT.extendStreamFeatures = function (JXTClass) {
        this.withStreamFeatures(StreamFeatures => {
            this.extend(StreamFeatures, JXTClass);
        });
    };
    JXT.extendPubsubItem = function (JXTClass) {
        this.withPubsubItem(PubsubItem => {
            this.extend(PubsubItem, JXTClass);
        });
    };
    // ----------------------------------------------------------------
    // Shortcuts for common withDefinition calls
    // ----------------------------------------------------------------
    JXT.withIQ = function (cb) {
        this.withDefinition('iq', CLIENT, cb);
        this.withDefinition('iq', COMPONENT, cb);
    };
    JXT.withMessage = function (cb) {
        this.withDefinition('message', CLIENT, cb);
        this.withDefinition('message', COMPONENT, cb);
    };
    JXT.withPresence = function (cb) {
        this.withDefinition('presence', CLIENT, cb);
        this.withDefinition('presence', COMPONENT, cb);
    };
    JXT.withStreamFeatures = function (cb) {
        this.withDefinition('features', STREAM, cb);
    };
    JXT.withStanzaError = function (cb) {
        this.withDefinition('error', CLIENT, cb);
        this.withDefinition('error', COMPONENT, cb);
    };
    JXT.withDataForm = function (cb) {
        this.withDefinition('x', DATAFORM, cb);
    };
    JXT.withPubsubItem = function (cb) {
        this.withDefinition('item', PUBSUB, cb);
        this.withDefinition('item', PUBSUB_EVENT, cb);
    };
    // ----------------------------------------------------------------
    // Shortcuts for common getDefinition calls
    // ----------------------------------------------------------------
    JXT.getMessage = function (version = 'client') {
        return this.getDefinition('message', VERSION$1[version]);
    };
    JXT.getPresence = function (version = 'client') {
        return this.getDefinition('presence', VERSION$1[version]);
    };
    JXT.getIQ = function (version = 'client') {
        return this.getDefinition('iq', VERSION$1[version]);
    };
    JXT.getStreamError = function () {
        return this.getDefinition('error', STREAM);
    };
    // For backward compatibility
    JXT.getIq = JXT.getIQ;
    JXT.withIq = JXT.withIQ;
}

function XMPPTypes (JXT) {
    const Utils = JXT.utils;
    Utils.jidAttribute = function (attr, prepped) {
        return {
            get: function () {
                const jid = new JID(Utils.getAttribute(this.xml, attr));
                if (prepped) {
                    jid.prepped = true;
                }
                return jid;
            },
            set: function (value) {
                Utils.setAttribute(this.xml, attr, (value || '').toString());
            }
        };
    };
    Utils.jidSub = function (NS, sub, prepped) {
        return {
            get: function () {
                const jid = new JID(Utils.getSubText(this.xml, NS, sub));
                if (prepped) {
                    jid.prepped = true;
                }
                return jid;
            },
            set: function (value) {
                Utils.setSubText(this.xml, NS, sub, (value || '').toString());
            }
        };
    };
    Utils.tzoSub = Utils.field(function (xml, NS, sub, defaultVal) {
        let sign = -1;
        let formatted = Utils.getSubText(xml, NS, sub);
        if (!formatted) {
            return defaultVal;
        }
        if (formatted.charAt(0) === '-') {
            sign = 1;
            formatted = formatted.slice(1);
        }
        const split = formatted.split(':');
        const hrs = parseInt(split[0], 10);
        const min = parseInt(split[1], 10);
        return (hrs * 60 + min) * sign;
    }, function (xml, NS, sub, value) {
        let hrs;
        let min;
        let formatted = '-';
        if (typeof value === 'number') {
            if (value < 0) {
                value = -value;
                formatted = '+';
            }
            hrs = value / 60;
            min = value % 60;
            formatted += (hrs < 10 ? '0' : '') + hrs + ':' + (min < 10 ? '0' : '') + min;
        }
        else {
            formatted = value;
        }
        Utils.setSubText(xml, NS, sub, formatted);
    });
}

function Protocol (JXT) {
    JXT.use(XMPPTypes);
    JXT.use(XMPPShortcuts);
    JXT.use(Addresses);
    JXT.use(Avatar);
    JXT.use(Bind);
    JXT.use(Blocking);
    JXT.use(BOB$1);
    JXT.use(Bookmarks);
    JXT.use(BOSH$1);
    JXT.use(Carbons);
    JXT.use(Command);
    JXT.use(CSI$1);
    JXT.use(Dataforms);
    JXT.use(Delayed);
    JXT.use(Disco);
    JXT.use(StanzaError);
    JXT.use(EME);
    JXT.use(ExtDisco);
    JXT.use(File);
    JXT.use(File3);
    JXT.use(Forwarded);
    JXT.use(Framing);
    JXT.use(GeoLoc);
    JXT.use(Hash);
    JXT.use(Hats);
    JXT.use(Hints);
    JXT.use(UDP);
    JXT.use(IBB$1);
    JXT.use(IQ);
    JXT.use(JIDPrep);
    JXT.use(Jingle);
    JXT.use(JSONData);
    JXT.use(Eventlog);
    JXT.use(MAM);
    JXT.use(Markers);
    JXT.use(Message);
    JXT.use(Mood);
    JXT.use(MUC$1);
    JXT.use(Nick);
    JXT.use(OMEMO);
    JXT.use(OOB$1);
    JXT.use(Ping);
    JXT.use(Presence);
    JXT.use(Private);
    JXT.use(PSA$1);
    JXT.use(Pubsub);
    JXT.use(PubsubError);
    JXT.use(PubsubEvents);
    JXT.use(PubsubOwner);
    JXT.use(Push);
    JXT.use(Reach);
    JXT.use(Register);
    JXT.use(References);
    JXT.use(Roster);
    JXT.use(RSM$1);
    JXT.use(RTP);
    JXT.use(RTT);
    JXT.use(SASL$1);
    JXT.use(Session);
    JXT.use(Shim);
    JXT.use(SM);
    JXT.use(Stream);
    JXT.use(StreamError);
    JXT.use(StreamFeatures);
    JXT.use(Time);
    JXT.use(Tune);
    JXT.use(Upload);
    JXT.use(VCardTemp);
    JXT.use(Version);
    JXT.use(Visibility);
    JXT.use(XRD$1);
}

const MAX_SEQ = Math.pow(2, 32);
const mod = (v, n) => ((v % n) + n) % n;
class StreamManagement {
    constructor(client) {
        this.client = client;
        this.id = false;
        this.allowResume = true;
        this.started = false;
        this.inboundStarted = false;
        this.outboundStarted = false;
        this.lastAck = 0;
        this.handled = 0;
        this.windowSize = 1;
        this.unacked = [];
        this.pendingAck = false;
        this.cacheHandler = () => {
            return;
        };
        this.stanzas = {
            Ack: client.stanzas.getDefinition('a', SMACKS_3),
            Enable: client.stanzas.getDefinition('enable', SMACKS_3),
            IQ: client.stanzas.getIQ(),
            Message: client.stanzas.getMessage(),
            Presence: client.stanzas.getPresence(),
            Request: client.stanzas.getDefinition('r', SMACKS_3),
            Resume: client.stanzas.getDefinition('resume', SMACKS_3)
        };
    }
    get started() {
        return this.outboundStarted && this.inboundStarted;
    }
    set started(value) {
        if (!value) {
            this.outboundStarted = false;
            this.inboundStarted = false;
        }
    }
    load(opts) {
        this.id = opts.id;
        this.allowResume = true;
        this.handled = opts.handled;
        this.lastAck = opts.lastAck;
        this.unacked = opts.unacked;
    }
    cache(handler) {
        this.cacheHandler = handler;
    }
    enable() {
        const enable = new this.stanzas.Enable();
        enable.resume = this.allowResume;
        this.client.send(enable);
        this.handled = 0;
        this.outboundStarted = true;
    }
    resume() {
        const resume = new this.stanzas.Resume({
            h: this.handled,
            previd: this.id
        });
        this.client.send(resume);
        this.outboundStarted = true;
    }
    enabled(resp) {
        this.id = resp.id;
        this.handled = 0;
        this.inboundStarted = true;
        this._cache();
    }
    resumed(resp) {
        this.id = resp.previd;
        if (resp.h) {
            this.process(resp, true);
        }
        this.inboundStarted = true;
        this._cache();
    }
    failed(resp) {
        // Resumption might fail, but the server can still tell us how far
        // the old session progressed.
        if (resp.h) {
            this.process(resp);
        }
        // We alert that any remaining unacked stanzas failed to send. It has
        // been too long for auto-retrying these to be the right thing to do.
        for (const [kind, stanza] of this.unacked) {
            this.client.emit('stanza:failed', stanza, kind);
        }
        this.inboundStarted = false;
        this.outboundStarted = false;
        this.id = false;
        this.lastAck = 0;
        this.handled = 0;
        this.unacked = [];
        this._cache();
    }
    ack() {
        this.client.send(new this.stanzas.Ack({
            h: this.handled
        }));
    }
    request() {
        this.pendingAck = true;
        this.client.send(new this.stanzas.Request());
    }
    process(ack, resend) {
        const self = this;
        const numAcked = mod(ack.h - this.lastAck, MAX_SEQ);
        this.pendingAck = false;
        for (let i = 0; i < numAcked && this.unacked.length > 0; i++) {
            const [kind, stanza] = this.unacked.shift();
            this.client.emit('stanza:acked', stanza, kind);
        }
        this.lastAck = ack.h;
        if (resend) {
            const resendUnacked = this.unacked;
            this.unacked = [];
            for (const [kind, stanza] of resendUnacked) {
                let rebuilt;
                if (kind === 'message') {
                    rebuilt = new this.stanzas.Message(stanza);
                }
                if (kind === 'presence') {
                    rebuilt = new this.stanzas.Presence(stanza);
                }
                if (kind === 'iq') {
                    rebuilt = new this.stanzas.IQ(stanza);
                }
                self.client.send(rebuilt);
            }
        }
        this._cache();
        if (this.needAck()) {
            this.request();
        }
    }
    track(kind, stanza) {
        const acceptable = {
            iq: true,
            message: true,
            presence: true
        };
        if (this.outboundStarted && acceptable[kind]) {
            this.unacked.push([kind, stanza.toJSON()]);
            this._cache();
            if (this.needAck()) {
                this.request();
            }
        }
    }
    handle() {
        if (this.inboundStarted) {
            this.handled = mod(this.handled + 1, MAX_SEQ);
            this._cache();
        }
    }
    needAck() {
        return !this.pendingAck && this.unacked.length >= this.windowSize;
    }
    _cache() {
        this.cacheHandler({
            handled: this.handled,
            id: this.id,
            lastAck: this.lastAck,
            unacked: this.unacked
        });
    }
}

class WildEmitter {
    constructor() {
        this.isWildEmitter = true;
        this.callbacks = {};
    }
    on(event, groupNameOrHandler, handler) {
        const hasGroup = arguments.length === 3;
        const group = hasGroup ? arguments[1] : undefined;
        const func = hasGroup ? arguments[2] : arguments[1];
        func._groupName = group;
        (this.callbacks[event] = this.callbacks[event] || []).push(func);
        return this;
    }
    once(event, groupNameOrHandler, handler) {
        const hasGroup = arguments.length === 3;
        const group = hasGroup ? arguments[1] : undefined;
        const func = hasGroup ? arguments[2] : arguments[1];
        const on = () => {
            this.off(event, on);
            func.apply(this, arguments);
        };
        this.on(event, group, on);
        return this;
    }
    releaseGroup(groupName) {
        this.callbacks = this.callbacks || {};
        for (const item of Object.keys(this.callbacks)) {
            const handlers = this.callbacks[item];
            for (let i = 0, len = handlers.length; i < len; i++) {
                if (handlers[i]._groupName === groupName) {
                    // remove it and shorten the array we're looping through
                    handlers.splice(i, 1);
                    i--;
                    len--;
                }
            }
        }
        return this;
    }
    off(event, fn) {
        this.callbacks = this.callbacks || {};
        const callbacks = this.callbacks[event];
        if (!callbacks) {
            return this;
        }
        // remove all handlers
        if (!fn) {
            delete this.callbacks[event];
            return this;
        }
        // remove specific handler
        const i = callbacks.indexOf(fn);
        callbacks.splice(i, 1);
        if (callbacks.length === 0) {
            delete this.callbacks[event];
        }
        return this;
    }
    emit(event, ...data) {
        this.callbacks = this.callbacks || {};
        const args = [].slice.call(arguments, 1);
        const callbacks = this.callbacks[event];
        const specialCallbacks = this.getWildcardCallbacks(event);
        if (callbacks) {
            const listeners = callbacks.slice();
            for (let i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, args);
            }
        }
        if (specialCallbacks) {
            const listeners = specialCallbacks.slice();
            for (let i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, [event].concat(args));
            }
        }
        return this;
    }
    getWildcardCallbacks(eventName) {
        this.callbacks = this.callbacks || {};
        let result = [];
        for (const item of Object.keys(this.callbacks)) {
            const split = item.split('*');
            if (item === '*' ||
                (split.length === 2 && eventName.slice(0, split[0].length) === split[0])) {
                result = result.concat(this.callbacks[item]);
            }
        }
        return result;
    }
}

// tslint:disable no-bitwise
const bth = [];
for (let i = 0; i < 256; ++i) {
    bth[i] = (i + 0x100).toString(16).substr(1);
}
function timeoutPromise(target, delay, rejectValue = () => undefined) {
    return __awaiter(this, void 0, void 0, function* () {
        let timeoutRef;
        const result = yield Promise.race([
            target,
            new Promise((resolve, reject) => {
                timeoutRef = setTimeout(() => reject(rejectValue()), delay);
            })
        ]);
        if (timeoutRef) {
            clearTimeout(timeoutRef);
        }
        return result;
    });
}
function octetCompare(str1, str2) {
    const b1 = typeof str1 === 'string' ? Buffer.from(str1, 'utf8') : str1;
    const b2 = typeof str2 === 'string' ? Buffer.from(str2, 'utf8') : str2;
    return b1.compare(b2);
}
function uuid() {
    const buf = randomBytes(16);
    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    let i = 0;
    return [
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i++]],
        '-',
        bth[buf[i++]],
        bth[buf[i++]],
        '-',
        bth[buf[i++]],
        bth[buf[i++]],
        '-',
        bth[buf[i++]],
        bth[buf[i++]],
        '-',
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i]]
    ].join('');
}

function promiseAny(promises) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const errors = yield Promise.all(promises.map(p => {
                return p.then(val => Promise.reject(val), err => Promise.resolve(err));
            }));
            return Promise.reject(errors);
        }
        catch (val) {
            return Promise.resolve(val);
        }
    });
}
function getHostMeta(JXT, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof opts === 'string') {
            opts = { host: opts };
        }
        const config = Object.assign({ json: true, ssl: true, xrd: true }, opts);
        const scheme = config.ssl ? 'https://' : 'http://';
        return promiseAny([
            fetch(`${scheme}${config.host}/.well-known/host-meta.json`).then((res) => __awaiter(this, void 0, void 0, function* () {
                if (!res.ok) {
                    throw new Error('could-not-fetch-json');
                }
                return res.json();
            })),
            fetch(`${scheme}${config.host}/.well-known/host-meta`).then((res) => __awaiter(this, void 0, void 0, function* () {
                if (!res.ok) {
                    throw new Error('could-not-fetch-xml');
                }
                const data = yield res.text();
                return JXT.parse(data);
            }))
        ]);
    });
}
function HostMeta (client, stanzas) {
    client.discoverBindings = function (server, cb) {
        getHostMeta(stanzas, server)
            .then(data => {
            const results = {
                bosh: [],
                websocket: []
            };
            const links = data.links || [];
            for (const link of links) {
                if (link.href && link.rel === ALT_CONNECTIONS_WEBSOCKET) {
                    results.websocket.push(link.href);
                }
                if (link.href && link.rel === ALT_CONNECTIONS_XBOSH) {
                    results.bosh.push(link.href);
                }
            }
            cb(null, results);
        })
            .catch(err => {
            cb(err, []);
        });
    };
}

function Features (client) {
    client.features = {
        handlers: {},
        negotiated: {},
        order: []
    };
    client.registerFeature = function (name, priority, handler) {
        this.features.order.push({
            name,
            priority
        });
        this.features.order.sort((a, b) => a.priority - b.priority);
        this.features.handlers[name] = handler.bind(client);
    };
    client.on('streamFeatures', function (features) {
        return __awaiter(this, void 0, void 0, function* () {
            const series = [];
            const negotiated = client.features.negotiated;
            const handlers = client.features.handlers;
            for (const feature of client.features.order) {
                const name = feature.name;
                if (features[name] && handlers[name] && !negotiated[name]) {
                    series.push(() => new Promise(resolve => {
                        if (!negotiated[name]) {
                            handlers[name](features, (cmd, msg) => {
                                if (cmd) {
                                    resolve({ command: cmd, message: msg });
                                }
                                else {
                                    resolve();
                                }
                            });
                        }
                        else {
                            resolve();
                        }
                    }));
                }
            }
            for (const handler of series) {
                let cmd = '';
                let msg = '';
                try {
                    const res = yield handler();
                    if (res) {
                        cmd = res.command;
                        msg = res.message;
                    }
                }
                catch (err) {
                    cmd = 'disconnect';
                    msg = err.message;
                    console.error(err);
                }
                if (!cmd) {
                    continue;
                }
                if (cmd === 'restart') {
                    client.transport.restart();
                }
                if (cmd === 'disconnect') {
                    client.emit('stream:error', {
                        condition: 'policy-violation',
                        text: 'Failed to negotiate stream features: ' + msg
                    });
                    client.disconnect();
                }
                return;
            }
        });
    });
}

const NS = 'urn:ietf:params:xml:ns:xmpp-sasl';
function SASLPlugin (client, stanzas) {
    const Auth = stanzas.getDefinition('auth', NS);
    const Response = stanzas.getDefinition('response', NS);
    const Abort = stanzas.getDefinition('abort', NS);
    client.registerFeature('sasl', 100, function (features, cb) {
        const self = this;
        const mech = self.SASLFactory.create(features.sasl.mechanisms);
        if (!mech) {
            self.releaseGroup('sasl');
            self.emit('auth:failed');
            return cb('disconnect', 'authentication failed');
        }
        self.on('sasl:success', 'sasl', function () {
            self.features.negotiated.sasl = true;
            self.releaseGroup('sasl');
            self.emit('auth:success', self.config.credentials);
            cb('restart');
        });
        self.on('sasl:challenge', 'sasl', function (challenge) {
            mech.challenge(Buffer.from(challenge.value, 'base64').toString());
            return self.getCredentials(function (err, credentials) {
                if (err) {
                    return self.send(new Abort());
                }
                const resp = mech.response(credentials);
                if (resp || resp === '') {
                    self.send(new Response({
                        value: Buffer.from(resp).toString('base64')
                    }));
                }
                else {
                    self.send(new Response());
                }
                if (mech.cache) {
                    for (const key of Object.keys(mech.cache)) {
                        if (!mech.cache[key]) {
                            return;
                        }
                        self.config.credentials[key] = Buffer.from(mech.cache[key]);
                    }
                    self.emit('credentials:update', self.config.credentials);
                }
            });
        });
        self.on('sasl:failure', 'sasl', function () {
            self.releaseGroup('sasl');
            self.emit('auth:failed');
            cb('disconnect', 'authentication failed');
        });
        self.on('sasl:abort', 'sasl', function () {
            self.releaseGroup('sasl');
            self.emit('auth:failed');
            cb('disconnect', 'authentication failed');
        });
        const auth = {
            mechanism: mech.name
        };
        if (mech.clientFirst) {
            return self.getCredentials(function (err, credentials) {
                if (err) {
                    return self.send(new Abort());
                }
                auth.value = Buffer.from(mech.response(credentials)).toString('base64');
                self.send(new Auth(auth));
            });
        }
        self.send(new Auth(auth));
    });
    client.on('disconnected', function () {
        client.features.negotiated.sasl = false;
        client.releaseGroup('sasl');
    });
}

function Smacks (client, stanzas, config) {
    const smacks = function (features, cb) {
        const self = this;
        if (!config.useStreamManagement) {
            return cb();
        }
        self.on('stream:management:enabled', 'sm', function (enabled) {
            self.sm.enabled(enabled);
            self.features.negotiated.streamManagement = true;
            self.releaseGroup('sm');
            cb();
        });
        self.on('stream:management:resumed', 'sm', function (resumed) {
            self.sm.resumed(resumed);
            self.features.negotiated.streamManagement = true;
            self.features.negotiated.bind = true;
            self.sessionStarted = true;
            self.releaseGroup('sm');
            cb('break'); // Halt further processing of stream features
        });
        self.on('stream:management:failed', 'sm', function (failed) {
            self.sm.failed(failed);
            self.emit('session:end');
            self.releaseGroup('session');
            self.releaseGroup('sm');
            cb();
        });
        if (!self.sm.id) {
            if (self.features.negotiated.bind) {
                self.sm.enable();
            }
            else {
                self.releaseGroup('sm');
                cb();
            }
        }
        else if (self.sm.id && self.sm.allowResume) {
            self.sm.resume();
        }
        else {
            self.releaseGroup('sm');
            cb();
        }
    };
    client.on('disconnected', function () {
        client.features.negotiated.streamManagement = false;
    });
    client.registerFeature('streamManagement', 200, smacks);
    client.registerFeature('streamManagement', 500, smacks);
}

function Bind$1 (client, stanzas, config) {
    client.registerFeature('bind', 300, function (features, cb) {
        client.sendIq({
            bind: {
                resource: config.resource
            },
            type: 'set'
        }, function (err, resp) {
            if (err) {
                client.emit('session:error', err);
                return cb('disconnect', 'JID binding failed');
            }
            client.features.negotiated.bind = true;
            client.emit('session:prebind', resp.bind.jid);
            const canStartSession = !features.session || (features.session && features.session.optional);
            if (!client.sessionStarted && canStartSession) {
                client.emit('session:started', client.jid);
            }
            return cb();
        });
    });
    client.on('session:started', function () {
        client.sessionStarted = true;
    });
    client.on('session:prebind', function (boundJID) {
        client.jid = new JID(boundJID);
        client.emit('session:bound', client.jid);
    });
    client.on('disconnected', function () {
        client.sessionStarted = false;
        client.features.negotiated.bind = false;
    });
}

function Session$1 (client) {
    client.registerFeature('session', 1000, function (features, cb) {
        const self = this;
        if (features.session.optional || self.sessionStarted) {
            self.features.negotiated.session = true;
            return cb();
        }
        self.sendIq({
            session: {},
            type: 'set'
        }, function (err) {
            if (err) {
                return cb('disconnect', 'session request failed');
            }
            self.features.negotiated.session = true;
            if (!self.sessionStarted) {
                self.sessionStarted = true;
                self.emit('session:started', self.jid);
            }
            cb();
        });
    });
    client.on('disconnected', function () {
        client.sessionStarted = false;
        client.features.negotiated.session = false;
    });
}

const WS_OPEN = 1;
class WSConnection extends WildEmitter {
    constructor(sm, stanzas) {
        super();
        const self = this;
        self.sm = sm;
        self.closing = false;
        self.stanzas = {
            Close: stanzas.getDefinition('close', 'urn:ietf:params:xml:ns:xmpp-framing', true),
            Open: stanzas.getDefinition('open', 'urn:ietf:params:xml:ns:xmpp-framing', true),
            StreamError: stanzas.getStreamError()
        };
        self.sendQueue = priorityQueue(function (data, cb) {
            if (self.conn) {
                if (typeof data !== 'string') {
                    data = data.toString();
                }
                data = Buffer.from(data, 'utf8').toString();
                self.emit('raw:outgoing', data);
                if (self.conn.readyState === WS_OPEN) {
                    self.conn.send(data);
                }
            }
            cb();
        }, 1);
        self.on('connected', function () {
            self.send(self.startHeader());
        });
        self.on('raw:incoming', function (data) {
            let stanzaObj;
            let err;
            data = data.trim();
            if (data === '') {
                return;
            }
            try {
                stanzaObj = stanzas.parse(data);
            }
            catch (e) {
                err = new self.stanzas.StreamError({
                    condition: 'invalid-xml'
                });
                self.emit('stream:error', err, e);
                self.send(err);
                return self.disconnect();
            }
            if (!stanzaObj) {
                return;
            }
            if (stanzaObj._name === 'openStream') {
                self.hasStream = true;
                self.stream = stanzaObj;
                return self.emit('stream:start', stanzaObj.toJSON());
            }
            if (stanzaObj._name === 'closeStream') {
                self.emit('stream:end');
                return self.disconnect();
            }
            if (!stanzaObj.lang && self.stream) {
                stanzaObj.lang = self.stream.lang;
            }
            self.emit('stream:data', stanzaObj);
        });
    }
    connect(opts) {
        const self = this;
        self.config = opts;
        self.hasStream = false;
        self.closing = false;
        self.conn = new WS(opts.wsURL, 'xmpp', opts.wsOptions);
        self.conn.onerror = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            self.emit('disconnected', self);
        };
        self.conn.onclose = function (e) {
            self.emit('disconnected', self, e);
        };
        self.conn.onopen = function () {
            self.sm.started = false;
            self.emit('connected', self);
        };
        self.conn.onmessage = function (wsMsg) {
            self.emit('raw:incoming', Buffer.from(wsMsg.data, 'utf8').toString());
        };
    }
    startHeader() {
        return new this.stanzas.Open({
            lang: this.config.lang || 'en',
            to: this.config.server,
            version: this.config.version || '1.0'
        });
    }
    closeHeader() {
        return new this.stanzas.Close();
    }
    disconnect() {
        if (this.conn && !this.closing && this.hasStream) {
            this.closing = true;
            this.send(this.closeHeader());
        }
        else {
            this.hasStream = false;
            this.stream = undefined;
            if (this.conn && this.conn.readyState === WS_OPEN) {
                this.conn.close();
            }
            this.conn = undefined;
        }
    }
    restart() {
        const self = this;
        self.hasStream = false;
        self.send(this.startHeader());
    }
    send(data) {
        this.sendQueue.push(data);
    }
}

function retryRequest(url, opts, timeout, allowedRetries) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const resp = yield timeoutPromise(fetch(url, opts), timeout * 1000);
            if (!resp.ok) {
                throw new Error('HTTP Status Error: ' + resp.status);
            }
            return resp.text();
        }
        catch (err) {
            if (allowedRetries > 0) {
                return retryRequest(url, opts, timeout, allowedRetries - 1);
            }
            else {
                throw err;
            }
        }
    });
}
class BOSHConnection extends WildEmitter {
    constructor(sm, stanzas) {
        super();
        const self = this;
        self.sm = sm;
        self.stanzas = {
            BOSH: stanzas.getDefinition('body', BOSH),
            StreamError: stanzas.getStreamError()
        };
        self.sendQueue = [];
        self.requests = [];
        self.maxRequests = undefined;
        self.sid = '';
        self.authenticated = false;
        self.on('raw:incoming', function (data) {
            data = data.trim();
            if (data === '') {
                return;
            }
            let bosh;
            let err;
            try {
                bosh = stanzas.parse(data, self.stanzas.BOSH);
            }
            catch (e) {
                err = new self.stanzas.StreamError({
                    condition: 'invalid-xml'
                });
                self.emit('stream:error', err, e);
                self.send(err);
                return self.disconnect();
            }
            if (!self.hasStream) {
                self.hasStream = true;
                self.stream = {
                    from: bosh.from,
                    id: bosh.sid || self.sid,
                    lang: bosh.lang || 'en',
                    to: bosh.to,
                    version: bosh.version || '1.0'
                };
                self.sid = bosh.sid || self.sid;
                self.maxRequests = bosh.requests || self.maxRequests;
            }
            const payload = bosh.payload;
            for (const stanzaObj of payload) {
                if (!stanzaObj.lang) {
                    stanzaObj.lang = self.stream.lang;
                }
                self.emit('stream:data', stanzaObj);
            }
            if (bosh.type === 'terminate') {
                self.rid = undefined;
                self.sid = undefined;
                self.emit('bosh:terminate', bosh);
                self.emit('stream:end');
                self.emit('disconnected', self);
            }
        });
    }
    connect(opts) {
        const self = this;
        self.config = Object.assign({ maxRetries: 5, rid: Math.ceil(Math.random() * 9999999999), wait: 30 }, opts);
        self.hasStream = false;
        self.sm.started = false;
        self.url = opts.boshURL;
        self.sid = self.config.sid;
        self.rid = self.config.rid;
        self.requests = [];
        if (self.sid) {
            self.hasStream = true;
            self.stream = {};
            self.emit('connected', self);
            self.emit('session:prebind', self.config.jid);
            self.emit('session:started');
            return;
        }
        self.rid++;
        self.request(new self.stanzas.BOSH({
            hold: 1,
            lang: self.config.lang || 'en',
            to: self.config.server,
            ver: '1.6',
            version: self.config.version || '1.0',
            wait: self.config.wait
        }));
    }
    disconnect() {
        if (this.hasStream) {
            this.rid++;
            this.request(new this.stanzas.BOSH({
                type: 'terminate'
            }));
        }
        else {
            this.stream = undefined;
            this.sid = undefined;
            this.rid = undefined;
            this.emit('disconnected', this);
        }
    }
    restart() {
        const self = this;
        self.rid++;
        self.request(new self.stanzas.BOSH({
            lang: self.config.lang || 'en',
            restart: 'true',
            to: self.config.server
        }));
    }
    send(data) {
        const self = this;
        if (self.hasStream) {
            self.sendQueue.push(data);
            // Schedule polling to send the data just a little
            // bit into the future so we have time for multiple
            // sends to get batched.
            clearTimeout(this.pollTimeout);
            this.pollTimeout = setTimeout(() => {
                self.longPoll();
            }, 50);
        }
    }
    longPoll() {
        const canReceive = !this.maxRequests || this.requests.length < this.maxRequests;
        const canSend = !this.maxRequests ||
            (this.sendQueue.length > 0 && this.requests.length < this.maxRequests);
        if (!this.sid || (!canReceive && !canSend)) {
            return;
        }
        const stanzas = this.sendQueue;
        this.sendQueue = [];
        this.rid++;
        this.request(new this.stanzas.BOSH({
            payload: stanzas
        }));
    }
    request(bosh) {
        const self = this;
        const ticket = { id: self.rid, request: null };
        bosh.rid = self.rid;
        bosh.sid = self.sid;
        const body = Buffer.from(bosh.toString(), 'utf8').toString();
        self.emit('raw:outgoing', body);
        self.emit('raw:outgoing:' + ticket.id, body);
        self.requests.push(ticket);
        const req = retryRequest(self.url, {
            body: body,
            headers: {
                'Content-Type': 'text/xml'
            },
            method: 'POST'
        }, self.config.wait * 1.5, this.config.maxRetries)
            .catch(function (err) {
            console.log(err);
            self.hasStream = false;
            const serr = new self.stanzas.StreamError({
                condition: 'connection-timeout'
            });
            self.emit('stream:error', serr, err);
            self.disconnect();
        })
            .then(function (respBody) {
            self.requests = self.requests.filter(item => {
                return item.id !== ticket.id;
            });
            if (respBody) {
                respBody = Buffer.from(respBody, 'utf8').toString();
                self.emit('raw:incoming', respBody);
                self.emit('raw:incoming:' + ticket.id, respBody);
            }
            // do not (re)start long polling if terminating, or request is pending, or before authentication
            if (self.hasStream &&
                bosh.type !== 'terminate' &&
                !self.requests.length &&
                self.authenticated) {
                setTimeout(() => {
                    self.longPoll();
                }, 30);
            }
        });
        ticket.request = req;
        return req;
    }
}

const SASL_MECHS = {
    anonymous: Anonymous,
    'digest-md5': DigestMD5,
    external: External,
    plain: Plain,
    'scram-sha-1': SCRAM,
    'x-oauth2': XOAuth2
};
class Client extends WildEmitter {
    constructor(opts) {
        super();
        opts = opts || {};
        this._initConfig(opts);
        this.jid = new JID();
        this.stanzas = jxt.createRegistry();
        this.stanzas.use(Protocol);
        this.use(HostMeta);
        this.use(Features);
        this.use(SASLPlugin);
        this.use(Smacks);
        this.use(Bind$1);
        this.use(Session$1);
        this.sm = new StreamManagement(this);
        this.transports = {
            bosh: BOSHConnection,
            websocket: WSConnection
        };
        this.on('stream:data', data => {
            const json = data ? data.toJSON() : null;
            if (!json) {
                return;
            }
            if (data._name === 'iq') {
                json._xmlChildCount = 0;
                for (const child of data.xml.childNodes || []) {
                    if (child.nodeType === 1) {
                        json._xmlChildCount += 1;
                    }
                }
            }
            this.emit(data._eventname || data._name, json);
            if (data._name === 'message' || data._name === 'presence' || data._name === 'iq') {
                this.sm.handle(json);
                this.emit('stanza', json);
            }
            else if (data._name === 'smAck') {
                return this.sm.process(json);
            }
            else if (data._name === 'smRequest') {
                return this.sm.ack();
            }
            if (json.id) {
                this.emit('id:' + json.id, json);
                this.emit(data._name + ':id:' + json.id, json);
            }
        });
        this.on('disconnected', () => {
            if (this.transport) {
                this.transport.off('*');
                delete this.transport;
            }
            this.releaseGroup('connection');
        });
        this.on('auth:success', () => {
            if (this.transport) {
                this.transport.authenticated = true;
            }
        });
        this.on('iq', iq => {
            const iqType = iq.type;
            const xmlChildCount = iq._xmlChildCount;
            delete iq._xmlChildCount;
            const exts = Object.keys(iq).filter(function (ext) {
                return (ext !== 'id' &&
                    ext !== 'to' &&
                    ext !== 'from' &&
                    ext !== 'lang' &&
                    ext !== 'type' &&
                    ext !== 'errorReply' &&
                    ext !== 'resultReply');
            });
            if (iq.type === 'get' || iq.type === 'set') {
                // Invalid request
                if (xmlChildCount !== 1) {
                    return this.sendIq(iq.errorReply({
                        error: {
                            condition: 'bad-request',
                            type: 'modify'
                        }
                    }));
                }
                // Valid request, but we don't have support for the
                // payload data.
                if (!exts.length) {
                    return this.sendIq(iq.errorReply({
                        error: {
                            condition: 'service-unavailable',
                            type: 'cancel'
                        }
                    }));
                }
                const iqEvent = 'iq:' + iqType + ':' + exts[0];
                if (this.callbacks[iqEvent]) {
                    this.emit(iqEvent, iq);
                }
                else {
                    // We support the payload data, but there's
                    // nothing registered to handle it.
                    this.sendIq(iq.errorReply({
                        error: {
                            condition: 'service-unavailable',
                            type: 'cancel'
                        }
                    }));
                }
            }
        });
        this.on('message', msg => {
            if ((msg.hasOwnProperty('$body') || msg.oob) && !msg.received && !msg.displayed) {
                if (msg.type === 'chat' || msg.type === 'normal') {
                    this.emit('chat', msg);
                }
                else if (msg.type === 'groupchat') {
                    this.emit('groupchat', msg);
                }
            }
            if (msg.type === 'error') {
                this.emit('message:error', msg);
            }
        });
        this.on('presence', pres => {
            let presType = pres.type || 'available';
            if (presType === 'error') {
                presType = 'presence:error';
            }
            this.emit(presType, pres);
        });
    }
    get stream() {
        return this.transport ? this.transport.stream : undefined;
    }
    _initConfig(opts) {
        const currConfig = this.config || {};
        this.config = Object.assign({ sasl: ['external', 'scram-sha-1', 'digest-md5', 'plain', 'anonymous'], transports: ['websocket', 'bosh'], useStreamManagement: true }, currConfig, opts);
        // Enable SASL authentication mechanisms (and their preferred order)
        // based on user configuration.
        if (!Array.isArray(this.config.sasl)) {
            this.config.sasl = [this.config.sasl];
        }
        this.SASLFactory = new Factory();
        for (const mech of this.config.sasl) {
            if (typeof mech === 'string') {
                const existingMech = SASL_MECHS[mech.toLowerCase()];
                if (existingMech && existingMech.prototype && existingMech.prototype.name) {
                    this.SASLFactory.use(existingMech);
                }
            }
            else {
                this.SASLFactory.use(mech);
            }
        }
        this.config.jid = new JID(this.config.jid);
        if (!this.config.server) {
            this.config.server = this.config.jid.domain;
        }
        if (this.config.password) {
            this.config.credentials = this.config.credentials || {};
            this.config.credentials.password = this.config.password;
            delete this.config.password;
        }
        if (this.config.transport) {
            this.config.transports = [this.config.transport];
        }
        if (!Array.isArray(this.config.transports)) {
            this.config.transports = [this.config.transports];
        }
    }
    use(pluginInit) {
        if (typeof pluginInit !== 'function') {
            return;
        }
        pluginInit(this, this.stanzas, this.config);
    }
    nextId() {
        return uuid();
    }
    _getConfiguredCredentials() {
        const creds = this.config.credentials || {};
        const requestedJID = new JID(this.config.jid);
        const username = creds.username || requestedJID.local;
        const server = creds.server || requestedJID.domain;
        return Object.assign({ host: server, password: this.config.password, realm: server, server: server, serviceName: server, serviceType: 'xmpp', username: username }, creds);
    }
    getCredentials(cb) {
        return cb(null, this._getConfiguredCredentials());
    }
    connect(opts, transInfo) {
        this._initConfig(opts);
        if (!transInfo && this.config.transports.length === 1) {
            transInfo = {};
            transInfo.name = this.config.transports[0];
        }
        if (transInfo && transInfo.name) {
            const trans = (this.transport = new this.transports[transInfo.name](this.sm, this.stanzas));
            trans.on('*', (event, data) => {
                this.emit(event, data);
            });
            return trans.connect(this.config);
        }
        return this.discoverBindings(this.config.server, (err, endpoints) => {
            if (err) {
                console.error('Could not find https://' +
                    this.config.server +
                    '/.well-known/host-meta file to discover connection endpoints for the requested transports.');
                return this.disconnect();
            }
            for (let t = 0, tlen = this.config.transports.length; t < tlen; t++) {
                const transport = this.config.transports[t];
                console.log('Checking for %s endpoints', transport);
                for (let i = 0, len = (endpoints[transport] || []).length; i < len; i++) {
                    const uri = endpoints[transport][i];
                    if (uri.indexOf('wss://') === 0 || uri.indexOf('https://') === 0) {
                        if (transport === 'websocket') {
                            this.config.wsURL = uri;
                        }
                        else {
                            this.config.boshURL = uri;
                        }
                        console.log('Using %s endpoint: %s', transport, uri);
                        return this.connect(null, {
                            name: transport,
                            url: uri
                        });
                    }
                    else {
                        console.warn('Discovered unencrypted %s endpoint (%s). Ignoring', transport, uri);
                    }
                }
            }
            console.error('No endpoints found for the requested transports.');
            return this.disconnect();
        });
    }
    disconnect() {
        if (this.sessionStarted) {
            this.releaseGroup('session');
            if (!this.sm.started) {
                // Only emit session:end if we had a session, and we aren't using
                // stream management to keep the session alive.
                this.emit('session:end');
            }
        }
        this.sessionStarted = false;
        this.releaseGroup('connection');
        if (this.transport) {
            this.transport.disconnect();
        }
        else {
            this.emit('disconnected');
        }
    }
    send(data) {
        this.sm.track(data._name, data);
        if (this.transport) {
            this.transport.send(data);
        }
    }
    sendMessage(data) {
        data = data || {};
        if (!data.id) {
            data.id = this.nextId();
        }
        const Message = this.stanzas.getMessage();
        const msg = new Message(data);
        this.emit('message:sent', msg.toJSON());
        this.send(msg);
        return data.id;
    }
    sendPresence(data) {
        data = data || {};
        if (!data.id) {
            data.id = this.nextId();
        }
        const Presence = this.stanzas.getPresence();
        this.send(new Presence(data));
        return data.id;
    }
    sendIq(data, cb) {
        data = data || {};
        if (!data.id) {
            data.id = this.nextId();
        }
        const Iq = this.stanzas.getIq();
        const iq = !data.toJSON ? new Iq(data) : data;
        if (data.type === 'error' || data.type === 'result') {
            this.send(iq);
            return;
        }
        const dest = new JID(data.to);
        const allowed = {};
        allowed[''] = true;
        allowed[dest.full] = true;
        allowed[dest.bare] = true;
        allowed[dest.domain] = true;
        allowed[this.jid.bare] = true;
        allowed[this.jid.domain] = true;
        const respEvent = 'iq:id:' + data.id;
        const request = new Promise((resolve, reject) => {
            const handler = res => {
                // Only process result from the correct responder
                if (!allowed[res.from.full]) {
                    return;
                }
                // Only process result or error responses, if the responder
                // happened to send us a request using the same ID value at
                // the same time.
                if (res.type !== 'result' && res.type !== 'error') {
                    return;
                }
                this.off(respEvent, handler);
                if (!res.error) {
                    resolve(res);
                }
                else {
                    reject(res);
                }
            };
            this.on(respEvent, 'session', handler);
        });
        this.send(iq);
        return timeoutPromise(request, (this.config.timeout || 15) * 1000, () => ({
            error: {
                condition: 'timeout'
            },
            id: data.id,
            type: 'error'
        })).then(function (result) {
            if (cb) {
                cb(null, result);
            }
            return result;
        }, function (err) {
            if (cb) {
                return cb(err);
            }
            throw err;
        });
    }
    sendStreamError(data) {
        data = data || {};
        const StreamError = this.stanzas.getStreamError();
        const error = new StreamError(data);
        this.emit('stream:error', error.toJSON());
        this.send(error);
        this.disconnect();
    }
}

function generateVerString(info, hash) {
    let S = '';
    let features = info.features || [];
    let identities = [];
    const extensions = info.extensions || [];
    const formTypes = {};
    const formOrder = [];
    for (const identity of info.identities || []) {
        identities.push([
            identity.category || '',
            identity.type || '',
            identity.lang || '',
            identity.name || ''
        ].join('/'));
    }
    const idLen = identities.length;
    const featureLen = features.length;
    identities = [...new Set(identities)].sort(octetCompare);
    features = [...new Set(features)].sort(octetCompare);
    if (featureLen !== features.length || idLen !== identities.length) {
        return false;
    }
    S += identities.join('<') + '<';
    S += features.join('<') + '<';
    let illFormed = false;
    for (const ext of extensions) {
        const fields = ext.fields;
        for (let i = 0, len = fields.length; i < len; i++) {
            if (fields[i].name === 'FORM_TYPE' && fields[i].type === 'hidden') {
                const name = fields[i].value;
                if (formTypes[name]) {
                    illFormed = true;
                    return;
                }
                formTypes[name] = ext;
                formOrder.push(name);
                return;
            }
        }
    }
    if (illFormed) {
        return false;
    }
    formOrder.sort(octetCompare);
    for (const name of formOrder) {
        const ext = formTypes[name];
        const fields = {};
        const fieldOrder = [];
        S += '<' + name;
        for (const field of ext.fields) {
            const fieldName = field.name;
            if (fieldName !== 'FORM_TYPE') {
                let values = field.value || '';
                if (typeof values !== 'object') {
                    values = values.split('\n');
                }
                fields[fieldName] = values.sort(octetCompare);
                fieldOrder.push(fieldName);
            }
        }
        fieldOrder.sort(octetCompare);
        for (const fieldName of fieldOrder) {
            S += '<' + fieldName;
            for (const val of fields[fieldName]) {
                S += '<' + val;
            }
        }
    }
    let ver = createHash(hash)
        .update(Buffer.from(S, 'utf8'))
        .digest('base64');
    let padding = 4 - (ver.length % 4);
    if (padding === 4) {
        padding = 0;
    }
    for (let i = 0; i < padding; i++) {
        ver += '=';
    }
    return ver;
}
function verifyVerString(info, hash, check) {
    const computed = generateVerString(info, hash);
    return computed && computed === check;
}
class Disco$1 {
    constructor() {
        this.features = {};
        this.identities = {};
        this.extensions = {};
        this.items = {};
        this.caps = {};
    }
    addFeature(feature, node) {
        node = node || '';
        if (!this.features[node]) {
            this.features[node] = [];
        }
        this.features[node].push(feature);
    }
    addIdentity(identity, node) {
        node = node || '';
        if (!this.identities[node]) {
            this.identities[node] = [];
        }
        this.identities[node].push(identity);
    }
    addItem(item, node) {
        node = node || '';
        if (!this.items[node]) {
            this.items[node] = [];
        }
        this.items[node].push(item);
    }
    addExtension(form, node) {
        node = node || '';
        if (!this.extensions[node]) {
            this.extensions[node] = [];
        }
        this.extensions[node].push(form);
    }
}
function Disco$2 (client) {
    client.disco = new Disco$1(client);
    client.disco.addFeature(DISCO_INFO);
    client.disco.addFeature(DISCO_ITEMS);
    client.disco.addIdentity({
        category: 'client',
        type: 'web'
    });
    client.registerFeature('caps', 100, function (features, cb) {
        this.emit('disco:caps', {
            caps: features.caps,
            from: new JID(client.jid.domain || client.config.server)
        });
        this.features.negotiated.caps = true;
        cb();
    });
    client.getDiscoInfo = function (jid, node, cb) {
        return this.sendIq({
            discoInfo: {
                node: node
            },
            to: jid,
            type: 'get'
        }, cb);
    };
    client.getDiscoItems = function (jid, node, cb) {
        return this.sendIq({
            discoItems: {
                node: node
            },
            to: jid,
            type: 'get'
        }, cb);
    };
    client.updateCaps = function () {
        let node = this.config.capsNode || 'https://stanzajs.org';
        const data = JSON.parse(JSON.stringify({
            extensions: this.disco.extensions[''],
            features: this.disco.features[''],
            identities: this.disco.identities['']
        }));
        const ver = generateVerString(data, 'sha-1');
        this.disco.caps = {
            hash: 'sha-1',
            node: node,
            ver: ver
        };
        node = node + '#' + ver;
        this.disco.features[node] = data.features;
        this.disco.identities[node] = data.identities;
        this.disco.extensions[node] = data.extensions;
        return client.getCurrentCaps();
    };
    client.getCurrentCaps = function () {
        const caps = client.disco.caps;
        if (!caps.ver) {
            return { ver: null, discoInfo: null };
        }
        const node = caps.node + '#' + caps.ver;
        return {
            discoInfo: {
                extensions: client.disco.extensions[node],
                features: client.disco.features[node],
                identities: client.disco.identities[node]
            },
            ver: caps.ver
        };
    };
    client.on('presence', function (pres) {
        if (pres.caps) {
            client.emit('disco:caps', pres);
        }
    });
    client.on('iq:get:discoInfo', function (iq) {
        let node = iq.discoInfo.node || '';
        let reportedNode = iq.discoInfo.node || '';
        if (node === client.disco.caps.node + '#' + client.disco.caps.ver) {
            reportedNode = node;
            node = '';
        }
        client.sendIq(iq.resultReply({
            discoInfo: {
                extensions: client.disco.extensions[node] || [],
                features: client.disco.features[node] || [],
                identities: client.disco.identities[node] || [],
                node: reportedNode
            }
        }));
    });
    client.on('iq:get:discoItems', function (iq) {
        const node = iq.discoItems.node;
        client.sendIq(iq.resultReply({
            discoItems: {
                items: client.disco.items[node] || [],
                node: node
            }
        }));
    });
    client.verifyVerString = verifyVerString;
    client.generateVerString = generateVerString;
    // Ensure we always have some caps data
    client.updateCaps();
}

function DiscoOnly (client) {
    client.disco.addFeature('jid\\20escaping');
    client.disco.addFeature(DELAY);
    client.disco.addFeature(EME_0);
    client.disco.addFeature(FORWARD_0);
    client.disco.addFeature(HASHES_1);
    client.disco.addFeature(IDLE_1);
    client.disco.addFeature(JSON_0);
    client.disco.addFeature(OOB);
    client.disco.addFeature(PSA);
    client.disco.addFeature(REFERENCE_0);
    client.disco.addFeature(SHIM);
    client.disco.addFeature(`${SHIM}#SubID`, SHIM);
    const names = getHashes();
    for (const name of names) {
        client.disco.addFeature(HASH_NAME(name));
    }
}

function Attention (client) {
    client.disco.addFeature(ATTENTION_0);
    client.getAttention = function (jid, opts) {
        opts = opts || {};
        opts.to = jid;
        opts.type = 'headline';
        opts.attention = true;
        client.sendMessage(opts);
    };
    client.on('message', function (msg) {
        if (msg.attention) {
            client.emit('attention', msg);
        }
    });
}

function Avatar$1 (client) {
    client.disco.addFeature(PEP_NOTIFY(AVATAR_METADATA));
    client.on('pubsub:event', function (msg) {
        if (!msg.event.updated) {
            return;
        }
        if (msg.event.updated.node !== AVATAR_METADATA) {
            return;
        }
        client.emit('avatar', {
            avatars: msg.event.updated.published[0].avatars,
            jid: msg.from,
            source: 'pubsub'
        });
    });
    client.on('presence', function (pres) {
        if (pres.avatarId) {
            client.emit('avatar', {
                avatars: [
                    {
                        id: pres.avatarId
                    }
                ],
                jid: pres.from,
                source: 'vcard'
            });
        }
    });
    client.publishAvatar = function (id, data, cb) {
        return this.publish('', AVATAR_DATA, {
            avatarData: data,
            id: id
        }, cb);
    };
    client.useAvatars = function (info, cb) {
        return this.publish('', AVATAR_METADATA, {
            avatars: info,
            id: 'current'
        }, cb);
    };
    client.getAvatar = function (jid, id, cb) {
        return this.getItem(jid, AVATAR_DATA, id, cb);
    };
}

function Blocking$1 (client) {
    client.disco.addFeature(BLOCKING);
    client.block = function (jid, cb) {
        return client.sendIq({
            block: {
                jids: [jid]
            },
            type: 'set'
        }, cb);
    };
    client.unblock = function (jid, cb) {
        return client.sendIq({
            type: 'set',
            unblock: {
                jids: [jid]
            }
        }, cb);
    };
    client.getBlocked = function (cb) {
        return client.sendIq({
            blockList: true,
            type: 'get'
        }, cb);
    };
    client.on('iq:set:block', function (iq) {
        client.emit('block', {
            jids: iq.block.jids || []
        });
        client.sendIq(iq.resultReply());
    });
    client.on('iq:set:unblock', function (iq) {
        client.emit('unblock', {
            jids: iq.unblock.jids || []
        });
        client.sendIq(iq.resultReply());
    });
}

function Bob (client) {
    client.disco.addFeature(BOB);
    client.getBits = function (jid, cid, cb) {
        return client.sendIq({
            bob: {
                cid: cid
            },
            to: jid,
            type: 'get'
        }, cb);
    };
}

function Bookmarks$1 (client) {
    client.getBookmarks = function (cb) {
        return this.getPrivateData({ bookmarks: true }, cb);
    };
    client.setBookmarks = function (opts, cb) {
        return this.setPrivateData({ bookmarks: opts }, cb);
    };
    client.addBookmark = function (bookmark, cb) {
        bookmark.jid = new JID(bookmark.jid);
        return this.getBookmarks()
            .then(function (res) {
            const bookmarks = res.privateStorage.bookmarks.conferences || [];
            let existing = false;
            for (let i = 0; i < bookmarks.length; i++) {
                const bm = bookmarks[i];
                if (bm.jid.bare === bookmark.jid.bare) {
                    bookmarks[i] = Object.assign({}, bm, bookmark);
                    existing = true;
                    break;
                }
            }
            if (!existing) {
                bookmarks.push(bookmark);
            }
            return client.setBookmarks({ conferences: bookmarks });
        })
            .then(function (result) {
            if (cb) {
                cb(null, result);
            }
            return result;
        }, function (err) {
            if (cb) {
                cb(err);
            }
            else {
                throw err;
            }
        });
    };
    client.removeBookmark = function (jid, cb) {
        jid = new JID(jid);
        return this.getBookmarks()
            .then(function (res) {
            let bookmarks = res.privateStorage.bookmarks.conferences || [];
            bookmarks = bookmarks.filter(bm => {
                return jid.bare !== bm.jid.bare;
            });
            return client.setBookmarks({ conferences: bookmarks });
        })
            .then(function (result) {
            if (cb) {
                cb(null, result);
            }
        }, function (err) {
            if (cb) {
                cb(err);
            }
            else {
                throw err;
            }
        });
    };
}

function Carbons$1 (client) {
    client.disco.addFeature(CARBONS_2);
    client.enableCarbons = function (cb) {
        return this.sendIq({
            enableCarbons: true,
            type: 'set'
        }, cb);
    };
    client.disableCarbons = function (cb) {
        return this.sendIq({
            disableCarbons: true,
            type: 'set'
        }, cb);
    };
    client.on('message', function (msg) {
        if (msg.carbonSent) {
            return client.emit('carbon:sent', msg);
        }
        if (msg.carbonReceived) {
            return client.emit('carbon:received', msg);
        }
    });
    client.on('carbon:*', function (name, carbon) {
        const dir = name.split(':')[1];
        if (carbon.from.bare !== client.jid.bare) {
            return;
        }
        let msg;
        let delay;
        if (dir === 'received') {
            msg = carbon.carbonReceived.forwarded.message;
            delay = carbon.carbonReceived.forwarded.delay;
        }
        else {
            msg = carbon.carbonSent.forwarded.message;
            delay = carbon.carbonSent.forwarded.delay;
        }
        if (!msg.delay) {
            msg.delay = {
                stamp: delay ? delay.stamp : new Date(Date.now())
            };
        }
        msg.carbon = true;
        // Treat the carbon copied message however we would
        // have originally treated it ourself.
        if (msg.from.bare === client.jid.bare) {
            client.emit('message:sent', msg);
        }
        else {
            client.emit('message', msg);
        }
    });
}

function ChatStates (client) {
    client.disco.addFeature(CHAT_STATES);
    const allowedTypes = ['chat', 'groupchat', 'normal'];
    client.on('message', function (msg) {
        if (allowedTypes.indexOf(msg.type || 'normal') < 0) {
            return;
        }
        if (msg.chatState) {
            client.emit('chat:state', {
                chatState: msg.chatState,
                from: msg.from,
                to: msg.to
            });
            client.emit('chatState', {
                chatState: msg.chatState,
                from: msg.from,
                to: msg.to
            });
        }
    });
}

function Command$1 (client) {
    client.disco.addFeature(ADHOC_COMMANDS);
    client.disco.addItem({
        name: 'Ad-Hoc Commands',
        node: ADHOC_COMMANDS
    });
    client.getCommands = function (jid, cb) {
        return client.getDiscoItems(jid, ADHOC_COMMANDS, cb);
    };
}

function Correction (client) {
    client.disco.addFeature(CORRECTION_0);
    client.on('message', function (msg) {
        if (msg.replace) {
            client.emit('replace', msg);
            client.emit('replace:' + msg.id, msg);
        }
    });
}

function CSI$2 (client, stanzas) {
    const Active = stanzas.getDefinition('active', CSI);
    const Inactive = stanzas.getDefinition('inactive', CSI);
    client.registerFeature('clientStateIndication', 400, function (features, cb) {
        this.features.negotiated.clientStateIndication = true;
        cb();
    });
    client.markActive = function () {
        if (this.features.negotiated.clientStateIndication) {
            this.send(new Active());
        }
    };
    client.markInactive = function () {
        if (this.features.negotiated.clientStateIndication) {
            this.send(new Inactive());
        }
    };
}

function DataForms (client) {
    client.disco.addFeature(DATAFORM);
    client.disco.addFeature(DATAFORM_MEDIA);
    client.disco.addFeature(DATAFORM_VALIDATION);
    client.disco.addFeature(DATAFORM_LAYOUT);
    client.on('message', function (msg) {
        if (msg.form) {
            client.emit('dataform', msg);
        }
    });
}

function ExtDisco$1 (client) {
    client.disco.addFeature(DISCO_EXTERNAL_1);
    client.getServices = function (jid, type, cb) {
        return this.sendIq({
            services: {
                type: type
            },
            to: jid,
            type: 'get'
        }, cb);
    };
    client.getServiceCredentials = function (jid, host, cb) {
        return this.sendIq({
            credentials: {
                service: {
                    host: host
                }
            },
            to: jid,
            type: 'get'
        }, cb);
    };
}

function Geoloc (client) {
    client.disco.addFeature(GEOLOC);
    client.disco.addFeature(PEP_NOTIFY(GEOLOC));
    client.on('pubsub:event', function (msg) {
        if (!msg.event.updated) {
            return;
        }
        if (msg.event.updated.node !== GEOLOC) {
            return;
        }
        client.emit('geoloc', {
            geoloc: msg.event.updated.published[0].geoloc,
            jid: msg.from
        });
    });
    client.publishGeoLoc = function (data, cb) {
        return this.publish('', GEOLOC, {
            geoloc: data
        }, cb);
    };
}

function Invisible (client) {
    client.goInvisible = function (cb) {
        return this.sendIq({
            invisible: true,
            type: 'set'
        }, cb);
    };
    client.goVisible = function (cb) {
        return this.sendIq({
            type: 'set',
            visible: true
        }, cb);
    };
}

function JIDPrep$1 (client) {
    client.prepJID = function (jid, cb) {
        return client.sendIq({
            jidPrep: jid,
            to: client.jid.domain,
            type: 'get'
        }, cb);
    };
}

const SessionRole = {
    Initiator: 'initiator',
    Responder: 'responder'
};
const ApplicationDirection = {
    Inactive: 'inactive',
    Receive: 'recvonly',
    Send: 'sendonly',
    SendReceive: 'sendrecv'
};
const ContentSenders = {
    Both: 'both',
    Initiator: 'initiator',
    None: 'none',
    Responder: 'responder'
};
function sendersToDirection(role, senders = 'both') {
    const isInitiator = role === SessionRole.Initiator;
    switch (senders) {
        case ContentSenders.Initiator:
            return isInitiator ? ApplicationDirection.Send : ApplicationDirection.Receive;
        case ContentSenders.Responder:
            return isInitiator ? ApplicationDirection.Receive : ApplicationDirection.Send;
        case ContentSenders.Both:
            return ApplicationDirection.SendReceive;
    }
    return ApplicationDirection.Inactive;
}
function directionToSenders(role, direction = 'sendrecv') {
    const isInitiator = role === SessionRole.Initiator;
    switch (direction) {
        case ApplicationDirection.Send:
            return isInitiator ? ContentSenders.Initiator : ContentSenders.Responder;
        case ApplicationDirection.Receive:
            return isInitiator ? ContentSenders.Responder : ContentSenders.Initiator;
        case ApplicationDirection.SendReceive:
            return ContentSenders.Both;
    }
    return ContentSenders.None;
}

function convertIntermediateToApplication(media, role) {
    const rtp = media.rtpParameters;
    const rtcp = media.rtcpParameters || {};
    const encodingParameters = media.rtpEncodingParameters || [];
    let hasSSRC = false;
    if (encodingParameters && encodingParameters.length) {
        hasSSRC = !!encodingParameters[0].ssrc; // !== false ???
    }
    const application = {
        applicationType: 'rtp',
        headerExtensions: [],
        media: media.kind,
        mux: rtcp.mux,
        payloads: [],
        reducedSize: rtcp.reducedSize,
        sourceGroups: [],
        sources: [],
        ssrc: hasSSRC ? encodingParameters[0].ssrc.toString() : undefined,
        streams: []
    };
    for (const ext of rtp.headerExtensions || []) {
        application.headerExtensions.push({
            id: ext.id,
            senders: ext.direction && ext.direction !== 'sendrecv'
                ? directionToSenders(role, ext.direction)
                : undefined,
            uri: ext.uri
        });
    }
    if (rtcp.ssrc && rtcp.cname) {
        application.sources = [
            {
                parameters: [
                    {
                        key: 'cname',
                        value: rtcp.cname
                    }
                ],
                ssrc: rtcp.ssrc.toString()
            }
        ];
    }
    if (hasSSRC && encodingParameters[0] && encodingParameters[0].rtx) {
        application.sourceGroups = [
            {
                semantics: 'FID',
                sources: [
                    encodingParameters[0].ssrc.toString(),
                    encodingParameters[0].rtx.ssrc.toString()
                ]
            }
        ];
    }
    for (const stream of media.streams || []) {
        application.streams.push({
            id: stream.stream,
            track: stream.track
        });
    }
    for (const codec of rtp.codecs || []) {
        const payload = {
            channels: codec.channels.toString(),
            clockrate: codec.clockRate.toString(),
            feedback: [],
            id: codec.payloadType.toString(),
            maxptime: codec.maxptime ? codec.maxptime.toString() : undefined,
            name: codec.name,
            parameters: []
        };
        for (const key of Object.keys(codec.parameters || {})) {
            if (key === 'ptime') {
                payload.ptime = codec.parameters[key].toString();
                continue;
            }
            payload.parameters.push({
                key,
                value: codec.parameters[key]
            });
        }
        for (const feedback of codec.rtcpFeedback || []) {
            payload.feedback.push({
                subtype: feedback.parameter,
                type: feedback.type
            });
        }
        application.payloads.push(payload);
    }
    return application;
}
function convertIntermediateToCandidate(candidate) {
    return {
        component: candidate.component.toString(),
        foundation: candidate.foundation,
        generation: undefined,
        id: undefined,
        ip: candidate.ip,
        network: undefined,
        port: candidate.port.toString(),
        priority: candidate.priority.toString(),
        protocol: candidate.protocol,
        relAddr: candidate.relatedAddress,
        relPort: candidate.relatedPort ? candidate.relatedPort.toString() : undefined,
        tcpType: candidate.tcpType,
        type: candidate.type
    };
}
function convertIntermediateToTransport(media) {
    const ice = media.iceParameters;
    const dtls = media.dtlsParameters;
    const transport = {
        candidates: [],
        transportType: 'iceUdp'
    };
    if (ice) {
        transport.ufrag = ice.usernameFragment;
        transport.pwd = ice.password;
    }
    if (dtls) {
        transport.fingerprints = dtls.fingerprints.map(fingerprint => ({
            hash: fingerprint.algorithm,
            setup: media.setup,
            value: fingerprint.value
        }));
    }
    if (media.sctp) {
        transport.sctp = [media.sctp];
    }
    for (const candidate of media.candidates || []) {
        transport.candidates.push(convertIntermediateToCandidate(candidate));
    }
    return transport;
}
function convertIntermediateToRequest(session, role) {
    return {
        contents: session.media.map(media => {
            const isRTP = media.kind === 'audio' || media.kind === 'video';
            return {
                application: isRTP
                    ? convertIntermediateToApplication(media, role)
                    : {
                        applicationType: 'datachannel',
                        protocol: media.protocol
                    },
                creator: SessionRole.Initiator,
                name: media.mid,
                senders: directionToSenders(role, media.direction),
                transport: convertIntermediateToTransport(media)
            };
        }),
        groups: session.groups
            ? session.groups.map(group => ({
                contents: group.mids,
                semantics: group.semantics
            }))
            : undefined
    };
}
function convertContentToIntermediate(content, role) {
    const application = content.application || {};
    const transport = content.transport;
    const isRTP = application && application.applicationType === 'rtp';
    const media = {
        direction: sendersToDirection(role, content.senders),
        kind: application.media || 'application',
        mid: content.name,
        protocol: isRTP ? 'UDP/TLS/RTP/SAVPF' : 'UDP/DTLS/SCTP'
    };
    if (isRTP) {
        media.rtcpParameters = {
            mux: application.mux,
            reducedSize: application.reducedSize
        };
        if (application.sources && application.sources.length) {
            const source = application.sources[0];
            media.rtcpParameters.ssrc = parseInt(source.ssrc, 10);
            if (source.parameters) {
                const cname = source.parameters.find(p => p.key === 'cname');
                media.rtcpParameters.cname = cname ? cname.value : undefined;
            }
        }
        media.rtpParameters = {
            codecs: [],
            fecMechanisms: [],
            headerExtensions: []
        };
        if (application.streams) {
            media.streams = [];
            for (const stream of application.streams) {
                media.streams.push({
                    stream: stream.id,
                    track: stream.track
                });
            }
        }
        if (application.ssrc) {
            media.rtpEncodingParameters = [
                {
                    ssrc: parseInt(application.ssrc, 10)
                }
            ];
            if (application.sourceGroups && application.sourceGroups.length) {
                const group = application.sourceGroups[0];
                media.rtpEncodingParameters[0].rtx = {
                    // TODO: actually look for a FID one with matching ssrc
                    ssrc: parseInt(group.sources[1], 10)
                };
            }
        }
        for (const payload of application.payloads || []) {
            const parameters = {};
            for (const param of payload.parameters || []) {
                parameters[param.key] = param.value;
            }
            const rtcpFeedback = [];
            for (const fb of payload.feedback || []) {
                rtcpFeedback.push({
                    parameter: fb.subtype,
                    type: fb.type
                });
            }
            media.rtpParameters.codecs.push({
                channels: parseInt(payload.channels, 10),
                clockRate: parseInt(payload.clockrate, 10),
                name: payload.name,
                numChannels: parseInt(payload.channels, 10),
                parameters,
                payloadType: parseInt(payload.id, 10),
                rtcpFeedback
            });
        }
        for (const ext of application.headerExtensions || []) {
            media.rtpParameters.headerExtensions.push({
                direction: ext.senders && ext.senders !== 'both'
                    ? sendersToDirection(role, ext.senders)
                    : undefined,
                id: ext.id,
                uri: ext.uri
            });
        }
    }
    if (transport) {
        if (transport.ufrag && transport.pwd) {
            media.iceParameters = {
                password: transport.pwd,
                usernameFragment: transport.ufrag
            };
        }
        if (transport.fingerprints && transport.fingerprints.length) {
            media.dtlsParameters = {
                fingerprints: [],
                role: 'auto'
            };
            for (const fingerprint of transport.fingerprints) {
                media.dtlsParameters.fingerprints.push({
                    algorithm: fingerprint.hash,
                    value: fingerprint.value
                });
            }
            if (transport.sctp) {
                media.sctp = transport.sctp[0];
            }
            media.setup = transport.fingerprints[0].setup;
        }
    }
    return media;
}
function convertRequestToIntermediate(jingle, role) {
    const session = {
        groups: [],
        media: []
    };
    for (const group of jingle.groups || []) {
        session.groups.push({
            mids: group.contents,
            semantics: group.semantics
        });
    }
    for (const content of jingle.contents || []) {
        session.media.push(convertContentToIntermediate(content, role));
    }
    return session;
}
function convertIntermediateToTransportInfo(mid, candidate) {
    return {
        contents: [
            {
                creator: SessionRole.Initiator,
                name: mid,
                transport: {
                    candidates: [convertIntermediateToCandidate(candidate)],
                    transportType: 'iceUdp',
                    ufrag: candidate.usernameFragment || undefined
                }
            }
        ]
    };
}

function parseSctpMap(mediaSection) {
    const sctpMapLines = matchPrefix(mediaSection, 'a=sctpmap:');
    if (sctpMapLines.length > 0) {
        const parts = matchPrefix(mediaSection, 'a=sctpmap:')[0]
            .substr(10)
            .split(' ');
        return {
            number: parts[0],
            protocol: parts[1],
            streams: parts[2]
        };
    }
    else {
        const sctpPort = matchPrefix(mediaSection, 'a=sctp-port:');
        return {
            number: sctpPort[0].substr(12),
            protocol: 'webrtc-datachannel',
            streams: '1024'
        };
    }
}
function writeSctpDescription(media, sctp) {
    return [
        `m=${media.kind} 9 ${media.protocol} ${sctp.protocol}\r\n`,
        'c=IN IP4 0.0.0.0\r\n',
        `a=sctp-port:${sctp.number}\r\n`
    ].join('');
}

// ====================================================================
// Import SDP to Intermediary
// ====================================================================
function importFromSDP(sdp) {
    const mediaSections = getMediaSections(sdp);
    const sessionPart = getDescription(sdp);
    const session = {
        groups: [],
        media: []
    };
    for (const groupLine of matchPrefix(sessionPart, 'a=group:')) {
        const parts = groupLine.split(' ');
        const semantics = parts.shift().substr(8);
        session.groups.push({
            mids: parts,
            semantics
        });
    }
    for (const mediaSection of mediaSections) {
        const kind = getKind(mediaSection);
        const isRejected$1 = isRejected(mediaSection);
        const mLine = parseMLine(mediaSection);
        const media = {
            direction: getDirection(mediaSection, sessionPart),
            kind,
            mid: getMid(mediaSection),
            protocol: mLine.protocol
            // TODO: what about end-of-candidates?
        };
        if (!isRejected$1) {
            media.iceParameters = getIceParameters(mediaSection, sessionPart);
            media.dtlsParameters = getDtlsParameters(mediaSection, sessionPart);
            media.setup = matchPrefix(mediaSection, 'a=setup:')[0].substr(8);
        }
        if (kind === 'audio' || kind === 'video') {
            media.rtpParameters = parseRtpParameters(mediaSection);
            media.rtpEncodingParameters = parseRtpEncodingParameters(mediaSection);
            media.rtcpParameters = parseRtcpParameters(mediaSection);
            const msid = parseMsid(mediaSection);
            if (msid) {
                media.streams = [msid];
            }
            else {
                media.streams = [];
            }
        }
        else if (kind === 'application') {
            media.sctp = parseSctpMap(mediaSection);
        }
        media.candidates = matchPrefix(mediaSection, 'a=candidate:').map(parseCandidate);
        session.media.push(media);
    }
    return session;
}
// ====================================================================
// Export Intermediary to SDP
// ====================================================================
function exportToSDP(session) {
    const output = [];
    output.push(writeSessionBoilerplate(session.sessionId, session.sessionVersion), 'a=msid-semantic:WMS *\r\n');
    if (session.iceLite) {
        output.push('a=ice-lite\r\n');
    }
    for (const group of session.groups || []) {
        output.push(`a=group:${group.semantics} ${group.mids.join(' ')}\r\n`);
    }
    for (const media of session.media || []) {
        const isRejected = !(media.iceParameters && media.dtlsParameters);
        if (media.kind === 'application' && media.sctp) {
            output.push(writeSctpDescription(media, media.sctp));
        }
        else if (media.rtpParameters) {
            let mline = writeRtpDescription(media.kind, media.rtpParameters);
            if (isRejected) {
                mline = mline.replace(`m=${media.kind} 9 `, `m=${media.kind} 0 `);
            }
            output.push(mline);
            output.push(`a=${media.direction || 'sendrecv'}\r\n`);
            for (const stream of media.streams || []) {
                output.push(`a=msid:${stream.stream} ${stream.track}\r\n`);
            }
            if (media.rtcpParameters && media.rtcpParameters.cname) {
                output.push(`a=ssrc:${media.rtcpParameters.ssrc} cname:${media.rtcpParameters.cname}\r\n`);
                if (media.rtpEncodingParameters && media.rtpEncodingParameters[0].rtx) {
                    const params = media.rtpEncodingParameters[0];
                    output.push(`a=ssrc-group:FID ${params.ssrc} ${params.rtx.ssrc}\r\n`);
                    output.push(`a=ssrc:${params.rtx.ssrc} cname:${media.rtcpParameters.cname}\r\n`);
                }
            }
        }
        if (media.mid !== undefined) {
            output.push(`a=mid:${media.mid}\r\n`);
        }
        if (media.iceParameters) {
            output.push(writeIceParameters(media.iceParameters));
        }
        if (media.dtlsParameters && media.setup) {
            output.push(writeDtlsParameters(media.dtlsParameters, media.setup));
        }
        if (media.candidates && media.candidates.length) {
            for (const candidate of media.candidates) {
                output.push(`a=${writeCandidate(candidate)}`);
            }
        }
    }
    return output.join('');
}

class JingleSession extends WildEmitter {
    constructor(opts) {
        super();
        this.sid = opts.sid || uuid();
        this.peerID = opts.peerID;
        this.role = opts.initiator ? 'initiator' : 'responder';
        this.parent = opts.parent;
        this.state = 'starting';
        this.connectionState = 'starting';
        // We track the intial pending description types in case
        // of the need for a tie-breaker.
        this.pendingApplicationTypes = opts.applicationTypes || [];
        this.pendingAction = false;
        // Here is where we'll ensure that all actions are processed
        // in order, even if a particular action requires async handling.
        this.processingQueue = priorityQueue((task, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.state === 'ended') {
                // Don't process anything once the session has been ended
                if (task.reject) {
                    task.reject(new Error('Session ended'));
                }
                return next();
            }
            if (task.type === 'local') {
                this._log('debug', 'Processing local action:', task.name);
                try {
                    const res = yield task.handler();
                    task.resolve(res);
                }
                catch (err) {
                    task.reject(err);
                }
                if (next) {
                    return next();
                }
                return;
            }
            const { action, changes, cb } = task;
            this._log('debug', 'Processing remote action:', action);
            return new Promise(resolve => {
                const done = (err, result) => {
                    cb(err, result);
                    if (next) {
                        next();
                    }
                    resolve();
                };
                switch (action) {
                    case 'content-accept':
                        return this.onContentAccept(changes, done);
                    case 'content-add':
                        return this.onContentAdd(changes, done);
                    case 'content-modify':
                        return this.onContentModify(changes, done);
                    case 'content-reject':
                        return this.onContentReject(changes, done);
                    case 'content-remove':
                        return this.onContentRemove(changes, done);
                    case 'description-info':
                        return this.onDescriptionInfo(changes, done);
                    case 'security-info':
                        return this.onSecurityInfo(changes, done);
                    case 'session-accept':
                        return this.onSessionAccept(changes, done);
                    case 'session-info':
                        return this.onSessionInfo(changes, done);
                    case 'session-initiate':
                        return this.onSessionInitiate(changes, done);
                    case 'session-terminate':
                        return this.onSessionTerminate(changes, done);
                    case 'transport-accept':
                        return this.onTransportAccept(changes, done);
                    case 'transport-info':
                        return this.onTransportInfo(changes, done);
                    case 'transport-reject':
                        return this.onTransportReject(changes, done);
                    case 'transport-replace':
                        return this.onTransportReplace(changes, done);
                    default:
                        this._log('error', 'Invalid or unsupported action: ' + action);
                        done({ condition: 'bad-request' });
                }
            });
        }));
    }
    get isInitiator() {
        return this.role === 'initiator';
    }
    get peerRole() {
        return this.isInitiator ? 'responder' : 'initiator';
    }
    get state() {
        return this._sessionState;
    }
    set state(value) {
        if (value !== this._sessionState) {
            this._log('info', 'Changing session state to: ' + value);
            this._sessionState = value;
            this.emit('sessionState', this, value);
        }
    }
    get connectionState() {
        return this._connectionState;
    }
    set connectionState(value) {
        if (value !== this._connectionState) {
            this._log('info', 'Changing connection state to: ' + value);
            this._connectionState = value;
            this.emit('connectionState', this, value);
        }
    }
    _log(level, message, ...data) {
        message = this.sid + ': ' + message;
        this.emit('log:' + level, message, ...data);
    }
    send(action, data) {
        data = data || {};
        data.sid = this.sid;
        data.action = action;
        const requirePending = {
            'content-accept': true,
            'content-add': true,
            'content-modify': true,
            'content-reject': true,
            'content-remove': true,
            'session-accept': true,
            'session-inititate': true,
            'transport-accept': true,
            'transport-reject': true,
            'transport-replace': true
        };
        if (requirePending[action]) {
            this.pendingAction = action;
        }
        else {
            this.pendingAction = false;
        }
        this.emit('send', {
            id: uuid(),
            jingle: data,
            to: this.peerID,
            type: 'set'
        });
    }
    processLocal(name, handler) {
        return new Promise((resolve, reject) => {
            this.processingQueue.push({
                handler,
                name,
                reject,
                resolve,
                type: 'local'
            }, 1 // Process local requests first
            );
        });
    }
    process(action, changes, cb) {
        this.processingQueue.push({
            action,
            cb,
            changes,
            type: 'remote'
        }, 2 // Process remote requests second
        );
    }
    start(opts, next) {
        this._log('error', 'Can not start base sessions');
        this.end('unsupported-applications', true);
    }
    accept(opts, next) {
        this._log('error', 'Can not accept base sessions');
        this.end('unsupported-applications');
    }
    cancel() {
        this.end('cancel');
    }
    decline() {
        this.end('decline');
    }
    end(reason, silent) {
        this.state = 'ended';
        this.processingQueue.kill();
        if (!reason) {
            reason = 'success';
        }
        if (typeof reason === 'string') {
            reason = {
                condition: reason
            };
        }
        if (!silent) {
            this.send('session-terminate', {
                reason
            });
        }
        this.emit('terminated', this, reason);
    }
    onSessionInitiate(changes, cb) {
        cb();
    }
    onSessionAccept(changes, cb) {
        cb();
    }
    onSessionTerminate(changes, cb) {
        this.end(changes.reason, true);
        cb();
    }
    // It is mandatory to reply to a session-info action with
    // an unsupported-info error if the info isn't recognized.
    //
    // However, a session-info action with no associated payload
    // is acceptable (works like a ping).
    onSessionInfo(changes, cb) {
        const okKeys = {
            action: true,
            initiator: true,
            responder: true,
            sid: true
        };
        let unknownPayload = false;
        Object.keys(changes).forEach(function (key) {
            if (!okKeys[key]) {
                unknownPayload = true;
            }
        });
        if (unknownPayload) {
            cb({
                condition: 'feature-not-implemented',
                jingleCondition: 'unsupported-info',
                type: 'modify'
            });
        }
        else {
            cb();
        }
    }
    // It is mandatory to reply to a security-info action with
    // an unsupported-info error if the info isn't recognized.
    onSecurityInfo(changes, cb) {
        cb({
            condition: 'feature-not-implemented',
            jingleCondition: 'unsupported-info',
            type: 'modify'
        });
    }
    // It is mandatory to reply to a description-info action with
    // an unsupported-info error if the info isn't recognized.
    onDescriptionInfo(changes, cb) {
        cb({
            condition: 'feature-not-implemented',
            jingleCondition: 'unsupported-info',
            type: 'modify'
        });
    }
    // It is mandatory to reply to a transport-info action with
    // an unsupported-info error if the info isn't recognized.
    onTransportInfo(changes, cb) {
        cb({
            condition: 'feature-not-implemented',
            jingleCondition: 'unsupported-info',
            type: 'modify'
        });
    }
    // It is mandatory to reply to a content-add action with either
    // a content-accept or content-reject.
    onContentAdd(changes, cb) {
        // Allow ack for the content-add to be sent.
        cb();
        this.send('content-reject', {
            reason: {
                condition: 'failed-application',
                text: 'content-add is not supported'
            }
        });
    }
    onContentAccept(changes, cb) {
        cb({ condition: 'bad-request' });
    }
    onContentReject(changes, cb) {
        cb({ condition: 'bad-request' });
    }
    onContentModify(changes, cb) {
        cb({ condition: 'bad-request' });
    }
    onContentRemove(changes, cb) {
        cb({ condition: 'bad-request' });
    }
    // It is mandatory to reply to a transport-add action with either
    // a transport-accept or transport-reject.
    onTransportReplace(changes, cb) {
        // Allow ack for the transport-replace be sent.
        cb();
        this.send('transport-reject', {
            reason: {
                condition: 'failed-application',
                text: 'transport-replace is not supported'
            }
        });
    }
    onTransportAccept(changes, cb) {
        cb({ condition: 'bad-request' });
    }
    onTransportReject(changes, cb) {
        cb({ condition: 'bad-request' });
    }
}

const SDPUtils = require('sdp');
class ICESession extends JingleSession {
    constructor(opts) {
        super(opts);
        this.pc = new RTCPeerConnection(Object.assign({}, opts.config, { iceServers: opts.iceServers }), opts.constraints);
        this.pc.addEventListener('iceconnectionstatechange', () => {
            this.onIceStateChange();
        });
        this.pc.addEventListener('icecandidate', e => {
            if (e.candidate) {
                this.onIceCandidate(e);
            }
            else {
                this.onIceEndOfCandidates();
            }
        });
        this.restrictRelayBandwidth();
        this.bitrateLimit = 0;
        this.maxRelayBandwidth = opts.maxRelayBandwidth;
        this.candidateBuffer = [];
    }
    end(reason, silent) {
        this.pc.close();
        super.end(reason, silent);
    }
    // ----------------------------------------------------------------
    // Jingle action handers
    // ----------------------------------------------------------------
    onTransportInfo(changes, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            if (changes.contents[0] && changes.contents[0].transport.gatheringComplete) {
                try {
                    if (this.pc.signalingState === 'stable') {
                        yield this.pc.addIceCandidate(null);
                    }
                    else {
                        this.candidateBuffer.push(null);
                    }
                }
                catch (err) {
                    this._log('debug', 'Could not add null ICE candidate');
                }
                finally {
                    cb();
                }
                return;
            }
            // detect an ice restart.
            if (this.pc.remoteDescription) {
                const remoteDescription = this.pc.remoteDescription;
                const remoteJSON = importFromSDP(remoteDescription.sdp);
                const remoteMedia = remoteJSON.media.find(m => m.mid === changes.contents[0].name);
                const currentUsernameFragment = remoteMedia.iceParameters.usernameFragment;
                const remoteUsernameFragment = changes.contents[0].transport.ufrag;
                if (remoteUsernameFragment && currentUsernameFragment !== remoteUsernameFragment) {
                    changes.contents.forEach((content, idx) => {
                        remoteJSON.media[idx].iceParameters = {
                            password: content.transport.pwd,
                            usernameFragment: content.transport.ufrag
                        };
                        remoteJSON.media[idx].candidates = [];
                    });
                    if (remoteDescription.type === 'offer') {
                        try {
                            yield this.pc.setRemoteDescription(remoteDescription);
                            yield this.processBufferedCandidates();
                            const answer = yield this.pc.createAnswer();
                            const json = importFromSDP(answer.sdp);
                            const jingle = {
                                action: 'transport-info',
                                contents: json.media.map(media => {
                                    return {
                                        creator: 'initiator',
                                        name: media.mid,
                                        transport: convertIntermediateToTransport(media)
                                    };
                                }),
                                sessionId: this.sid
                            };
                            this.send('transport-info', jingle);
                            yield this.pc.setLocalDescription(answer);
                            cb();
                        }
                        catch (err) {
                            this._log('error', 'Could not do remote ICE restart', err);
                            cb(err);
                            this.end('failed-application', true);
                        }
                        return;
                    }
                    try {
                        yield this.pc.setRemoteDescription(remoteDescription);
                        yield this.processBufferedCandidates();
                        cb();
                    }
                    catch (err) {
                        this._log('error', 'Could not do local ICE restart', err);
                        cb(err);
                        this.end('failed-application', true);
                    }
                }
            }
            const all = (changes.contents || []).map(content => {
                const sdpMid = content.name;
                const results = (content.transport.candidates || []).map((json) => __awaiter(this, void 0, void 0, function* () {
                    json.relatedAddress = json.relAddr;
                    json.relatedPort = json.relPort;
                    const candidate = SDPUtils.writeCandidate(json);
                    let sdpMLineIndex;
                    // workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1456417
                    const remoteSDP = this.pc.remoteDescription.sdp;
                    const mediaSections = SDPUtils.getMediaSections(remoteSDP);
                    for (let i = 0; i < mediaSections.length; i++) {
                        if (SDPUtils.getMid(mediaSections[i]) === sdpMid) {
                            sdpMLineIndex = i;
                            break;
                        }
                    }
                    if (this.pc.signalingState === 'stable') {
                        try {
                            yield this.pc.addIceCandidate({ sdpMid, sdpMLineIndex, candidate });
                        }
                        catch (err) {
                            this._log('error', 'Could not add ICE candidate', err);
                        }
                    }
                    else {
                        this.candidateBuffer.push({ sdpMid, sdpMLineIndex, candidate });
                    }
                }));
                return Promise.all(results);
            });
            try {
                yield Promise.all(all);
                cb();
            }
            catch (err) {
                cb(err);
            }
        });
    }
    onSessionAccept(changes, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            this.state = 'active';
            const json = convertRequestToIntermediate(changes, this.peerRole);
            const sdp = exportToSDP(json);
            try {
                yield this.pc.setRemoteDescription({ type: 'answer', sdp });
                yield this.processBufferedCandidates();
                this.emit('accepted', this, undefined);
                cb();
            }
            catch (err) {
                this._log('error', `Could not process WebRTC answer: ${err}`);
                cb({ condition: 'general-error' });
            }
        });
    }
    onSessionTerminate(changes, cb) {
        this._log('info', 'Terminating session');
        this.pc.close();
        super.end(changes.reason, true);
        cb();
    }
    // ----------------------------------------------------------------
    // ICE action handers
    // ----------------------------------------------------------------
    onIceCandidate(e) {
        const candidate = SDPUtils.parseCandidate(e.candidate.candidate);
        const jingle = convertIntermediateToTransportInfo(e.candidate.sdpMid, candidate);
        /* monkeypatch ufrag in Firefox */
        jingle.contents.forEach((content, idx) => {
            if (!content.transport.ufrag) {
                const json = importFromSDP(this.pc.localDescription.sdp);
                content.transport.ufrag = json.media[idx].iceParameters.usernameFragment;
            }
        });
        this._log('info', 'Discovered new ICE candidate', jingle);
        this.send('transport-info', jingle);
    }
    onIceEndOfCandidates() {
        this._log('info', 'ICE end of candidates');
        const json = importFromSDP(this.pc.localDescription.sdp);
        const firstMedia = json.media[0];
        // signal end-of-candidates with our first media mid/ufrag
        const endOfCandidates = {
            contents: [
                {
                    name: firstMedia.mid,
                    transport: {
                        gatheringComplete: true,
                        transportType: 'iceUdp',
                        ufrag: firstMedia.iceParameters.usernameFragment
                    }
                }
            ]
        };
        this.send('transport-info', endOfCandidates);
    }
    onIceStateChange() {
        switch (this.pc.iceConnectionState) {
            case 'checking':
                this.connectionState = 'connecting';
                break;
            case 'completed':
            case 'connected':
                this.connectionState = 'connected';
                break;
            case 'disconnected':
                if (this.pc.signalingState === 'stable') {
                    this.connectionState = 'interrupted';
                }
                else {
                    this.connectionState = 'disconnected';
                }
                this.maybeRestartIce();
                break;
            case 'failed':
                if (this.connectionState === 'failed') {
                    this.connectionState = 'failed';
                    this.end('failed-transport');
                }
                else {
                    this.restartIce();
                }
                break;
            case 'closed':
                this.connectionState = 'disconnected';
                break;
        }
    }
    /* when using TURN, we might want to restrict the bandwidth
     * to the value specified by MAX_RELAY_BANDWIDTH
     * in order to prevent sending excessive traffic through
     * the TURN server.
     */
    restrictRelayBandwidth() {
        if (!(window.RTCRtpSender && 'getParameters' in window.RTCRtpSender.prototype)) {
            return;
        }
        this.pc.addEventListener('iceconnectionstatechange', () => __awaiter(this, void 0, void 0, function* () {
            if (this.pc.iceConnectionState !== 'completed' &&
                this.pc.iceConnectionState !== 'connected') {
                return;
            }
            if (this._firstTimeConnected) {
                return;
            }
            this._firstTimeConnected = true;
            const stats = yield this.pc.getStats();
            let activeCandidatePair;
            stats.forEach(report => {
                if (report.type === 'transport') {
                    activeCandidatePair = stats.get(report.selectedCandidatePairId);
                }
            });
            // Fallback for Firefox.
            if (!activeCandidatePair) {
                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.selected) {
                        activeCandidatePair = report;
                    }
                });
            }
            if (activeCandidatePair) {
                let isRelay = false;
                if (activeCandidatePair.remoteCandidateId) {
                    const remoteCandidate = stats.get(activeCandidatePair.remoteCandidateId);
                    if (remoteCandidate && remoteCandidate.candidateType === 'relay') {
                        isRelay = true;
                    }
                }
                if (activeCandidatePair.localCandidateId) {
                    const localCandidate = stats.get(activeCandidatePair.localCandidateId);
                    if (localCandidate && localCandidate.candidateType === 'relay') {
                        isRelay = true;
                    }
                }
                if (isRelay) {
                    this.maximumBitrate = this.maxRelayBandwidth;
                    if (this.currentBitrate) {
                        this.setMaximumBitrate(Math.min(this.currentBitrate, this.maximumBitrate));
                    }
                }
            }
        }));
    }
    processBufferedCandidates() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const candidate of this.candidateBuffer) {
                try {
                    yield this.pc.addIceCandidate(candidate);
                }
                catch (err) {
                    this._log('error', 'Could not add ICE candidate', err);
                }
            }
            this.candidateBuffer = [];
        });
    }
    /* determine whether an ICE restart is in order
     * when transitioning to disconnected. Strategy is
     * 'wait 2 seconds for things to repair themselves'
     * 'maybe check if bytes are sent/received' by comparing
     *   getStats measurements
     */
    maybeRestartIce() {
        // only initiators do an ice-restart to avoid conflicts.
        if (!this.isInitiator) {
            return;
        }
        if (this._maybeRestartingIce !== undefined) {
            clearTimeout(this._maybeRestartingIce);
        }
        this._maybeRestartingIce = setTimeout(() => {
            delete this._maybeRestartingIce;
            if (this.pc.iceConnectionState === 'disconnected') {
                this.restartIce();
            }
        }, 2000);
    }
    /* actually do an ice restart */
    restartIce() {
        return __awaiter(this, void 0, void 0, function* () {
            // only initiators do an ice-restart to avoid conflicts.
            if (!this.isInitiator) {
                return;
            }
            if (this._maybeRestartingIce !== undefined) {
                clearTimeout(this._maybeRestartingIce);
            }
            try {
                yield this.processLocal('restart-ice', () => __awaiter(this, void 0, void 0, function* () {
                    const offer = yield this.pc.createOffer({ iceRestart: true });
                    // extract new ufrag / pwd, send transport-info with just that.
                    const json = importFromSDP(offer.sdp);
                    const jingle = {
                        action: 'transport-info',
                        contents: json.media.map(media => {
                            return {
                                creator: 'initiator',
                                name: media.mid,
                                transport: convertIntermediateToTransport(media)
                            };
                        }),
                        sessionId: this.sid
                    };
                    this.send('transport-info', jingle);
                    yield this.pc.setLocalDescription(offer);
                }));
            }
            catch (err) {
                this._log('error', 'Could not create WebRTC offer', err);
                this.end('failed-application', true);
            }
        });
    }
    // set the maximum bitrate. Only supported in Chrome and Firefox right now.
    setMaximumBitrate(maximumBitrate) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.maximumBitrate) {
                // potentially take into account bandwidth restrictions due to using TURN.
                maximumBitrate = Math.min(maximumBitrate, this.maximumBitrate);
            }
            this.currentBitrate = maximumBitrate;
            if (!(window.RTCRtpSender && 'getParameters' in window.RTCRtpSender.prototype)) {
                return;
            }
            // changes the maximum bandwidth using RTCRtpSender.setParameters.
            const sender = this.pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (!sender) {
                return;
            }
            let browser = '';
            if (window.navigator && window.navigator.mozGetUserMedia) {
                browser = 'firefox';
            }
            else if (window.navigator && window.navigator.webkitGetUserMedia) {
                browser = 'chrome';
            }
            const parameters = sender.getParameters();
            if (browser === 'firefox' && !parameters.encodings) {
                parameters.encodings = [{}];
            }
            if (maximumBitrate === 0) {
                delete parameters.encodings[0].maximumBitrate;
            }
            else {
                if (!parameters.encodings.length) {
                    parameters.encodings[0] = {};
                }
                parameters.encodings[0].maxBitrate = maximumBitrate;
            }
            try {
                yield this.processLocal('set-bitrate', () => __awaiter(this, void 0, void 0, function* () {
                    if (browser === 'chrome') {
                        yield sender.setParameters(parameters);
                    }
                    else if (browser === 'firefox') {
                        // Firefox needs renegotiation:
                        // https://bugzilla.mozilla.org/show_bug.cgi?id=1253499
                        // but we do not want to intefere with our queue so we
                        // just hope this gets picked up.
                        if (this.pc.signalingState !== 'stable') {
                            yield sender.setParameters(parameters);
                        }
                        else if (this.pc.localDescription &&
                            this.pc.localDescription.type === 'offer') {
                            yield sender.setParameters(parameters);
                            const offer = yield this.pc.createOffer();
                            yield this.pc.setLocalDescription(offer);
                            yield this.pc.setRemoteDescription(this.pc.remoteDescription);
                            yield this.processBufferedCandidates();
                        }
                        else if (this.pc.localDescription &&
                            this.pc.localDescription.type === 'answer') {
                            yield sender.setParameters(parameters);
                            yield this.pc.setRemoteDescription(this.pc.remoteDescription);
                            yield this.processBufferedCandidates();
                            const answer = yield this.pc.createAnswer();
                            yield this.pc.setLocalDescription(answer);
                        }
                    }
                }));
            }
            catch (err) {
                this._log('error', 'setParameters failed', err);
            }
        });
    }
}

class Sender extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.config = Object.assign({ chunkSize: 16384, hash: 'sha-1' }, opts);
        this.file = null;
        this.channel = null;
        this.hash = createHash(this.config.hash);
    }
    send(file, channel) {
        if (this.file && this.channel) {
            return;
        }
        this.file = file;
        this.channel = channel;
        this.channel.binaryType = 'arraybuffer';
        const fileReader = new FileReader();
        let offset = 0;
        let pendingRead = false;
        fileReader.addEventListener('load', event => {
            const data = event.target.result;
            pendingRead = false;
            offset += data.byteLength;
            this.channel.send(data);
            this.hash.update(new Uint8Array(data));
            this.emit('progress', offset, file.size, data);
            if (offset < file.size) {
                if (this.channel.bufferedAmount <= this.channel.bufferedAmountLowThreshold) {
                    sliceFile();
                }
                // Otherwise wait for bufferedamountlow event to trigger reading more data
            }
            else {
                this.emit('progress', file.size, file.size, null);
                this.emit('sentFile', {
                    algo: this.config.hash,
                    hash: this.hash.digest('hex')
                });
            }
        });
        const sliceFile = () => {
            if (pendingRead || offset >= file.size) {
                return;
            }
            pendingRead = true;
            const slice = file.slice(offset, offset + this.config.chunkSize);
            fileReader.readAsArrayBuffer(slice);
        };
        channel.bufferedAmountLowThreshold = 8 * this.config.chunkSize;
        channel.onbufferedamountlow = () => {
            sliceFile();
        };
        sliceFile();
    }
}
class Receiver extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.config = Object.assign({ hash: 'sha-1' }, opts);
        this.receiveBuffer = [];
        this.received = 0;
        this.metadata = {};
        this.channel = null;
        this.hash = createHash(this.config.hash);
    }
    receive(metadata, channel) {
        if (metadata) {
            this.metadata = metadata;
        }
        this.channel = channel;
        this.channel.binaryType = 'arraybuffer';
        this.channel.onmessage = e => {
            const len = e.data.byteLength;
            this.received += len;
            this.receiveBuffer.push(e.data);
            if (e.data) {
                this.hash.update(new Uint8Array(e.data));
            }
            this.emit('progress', this.received, this.metadata.size, e.data);
            if (this.received === this.metadata.size) {
                this.metadata.actualhash = this.hash.digest('hex');
                this.emit('receivedFile', new Blob(this.receiveBuffer), this.metadata);
                this.receiveBuffer = [];
            }
            else if (this.received > this.metadata.size) {
                // FIXME
                console.error('received more than expected, discarding...');
                this.receiveBuffer = []; // just discard...
            }
        };
    }
}
class FileTransferSession extends ICESession {
    constructor(opts) {
        super(opts);
        this.sender = null;
        this.receiver = null;
        this.file = null;
    }
    start(file, next) {
        return __awaiter(this, void 0, void 0, function* () {
            next = next || (() => undefined);
            this.state = 'pending';
            this.role = 'initiator';
            this.file = file;
            this.sender = new Sender();
            this.sender.on('progress', (sent, size) => {
                this._log('info', 'Send progress ' + sent + '/' + size);
            });
            this.sender.on('sentFile', meta => {
                this._log('info', 'Sent file', meta.name);
                this.send('description-info', {
                    contents: [
                        {
                            application: {
                                applicationType: 'filetransfer',
                                offer: {
                                    hash: {
                                        algo: meta.algo,
                                        value: meta.hash
                                    }
                                }
                            },
                            creator: 'initiator',
                            name: this.contentName
                        }
                    ]
                });
                this.emit('sentFile', this, meta);
            });
            this.channel = this.pc.createDataChannel('filetransfer', {
                ordered: true
            });
            this.channel.onopen = () => {
                this.sender.send(this.file, this.channel);
            };
            try {
                yield this.processLocal('session-initiate', () => __awaiter(this, void 0, void 0, function* () {
                    const offer = yield this.pc.createOffer({
                        offerToReceiveAudio: false,
                        offerToReceiveVideo: false
                    });
                    const json = importFromSDP(offer.sdp);
                    const jingle = convertIntermediateToRequest(json, this.role);
                    this.contentName = jingle.contents[0].name;
                    jingle.sessionId = this.sid;
                    jingle.action = 'session-initate';
                    jingle.contents[0].application = {
                        applicationType: 'filetransfer',
                        offer: {
                            date: file.lastModifiedDate,
                            hash: {
                                algo: 'sha-1',
                                value: ''
                            },
                            name: file.name,
                            size: file.size
                        }
                    };
                    this.send('session-initiate', jingle);
                    yield this.pc.setLocalDescription(offer);
                }));
                next();
            }
            catch (err) {
                this._log('error', 'Could not create WebRTC offer', err);
                return this.end('failed-application', true);
            }
        });
    }
    accept(next) {
        return __awaiter(this, void 0, void 0, function* () {
            this._log('info', 'Accepted incoming session');
            this.role = 'responder';
            this.state = 'active';
            next = next || (() => undefined);
            try {
                yield this.processLocal('session-accept', () => __awaiter(this, void 0, void 0, function* () {
                    const answer = yield this.pc.createAnswer();
                    const json = importFromSDP(answer.sdp);
                    const jingle = convertIntermediateToRequest(json, this.role);
                    jingle.sessionId = this.sid;
                    jingle.action = 'session-accept';
                    jingle.contents.forEach(content => {
                        content.creator = 'initiator';
                    });
                    this.contentName = jingle.contents[0].name;
                    this.send('session-accept', jingle);
                    yield this.pc.setLocalDescription(answer);
                }));
                next();
            }
            catch (err) {
                this._log('error', 'Could not create WebRTC answer', err);
                this.end('failed-application');
            }
        });
    }
    onSessionInitiate(changes, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            this._log('info', 'Initiating incoming session');
            this.role = 'responder';
            this.state = 'pending';
            const json = convertRequestToIntermediate(changes, this.peerRole);
            const sdp = exportToSDP(json);
            const desc = changes.contents[0].application;
            this.receiver = new Receiver({ hash: desc.offer.hash.algo });
            this.receiver.on('progress', (received, size) => {
                this._log('info', 'Receive progress ' + received + '/' + size);
            });
            this.receiver.on('receivedFile', file => {
                this.receivedFile = file;
                this._maybeReceivedFile();
            });
            this.receiver.metadata = desc.offer;
            this.pc.addEventListener('datachannel', e => {
                this.channel = e.channel;
                this.receiver.receive(null, e.channel);
            });
            try {
                yield this.pc.setRemoteDescription({ type: 'offer', sdp });
                yield this.processBufferedCandidates();
                cb();
            }
            catch (err) {
                this._log('error', 'Could not create WebRTC answer', err);
                cb({ condition: 'general-error' });
            }
        });
    }
    onDescriptionInfo(info, cb) {
        const hash = info.contents[0].application.offer.hash;
        this.receiver.metadata.hash = hash;
        if (this.receiver.metadata.actualhash) {
            this._maybeReceivedFile();
        }
        cb();
    }
    _maybeReceivedFile() {
        if (!this.receiver.metadata.hash.value) ;
        else if (this.receiver.metadata.hash.value === this.receiver.metadata.actualhash) {
            this._log('info', 'File hash matches');
            this.emit('receivedFile', this, this.receivedFile, this.receiver.metadata);
            this.end('success');
        }
        else {
            this._log('error', 'File hash does not match');
            this.end('media-error');
        }
    }
}

function applyStreamsCompatibility(content) {
    /* signal .streams as a=ssrc: msid */
    if (content.application.streams &&
        content.application.streams.length &&
        content.application.sources &&
        content.application.sources.length) {
        const msid = content.application.streams[0];
        content.application.sources[0].parameters.push({
            key: 'msid',
            value: `${msid.id} ${msid.track}`
        });
        if (content.application.sourceGroups && content.application.sourceGroups.length > 0) {
            content.application.sources.push({
                parameters: [
                    {
                        key: 'cname',
                        value: content.application.sources[0].parameters[0].value
                    },
                    { key: 'msid', value: `${msid.id} ${msid.track}` }
                ],
                ssrc: content.application.sourceGroups[0].sources[1]
            });
        }
    }
}
class MediaSession extends ICESession {
    constructor(opts) {
        super(opts);
        this.pc.addEventListener('track', e => {
            this.onAddTrack(e.track, e.streams[0]);
        });
        if (opts.stream) {
            for (const track of opts.stream.getTracks()) {
                this.addTrack(track, opts.stream);
            }
        }
        this._ringing = false;
    }
    // ----------------------------------------------------------------
    // Session control methods
    // ----------------------------------------------------------------
    start(offerOptions, next) {
        return __awaiter(this, void 0, void 0, function* () {
            this.state = 'pending';
            next = next || (() => undefined);
            this.role = 'initiator';
            this.offerOptions = offerOptions;
            try {
                yield this.processLocal('session-initiate', () => __awaiter(this, void 0, void 0, function* () {
                    const offer = yield this.pc.createOffer(offerOptions);
                    const json = importFromSDP(offer.sdp);
                    const jingle = convertIntermediateToRequest(json, this.role);
                    jingle.sessionId = this.sid;
                    jingle.action = 'session-initate';
                    jingle.contents.forEach(content => {
                        content.creator = 'initiator';
                        applyStreamsCompatibility(content);
                    });
                    yield this.pc.setLocalDescription(offer);
                    this.send('session-initiate', jingle);
                }));
                next();
            }
            catch (err) {
                this._log('error', 'Could not create WebRTC offer', err);
                this.end('failed-application', true);
            }
        });
    }
    accept(opts, next) {
        return __awaiter(this, arguments, void 0, function* () {
            // support calling with accept(next) or accept(opts, next)
            if (arguments.length === 1 && typeof opts === 'function') {
                next = opts;
                opts = {};
            }
            next = next || (() => undefined);
            opts = opts || {};
            this._log('info', 'Accepted incoming session');
            this.state = 'active';
            this.role = 'responder';
            try {
                yield this.processLocal('session-accept', () => __awaiter(this, void 0, void 0, function* () {
                    const answer = yield this.pc.createAnswer(opts);
                    const json = importFromSDP(answer.sdp);
                    const jingle = convertIntermediateToRequest(json, this.role);
                    jingle.sessionId = this.sid;
                    jingle.action = 'session-accept';
                    jingle.contents.forEach(content => {
                        content.creator = 'initiator';
                    });
                    yield this.pc.setLocalDescription(answer);
                    this.send('session-accept', jingle);
                }));
                next();
            }
            catch (err) {
                this._log('error', 'Could not create WebRTC answer', err);
                this.end('failed-application');
            }
        });
    }
    end(reason, silent) {
        this.pc.getReceivers().forEach(receiver => {
            this.onRemoveTrack(receiver.track);
        });
        super.end(reason, silent);
    }
    ring() {
        return this.processLocal('ring', () => {
            this._log('info', 'Ringing on incoming session');
            this.ringing = true;
            this.send('session-info', { ringing: true });
        });
    }
    mute(creator, name) {
        return this.processLocal('mute', () => {
            this._log('info', 'Muting', name);
            this.send('session-info', {
                mute: {
                    creator,
                    name
                }
            });
        });
    }
    unmute(creator, name) {
        return this.processLocal('unmute', () => {
            this._log('info', 'Unmuting', name);
            this.send('session-info', {
                unmute: {
                    creator,
                    name
                }
            });
        });
    }
    hold() {
        return this.processLocal('hold', () => {
            this._log('info', 'Placing on hold');
            this.send('session-info', { hold: true });
        });
    }
    resume() {
        return this.processLocal('resume', () => {
            this._log('info', 'Resuming from hold');
            this.send('session-info', { active: true });
        });
    }
    // ----------------------------------------------------------------
    // Track control methods
    // ----------------------------------------------------------------
    addTrack(track, stream, cb) {
        return this.processLocal('addtrack', () => __awaiter(this, void 0, void 0, function* () {
            if (this.pc.addTrack) {
                this.pc.addTrack(track, stream);
            }
            else {
                this.pc.addStream(stream);
            }
            if (cb) {
                cb();
            }
        }));
    }
    removeTrack(sender, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.processLocal('removetrack', () => __awaiter(this, void 0, void 0, function* () {
                this.pc.removeTrack(sender);
                if (cb) {
                    return cb();
                }
            }));
        });
    }
    // ----------------------------------------------------------------
    // Track event handlers
    // ----------------------------------------------------------------
    onAddTrack(track, stream) {
        this._log('info', 'Track added');
        this.emit('peerTrackAdded', this, track, stream);
    }
    onRemoveTrack(track) {
        this._log('info', 'Track removed');
        this.emit('peerTrackRemoved', this, track);
    }
    // ----------------------------------------------------------------
    // Jingle action handers
    // ----------------------------------------------------------------
    onSessionInitiate(changes, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            this._log('info', 'Initiating incoming session');
            this.state = 'pending';
            this.role = 'responder';
            const json = convertRequestToIntermediate(changes, this.peerRole);
            json.media.forEach(media => {
                if (!media.streams) {
                    media.streams = [{ stream: 'legacy', track: media.kind }];
                }
            });
            const sdp = exportToSDP(json);
            try {
                yield this.pc.setRemoteDescription({ type: 'offer', sdp });
                yield this.processBufferedCandidates();
                return cb();
            }
            catch (err) {
                this._log('error', 'Could not create WebRTC answer', err);
                return cb({ condition: 'general-error' });
            }
        });
    }
    onSessionTerminate(changes, cb) {
        for (const receiver of this.pc.getReceivers()) {
            this.onRemoveTrack(receiver.track);
        }
        super.onSessionTerminate(changes, cb);
    }
    onSessionInfo(info, cb) {
        if (info.ringing) {
            this._log('info', 'Outgoing session is ringing');
            this.ringing = true;
            this.emit('ringing', this);
            return cb();
        }
        if (info.hold) {
            this._log('info', 'On hold');
            this.emit('hold', this);
            return cb();
        }
        if (info.active) {
            this._log('info', 'Resuming from hold');
            this.emit('resumed', this);
            return cb();
        }
        if (info.mute) {
            this._log('info', 'Muting', info.mute);
            this.emit('mute', this, info.mute);
            return cb();
        }
        if (info.unmute) {
            this._log('info', 'Unmuting', info.unmute);
            this.emit('unmute', this, info.unmute);
            return cb();
        }
        return cb();
    }
    get ringing() {
        return this._ringing;
    }
    set ringing(value) {
        if (value !== this._ringing) {
            this._ringing = value;
            this.emit('change:ringing', value);
        }
    }
    get streams() {
        if (this.pc.signalingState !== 'closed') {
            return this.pc.getRemoteStreams();
        }
        return [];
    }
}

const MAX_RELAY_BANDWIDTH = 768 * 1024; // maximum bandwidth used via TURN.
class SessionManager extends WildEmitter {
    constructor(conf) {
        super();
        conf = conf || {};
        this.selfID = conf.selfID;
        this.sessions = {};
        this.peers = {};
        this.iceServers = conf.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }];
        this.prepareSession =
            conf.prepareSession ||
                function (opts) {
                    if (opts.applicationTypes.indexOf('rtp') >= 0) {
                        return new MediaSession(opts);
                    }
                    if (opts.applicationTypes.indexOf('filetransfer') >= 0) {
                        return new FileTransferSession(opts);
                    }
                };
        this.performTieBreak =
            conf.performTieBreak ||
                function (sess, req) {
                    const applicationTypes = req.jingle.contents.map(content => {
                        if (content.application) {
                            return content.application.applicationType;
                        }
                    });
                    const intersection = sess.pendingApplicationTypes.filter(appType => applicationTypes.includes(appType));
                    return intersection.length > 0;
                };
        this.config = Object.assign({ debug: false, peerConnectionConfig: {
                bundlePolicy: conf.bundlePolicy || 'balanced',
                iceTransportPolicy: conf.iceTransportPolicy || 'all',
                rtcpMuxPolicy: conf.rtcpMuxPolicy || 'require'
            }, peerConnectionConstraints: {
                optional: [{ DtlsSrtpKeyAgreement: true }, { RtpDataChannels: false }]
            } }, conf);
    }
    addICEServer(server) {
        // server == {
        //    url: '',
        //    [username: '',]
        //    [credential: '']
        // }
        if (typeof server === 'string') {
            server = { urls: server };
        }
        this.iceServers.push(server);
    }
    resetICEServers() {
        this.iceServers = [];
    }
    addSession(session) {
        const sid = session.sid;
        const peer = session.peerID;
        this.sessions[sid] = session;
        if (!this.peers[peer]) {
            this.peers[peer] = [];
        }
        this.peers[peer].push(session);
        // Automatically clean up tracked sessions
        session.on('terminated', () => {
            const peers = this.peers[peer] || [];
            if (peers.length) {
                peers.splice(peers.indexOf(session), 1);
            }
            delete this.sessions[sid];
        });
        // Proxy session events
        session.on('*', (name, data, ...extraData) => {
            // Listen for when we actually try to start a session to
            // trigger the outgoing event.
            if (name === 'send') {
                const action = data.jingle && data.jingle.action;
                if (session.isInitiator && action === 'session-initiate') {
                    this.emit('outgoing', session);
                }
            }
            if (this.config.debug && (name === 'log:debug' || name === 'log:error')) {
                console.log('Jingle:', data, ...extraData);
            }
            // Don't proxy change:* events, since those don't apply to
            // the session manager itself.
            if (name.indexOf('change') === 0) {
                return;
            }
            this.emit(name, data, ...extraData);
        });
        this.emit('createdSession', session);
        return session;
    }
    createMediaSession(peer, sid, stream) {
        const session = new MediaSession({
            config: this.config.peerConnectionConfig,
            constraints: this.config.peerConnectionConstraints,
            iceServers: this.iceServers,
            initiator: true,
            maxRelayBandwidth: MAX_RELAY_BANDWIDTH,
            parent: this,
            peerID: peer,
            sid,
            stream
        });
        this.addSession(session);
        return session;
    }
    createFileTransferSession(peer, sid) {
        const session = new FileTransferSession({
            config: this.config.peerConnectionConfig,
            constraints: this.config.peerConnectionConstraints,
            iceServers: this.iceServers,
            initiator: true,
            maxRelayBandwidth: MAX_RELAY_BANDWIDTH,
            parent: this,
            peerID: peer,
            sid
        });
        this.addSession(session);
        return session;
    }
    endPeerSessions(peer, reason, silent) {
        peer = peer.full || peer;
        const sessions = this.peers[peer] || [];
        delete this.peers[peer];
        sessions.forEach(function (session) {
            session.end(reason || 'gone', silent);
        });
    }
    endAllSessions(reason, silent) {
        Object.keys(this.peers).forEach(peer => {
            this.endPeerSessions(peer, reason, silent);
        });
    }
    _createIncomingSession(meta, req) {
        let session;
        if (this.prepareSession) {
            session = this.prepareSession(meta, req);
        }
        // Fallback to a generic session type, which can
        // only be used to end the session.
        if (!session) {
            session = new JingleSession(meta);
        }
        this.addSession(session);
        return session;
    }
    _sendError(to, id, data) {
        if (!data.type) {
            data.type = 'cancel';
        }
        this.emit('send', {
            error: data,
            id,
            to,
            type: 'error'
        });
    }
    _log(level, message, ...args) {
        this.emit('log:' + level, message, ...args);
    }
    process(req) {
        const self = this;
        // Extract the request metadata that we need to verify
        const sid = !!req.jingle ? req.jingle.sid : null;
        let session = this.sessions[sid] || null;
        const rid = req.id;
        const sender = req.from ? req.from.full || req.from : undefined;
        if (req.type === 'error') {
            const isTieBreak = req.error && req.error.jingleCondition === 'tie-break';
            if (session && session.state === 'pending' && isTieBreak) {
                return session.end('alternative-session', true);
            }
            else {
                if (session) {
                    session.pendingAction = false;
                }
                return this.emit('error', req);
            }
        }
        if (req.type === 'result') {
            if (session) {
                session.pendingAction = false;
            }
            return;
        }
        const action = req.jingle.action;
        const contents = req.jingle.contents || [];
        const applicationTypes = contents.map(function (content) {
            if (content.application) {
                return content.application.applicationType;
            }
        });
        const transportTypes = contents.map(function (content) {
            if (content.transport) {
                return content.transport.transportType;
            }
        });
        // Now verify that we are allowed to actually process the
        // requested action
        if (action !== 'session-initiate') {
            // Can't modify a session that we don't have.
            if (!session) {
                this._log('error', 'Unknown session', sid);
                return this._sendError(sender, rid, {
                    condition: 'item-not-found',
                    jingleCondition: 'unknown-session'
                });
            }
            // Check if someone is trying to hijack a session.
            if (session.peerID !== sender || session.state === 'ended') {
                this._log('error', 'Session has ended, or action has wrong sender');
                return this._sendError(sender, rid, {
                    condition: 'item-not-found',
                    jingleCondition: 'unknown-session'
                });
            }
            // Can't accept a session twice
            if (action === 'session-accept' && session.state !== 'pending') {
                this._log('error', 'Tried to accept session twice', sid);
                return this._sendError(sender, rid, {
                    condition: 'unexpected-request',
                    jingleCondition: 'out-of-order'
                });
            }
            // Can't process two requests at once, need to tie break
            if (action !== 'session-terminate' && action === session.pendingAction) {
                this._log('error', 'Tie break during pending request');
                if (session.isInitiator) {
                    return this._sendError(sender, rid, {
                        condition: 'conflict',
                        jingleCondition: 'tie-break'
                    });
                }
            }
        }
        else if (session) {
            // Don't accept a new session if we already have one.
            if (session.peerID !== sender) {
                this._log('error', 'Duplicate sid from new sender');
                return this._sendError(sender, rid, {
                    condition: 'service-unavailable'
                });
            }
            // Check if we need to have a tie breaker because both parties
            // happened to pick the same random sid.
            if (session.state === 'pending') {
                if (this.selfID > session.peerID && this.performTieBreak(session, req)) {
                    this._log('error', 'Tie break new session because of duplicate sids');
                    return this._sendError(sender, rid, {
                        condition: 'conflict',
                        jingleCondition: 'tie-break'
                    });
                }
            }
            else {
                // The other side is just doing it wrong.
                this._log('error', 'Someone is doing this wrong');
                return this._sendError(sender, rid, {
                    condition: 'unexpected-request',
                    jingleCondition: 'out-of-order'
                });
            }
        }
        else if (this.peers[sender] && this.peers[sender].length) {
            // Check if we need to have a tie breaker because we already have
            // a different session with this peer that is using the requested
            // content application types.
            for (let i = 0, len = this.peers[sender].length; i < len; i++) {
                const sess = this.peers[sender][i];
                if (sess &&
                    sess.state === 'pending' &&
                    octetCompare(sess.sid, sid) > 0 &&
                    this.performTieBreak(sess, req)) {
                    this._log('info', 'Tie break session-initiate');
                    return this._sendError(sender, rid, {
                        condition: 'conflict',
                        jingleCondition: 'tie-break'
                    });
                }
            }
        }
        // We've now weeded out invalid requests, so we can process the action now.
        if (action === 'session-initiate') {
            if (!contents.length) {
                return self._sendError(sender, rid, {
                    condition: 'bad-request'
                });
            }
            session = this._createIncomingSession({
                applicationTypes,
                config: this.config.peerConnectionConfig,
                constraints: this.config.peerConnectionConstraints,
                iceServers: this.iceServers,
                initiator: false,
                parent: this,
                peerID: sender,
                sid,
                transportTypes
            }, req);
        }
        session.process(action, req.jingle, err => {
            if (err) {
                this._log('error', 'Could not process request', req, err);
                this._sendError(sender, rid, err);
            }
            else {
                this.emit('send', {
                    id: rid,
                    to: sender,
                    type: 'result'
                });
                // Wait for the initial action to be processed before emitting
                // the session for the user to accept/reject.
                if (action === 'session-initiate') {
                    this.emit('incoming', session);
                }
            }
        });
    }
}

let root;
if (typeof window !== 'undefined') {
    root = window;
}
if (typeof global !== 'undefined') {
    root = global;
}
function Jingle$1 (client) {
    const jingle = (client.jingle = new SessionManager());
    client.supportedICEServiceTypes = {
        stun: true,
        stuns: true,
        turn: true,
        turns: true
    };
    client.disco.addFeature(JINGLE_1);
    if (root && root.RTCPeerConnection) {
        const caps = [
            JINGLE_RTP_1,
            JINGLE_RTP_RTCP_FB_0,
            JINGLE_RTP_HDREXT_0,
            JINGLE_RTP_SSMA_0,
            JINGLE_DTLS_0,
            JINGLE_GROUPING_0,
            FILE_TRANSFER_3,
            JINGLE_ICE_UDP_1,
            JINGLE_RTP_AUDIO,
            JINGLE_RTP_VIDEO,
            'urn:xmpp:jingle:transports:dtls-sctp:1',
            'urn:ietf:rfc:3264',
            'urn:ietf:rfc:5576',
            'urn:ietf:rfc:5888'
        ];
        for (const cap of caps) {
            client.disco.addFeature(cap);
        }
    }
    const mappedEvents = [
        'outgoing',
        'incoming',
        'accepted',
        'terminated',
        'ringing',
        'mute',
        'unmute',
        'hold',
        'resumed'
    ];
    for (const event of mappedEvents) {
        jingle.on(event, function (session, arg1) {
            client.emit('jingle:' + event, session, arg1);
        });
    }
    jingle.on('createdSession', function (session) {
        client.emit('jingle:created', session);
    });
    jingle.on('send', function (data) {
        client.sendIq(data, function (err, result) {
            if (err) {
                client.emit('jingle:error', err);
            }
            const resp = err || result;
            if (!resp.jingle) {
                resp.jingle = {};
            }
            resp.jingle.sid = data.jingle.sid;
            jingle.process(resp);
        });
    });
    client.on('session:bound', 'jingle', function (jid) {
        jingle.selfID = jid.full;
    });
    client.on('iq:set:jingle', 'jingle', function (data) {
        jingle.process(data);
    });
    client.on('unavailable', 'jingle', function (pres) {
        const peer = pres.from.full;
        jingle.endPeerSessions(peer, true);
    });
    client.discoverICEServers = function (cb) {
        return this.getServices(client.config.server)
            .then(function (res) {
            const services = res.services.services;
            const discovered = [];
            for (let i = 0; i < services.length; i++) {
                const service = services[i];
                const ice = {};
                if (!client.supportedICEServiceTypes[service.type]) {
                    continue;
                }
                if (service.type === 'stun' || service.type === 'stuns') {
                    ice.urls = service.type + ':' + service.host;
                    if (service.port) {
                        ice.urls += ':' + service.port;
                    }
                    discovered.push(ice);
                    client.jingle.addICEServer(ice);
                }
                else if (service.type === 'turn' || service.type === 'turns') {
                    ice.urls = service.type + ':' + service.host;
                    if (service.port) {
                        ice.urls += ':' + service.port;
                    }
                    if (service.transport && service.transport !== 'udp') {
                        ice.urls += '?transport=' + service.transport;
                    }
                    if (service.username) {
                        ice.username = service.username;
                    }
                    if (service.password) {
                        ice.credential = service.password;
                    }
                    discovered.push(ice);
                    client.jingle.addICEServer(ice);
                }
            }
            return discovered;
        })
            .then(function (result) {
            if (cb) {
                cb(null, result);
            }
            return result;
        }, function (err) {
            if (cb) {
                cb(err);
            }
            else {
                throw err;
            }
        });
    };
}

function checkConnection(client, timeout) {
    return timeoutPromise(new Promise(function (resolve, reject) {
        if (client.sm.started) {
            client.once('stream:management:ack', resolve);
            client.sm.request();
        }
        else {
            client
                .ping()
                .then(resolve)
                .catch(function (err) {
                if (err.error && err.error.condition !== 'timeout') {
                    resolve();
                }
                else {
                    reject();
                }
            });
        }
    }), timeout * 1000 || 15000);
}
function KeepAlive (client) {
    client.enableKeepAlive = function (opts) {
        opts = opts || {};
        // Ping every 5 minutes
        opts.interval = opts.interval || 300;
        // Disconnect if no response in 15 seconds
        opts.timeout = opts.timeout || 15;
        function keepalive() {
            if (client.sessionStarted) {
                checkConnection(client, opts.timeout).catch(function () {
                    // Kill the apparently dead connection without closing
                    // the stream itself so we can reconnect and potentially
                    // resume the session.
                    client.emit('stream:error', {
                        condition: 'connection-timeout',
                        text: 'Server did not respond in ' + opts.timeout + ' seconds'
                    });
                    if (client.transport) {
                        client.transport.hasStream = false;
                        client.transport.disconnect();
                    }
                });
            }
        }
        client._keepAliveInterval = setInterval(keepalive, opts.interval * 1000);
    };
    client.disableKeepAlive = function () {
        if (client._keepAliveInterval) {
            clearInterval(client._keepAliveInterval);
            delete client._keepAliveInterval;
        }
    };
    client.on('disconnected', function () {
        client.disableKeepAlive();
    });
}

function Logging (client) {
    client.disco.addFeature('', EVENTLOG);
    client.sendLog = function (jid, logData) {
        client.sendMessage({
            log: logData,
            to: jid,
            type: 'normal'
        });
    };
}

function MAM$1 (client) {
    client.disco.addFeature(MAM_2);
    client.getHistorySearchForm = function (jid, cb) {
        return client.sendIq({
            mam: true,
            to: jid,
            type: 'get'
        }, cb);
    };
    client.searchHistory = function (opts, cb) {
        const queryid = this.nextId();
        opts = opts || {};
        opts.queryid = queryid;
        const to = opts.jid || opts.to || '';
        delete opts.jid;
        delete opts.to;
        if (!opts.form) {
            opts.form = {};
        }
        opts.form.type = 'submit';
        const fields = (opts.form.fields = opts.form.fields || []);
        const defaultFields = ['FORM_TYPE', 'with', 'start', 'end'];
        for (const name of defaultFields) {
            if (opts[name] || name === 'FORM_TYPE') {
                let val = opts[name];
                const isDate = name === 'start' || name === 'end';
                if (isDate && typeof val !== 'string') {
                    val = val.toISOString();
                }
                if (name === 'FORM_TYPE') {
                    val = MAM_2;
                }
                for (let i = 0, len = fields.length; i < len; i++) {
                    if (fields[i].name === name) {
                        continue;
                    }
                }
                {
                    fields.push({
                        name: name,
                        value: val
                    });
                }
                delete opts[name];
            }
        }
        const dest = new JID(to || client.jid.bare);
        const allowed = {};
        allowed[''] = true;
        allowed[dest.full] = true;
        allowed[dest.bare] = true;
        allowed[dest.domain] = true;
        allowed[client.jid.bare] = true;
        allowed[client.jid.domain] = true;
        const results = [];
        this.on('mam:item:' + queryid, 'session', function (msg) {
            if (!allowed[msg.from.full]) {
                return;
            }
            results.push(msg.mamItem);
        });
        const mamQuery = this.sendIq({
            id: queryid,
            mam: opts,
            to: to,
            type: 'set'
        });
        return timeoutPromise(mamQuery, this.config.timeout * 1000 || 15000, () => ({
            error: {
                condition: 'timeout'
            },
            id: queryid,
            type: 'error'
        }))
            .then(mamRes => {
            mamRes.mamResult.items = results;
            this.off('mam:item:' + queryid);
            if (cb) {
                cb(null, mamRes);
            }
            return mamRes;
        })
            .catch(err => {
            this.off('mam:item:' + queryid);
            if (cb) {
                cb(err);
            }
            else {
                throw err;
            }
        });
    };
    client.getHistoryPreferences = function (cb) {
        return this.sendIq({
            mamPrefs: true,
            type: 'get'
        }, cb);
    };
    client.setHistoryPreferences = function (opts, cb) {
        return this.sendIq({
            mamPrefs: opts,
            type: 'set'
        }, cb);
    };
    client.on('message', function (msg) {
        if (msg.mamItem) {
            client.emit('mam:item', msg);
            client.emit('mam:item:' + msg.mamItem.queryid, msg);
        }
    });
}

function Markers$1 (client) {
    function enabled(msg) {
        return msg.markable && client.config.chatMarkers !== false;
    }
    client.disco.addFeature(CHAT_MARKERS_0);
    client.on('message', function (msg) {
        if (enabled(msg)) {
            client.markReceived(msg);
            return;
        }
        if (msg.received) {
            return client.emit('marker:received', msg);
        }
        if (msg.displayed) {
            return client.emit('marker:displayed', msg);
        }
        if (msg.acknowledged) {
            return client.emit('marker:acknowledged', msg);
        }
    });
    client.markReceived = function (msg) {
        if (enabled(msg)) {
            const to = msg.type === 'groupchat' ? new JID(msg.from.bare) : msg.from;
            client.sendMessage({
                body: '',
                received: msg.id,
                to,
                type: msg.type
            });
        }
    };
    client.markDisplayed = function (msg) {
        if (enabled(msg)) {
            const to = msg.type === 'groupchat' ? new JID(msg.from.bare) : msg.from;
            client.sendMessage({
                body: '',
                displayed: msg.id,
                to,
                type: msg.type
            });
        }
    };
    client.markAcknowledged = function (msg) {
        if (enabled(msg)) {
            const to = msg.type === 'groupchat' ? new JID(msg.from.bare) : msg.from;
            client.sendMessage({
                acknowledged: msg.id,
                body: '',
                to,
                type: msg.type
            });
        }
    };
}

function MUC$2 (client) {
    client.disco.addFeature(MUC);
    client.disco.addFeature(MUC_DIRECT_INVITE);
    client.disco.addFeature(HATS_0);
    client.joinedRooms = {};
    client.joiningRooms = {};
    function rejoinRooms() {
        const oldJoiningRooms = client.joiningRooms;
        client.joiningRooms = {};
        for (const room of Object.keys(oldJoiningRooms)) {
            const nick = oldJoiningRooms[room];
            client.joinRoom(room, nick);
        }
        const oldJoinedRooms = client.joinedRooms;
        client.joinedRooms = {};
        for (const room of Object.keys(oldJoinedRooms)) {
            const nick = oldJoinedRooms[room];
            client.joinRoom(room, nick);
        }
    }
    client.on('session:started', rejoinRooms);
    client.on('stream:management:resumed', rejoinRooms);
    client.on('message', function (msg) {
        if (msg.muc) {
            if (msg.muc.invite) {
                client.emit('muc:invite', {
                    from: msg.muc.invite.from,
                    password: msg.muc.password,
                    reason: msg.muc.invite.reason,
                    room: msg.from,
                    thread: msg.muc.invite.thread,
                    type: 'mediated'
                });
            }
            else if (msg.muc.decline) {
                client.emit('muc:declined', {
                    from: msg.muc.decline.from,
                    reason: msg.muc.decline.reason,
                    room: msg.from
                });
            }
            else {
                client.emit('muc:other', {
                    muc: msg.muc,
                    room: msg.from,
                    to: msg.to
                });
            }
        }
        else if (msg.mucInvite) {
            client.emit('muc:invite', {
                from: msg.from,
                password: msg.mucInvite.password,
                reason: msg.mucInvite.reason,
                room: msg.mucInvite.jid,
                thread: msg.mucInvite.thread,
                type: 'direct'
            });
        }
        if (msg.type === 'groupchat' && msg.subject) {
            client.emit('muc:subject', msg);
        }
    });
    client.on('presence', function (pres) {
        if (client.joiningRooms[pres.from.bare] && pres.type === 'error') {
            delete client.joiningRooms[pres.from.bare];
            client.emit('muc:failed', pres);
            client.emit('muc:error', pres);
        }
        else if (pres.muc) {
            const isSelf = pres.muc.codes && pres.muc.codes.indexOf('110') >= 0;
            if (pres.type === 'error') {
                client.emit('muc:error', pres);
            }
            else if (pres.type === 'unavailable') {
                client.emit('muc:unavailable', pres);
                if (isSelf) {
                    client.emit('muc:leave', pres);
                    delete client.joinedRooms[pres.from.bare];
                }
                if (pres.muc.destroyed) {
                    client.emit('muc:destroyed', {
                        newRoom: pres.muc.destroyed.jid,
                        password: pres.muc.destroyed.password,
                        reason: pres.muc.destroyed.reason,
                        room: pres.from
                    });
                }
            }
            else {
                client.emit('muc:available', pres);
                if (isSelf && !client.joinedRooms[pres.from.bare]) {
                    client.emit('muc:join', pres);
                    delete client.joiningRooms[pres.from.bare];
                    client.joinedRooms[pres.from.bare] = pres.from.resource;
                }
            }
        }
    });
    client.joinRoom = function (room, nick, opts) {
        opts = opts || {};
        opts.to = room + '/' + nick;
        opts.caps = this.disco.caps;
        opts.joinMuc = opts.joinMuc || {};
        this.joiningRooms[room] = nick;
        this.sendPresence(opts);
    };
    client.leaveRoom = function (room, nick, opts) {
        opts = opts || {};
        opts.to = room + '/' + nick;
        opts.type = 'unavailable';
        this.sendPresence(opts);
    };
    client.ban = function (room, jid, reason, cb) {
        client.setRoomAffiliation(room, jid, 'outcast', reason, cb);
    };
    client.kick = function (room, nick, reason, cb) {
        client.setRoomRole(room, nick, 'none', reason, cb);
    };
    client.invite = function (room, opts) {
        client.sendMessage({
            muc: {
                invites: opts
            },
            to: room
        });
    };
    client.directInvite = function (room, opts) {
        opts.jid = room;
        client.sendMessage({
            mucInvite: opts,
            to: opts.to
        });
    };
    client.declineInvite = function (room, sender, reason) {
        client.sendMessage({
            muc: {
                decline: {
                    reason: reason,
                    to: sender
                }
            },
            to: room
        });
    };
    client.changeNick = function (room, nick) {
        client.sendPresence({
            to: new JID(room).bare + '/' + nick
        });
    };
    client.setSubject = function (room, subject) {
        client.sendMessage({
            subject: subject,
            to: room,
            type: 'groupchat'
        });
    };
    client.discoverReservedNick = function (room, cb) {
        client.getDiscoInfo(room, 'x-roomuser-item', function (err, res) {
            if (err) {
                return cb(err);
            }
            const ident = res.discoInfo.identities[0] || {};
            cb(null, ident.name);
        });
    };
    client.requestRoomVoice = function (room) {
        client.sendMessage({
            form: {
                fields: [
                    {
                        name: 'FORM_TYPE',
                        value: 'http://jabber.org/protocol/muc#request'
                    },
                    {
                        name: 'muc#role',
                        type: 'text-single',
                        value: 'participant'
                    }
                ]
            },
            to: room
        });
    };
    client.setRoomAffiliation = function (room, jid, affiliation, reason, cb) {
        return this.sendIq({
            mucAdmin: {
                affiliation: affiliation,
                jid: jid,
                reason: reason
            },
            to: room,
            type: 'set'
        }, cb);
    };
    client.setRoomRole = function (room, nick, role, reason, cb) {
        return this.sendIq({
            mucAdmin: {
                nick: nick,
                reason: reason,
                role: role
            },
            to: room,
            type: 'set'
        }, cb);
    };
    client.getRoomMembers = function (room, opts, cb) {
        return this.sendIq({
            mucAdmin: opts,
            to: room,
            type: 'get'
        }, cb);
    };
    client.getRoomConfig = function (jid, cb) {
        return this.sendIq({
            mucOwner: true,
            to: jid,
            type: 'get'
        }, cb);
    };
    client.configureRoom = function (jid, form, cb) {
        if (!form.type) {
            form.type = 'submit';
        }
        return this.sendIq({
            mucOwner: {
                form: form
            },
            to: jid,
            type: 'set'
        }, cb);
    };
    client.destroyRoom = function (jid, opts, cb) {
        return this.sendIq({
            mucOwner: {
                destroy: opts
            },
            to: jid,
            type: 'set'
        }, cb);
    };
    client.getUniqueRoomName = function (jid, cb) {
        return this.sendIq({
            mucUnique: true,
            to: jid,
            type: 'get'
        }, cb);
    };
}

function Mood$1 (client) {
    client.disco.addFeature(MOOD);
    client.disco.addFeature(PEP_NOTIFY(MOOD));
    client.on('pubsub:event', function (msg) {
        if (!msg.event.updated) {
            return;
        }
        if (msg.event.updated.node !== MOOD) {
            return;
        }
        client.emit('mood', {
            jid: msg.from,
            mood: msg.event.updated.published[0].mood
        });
    });
    client.publishMood = function (mood, text, cb) {
        return this.publish('', MOOD, {
            mood: {
                text: text,
                value: mood
            }
        }, cb);
    };
}

function Nick$1 (client) {
    client.disco.addFeature(NICK);
    client.disco.addFeature(PEP_NOTIFY(NICK));
    client.on('pubsub:event', function (msg) {
        if (!msg.event.updated) {
            return;
        }
        if (msg.event.updated.node !== NICK) {
            return;
        }
        client.emit('nick', {
            jid: msg.from,
            nick: msg.event.updated.published[0].nick
        });
    });
    client.publishNick = function (nick, cb) {
        return this.publish('', NICK, {
            nick: nick
        }, cb);
    };
}

function Ping$1 (client) {
    client.disco.addFeature(PING);
    client.on('iq:get:ping', function (iq) {
        client.sendIq(iq.resultReply());
    });
    client.ping = function (jid, cb) {
        return this.sendIq({
            ping: true,
            to: jid,
            type: 'get'
        }, cb);
    };
}

function Private$1 (client) {
    client.getPrivateData = function (opts, cb) {
        return this.sendIq({
            privateStorage: opts,
            type: 'get'
        }, cb);
    };
    client.setPrivateData = function (opts, cb) {
        return this.sendIq({
            privateStorage: opts,
            type: 'set'
        }, cb);
    };
}

function Push$1 (client) {
    client.disco.addFeature(PUSH_0);
    client.enableNotifications = function (jid, node, fieldList, cb) {
        const fields = [
            {
                name: 'FORM_TYPE',
                value: 'http://jabber.org/protocol/pubsub#publish-options'
            }
        ];
        const iq = {
            enablePush: {
                jid: jid,
                node: node
            },
            type: 'set'
        };
        if (fieldList && fieldList.length) {
            iq.enablePush.form = {
                fields: fields.concat(fieldList),
                type: 'submit'
            };
        }
        return this.sendIq(iq, cb);
    };
    client.disableNotifications = function (jid, node, cb) {
        const iq = {
            disablePush: {
                jid: jid
            },
            type: 'set'
        };
        if (node) {
            iq.disablePush.node = node;
        }
        return this.sendIq(iq, cb);
    };
}

function PubSub (client) {
    client.on('message', function (msg) {
        if (msg.event) {
            client.emit('pubsub:event', msg);
            client.emit('pubsubEvent', msg);
            if (msg.event.updated) {
                const published = msg.event.updated.published;
                const retracted = msg.event.updated.retracted;
                if (published && published.length) {
                    client.emit('pubsub:published', msg);
                }
                if (retracted && retracted.length) {
                    client.emit('pubsub:retracted', msg);
                }
            }
            if (msg.event.purged) {
                client.emit('pubsub:purged', msg);
            }
            if (msg.event.deleted) {
                client.emit('pubsub:deleted', msg);
            }
            if (msg.event.subscriptionChanged) {
                client.emit('pubsub:subscription', msg);
            }
            if (msg.event.configurationChanged) {
                client.emit('pubsub:config', msg);
            }
        }
        if (msg.pubsub && msg.pubsub.affiliations) {
            client.emit('pubsub:affiliation', msg);
        }
    });
    client.subscribeToNode = function (jid, opts, cb) {
        if (typeof opts === 'string') {
            opts = {
                node: opts
            };
        }
        opts.jid = opts.jid || client.jid;
        return this.sendIq({
            pubsub: {
                subscribe: opts
            },
            to: jid,
            type: 'set'
        }, cb);
    };
    client.unsubscribeFromNode = function (jid, opts, cb) {
        if (typeof opts === 'string') {
            opts = {
                node: opts
            };
        }
        opts.jid = opts.jid || client.jid.bare;
        return this.sendIq({
            pubsub: {
                unsubscribe: opts
            },
            to: jid,
            type: 'set'
        }, cb);
    };
    client.publish = function (jid, node, item, cb) {
        return this.sendIq({
            pubsub: {
                publish: {
                    item: item,
                    node: node
                }
            },
            to: jid,
            type: 'set'
        }, cb);
    };
    client.getItem = function (jid, node, id, cb) {
        return this.sendIq({
            pubsub: {
                retrieve: {
                    item: {
                        id: id
                    },
                    node: node
                }
            },
            to: jid,
            type: 'get'
        }, cb);
    };
    client.getItems = function (jid, node, opts, cb) {
        opts = opts || {};
        opts.node = node;
        return this.sendIq({
            pubsub: {
                retrieve: {
                    max: opts.max,
                    node: node
                },
                rsm: opts.rsm
            },
            to: jid,
            type: 'get'
        }, cb);
    };
    client.retract = function (jid, node, id, notify, cb) {
        return this.sendIq({
            pubsub: {
                retract: {
                    id: id,
                    node: node,
                    notify: notify
                }
            },
            to: jid,
            type: 'set'
        }, cb);
    };
    client.purgeNode = function (jid, node, cb) {
        return this.sendIq({
            pubsubOwner: {
                purge: node
            },
            to: jid,
            type: 'set'
        }, cb);
    };
    client.deleteNode = function (jid, node, cb) {
        return this.sendIq({
            pubsubOwner: {
                del: node
            },
            to: jid,
            type: 'set'
        }, cb);
    };
    client.createNode = function (jid, node, config, cb) {
        const cmd = {
            pubsub: {
                create: node
            },
            to: jid,
            type: 'set'
        };
        if (config) {
            cmd.pubsub.config = { form: config };
        }
        return this.sendIq(cmd, cb);
    };
    client.getSubscriptions = function (jid, opts, cb) {
        opts = opts || {};
        return this.sendIq({
            pubsub: {
                subscriptions: opts
            },
            to: jid,
            type: 'get'
        }, cb);
    };
    client.getAffiliations = function (jid, opts, cb) {
        opts = opts || {};
        return this.sendIq({
            pubsub: {
                affiliations: opts
            },
            to: jid,
            type: 'get'
        }, cb);
    };
    client.getNodeSubscribers = function (jid, node, opts, cb) {
        opts = opts || {};
        opts.node = node;
        return this.sendIq({
            pubsubOwner: {
                subscriptions: opts
            },
            to: jid,
            type: 'get'
        }, cb);
    };
    client.updateNodeSubscriptions = function (jid, node, delta, cb) {
        return this.sendIq({
            pubsubOwner: {
                subscriptions: {
                    list: delta,
                    node: node
                }
            },
            to: jid,
            type: 'set'
        }, cb);
    };
    client.getNodeAffiliations = function (jid, node, opts, cb) {
        opts = opts || {};
        opts.node = node;
        return this.sendIq({
            pubsubOwner: {
                affiliations: opts
            },
            to: jid,
            type: 'get'
        }, cb);
    };
    client.updateNodeAffiliations = function (jid, node, delta, cb) {
        return this.sendIq({
            pubsubOwner: {
                affiliations: {
                    list: delta,
                    node: node
                }
            },
            to: jid,
            type: 'set'
        }, cb);
    };
}

function Reach$1 (client) {
    client.disco.addFeature(REACH_0);
    client.disco.addFeature(PEP_NOTIFY(REACH_0));
    client.on('pubsub:event', function (msg) {
        if (!msg.event.updated) {
            return;
        }
        if (msg.event.updated.node !== REACH_0) {
            return;
        }
        client.emit('reachability', {
            addresses: msg.event.updated.published[0].reach,
            jid: msg.from
        });
    });
    client.on('presence', function (pres) {
        if (!pres.reach || !pres.reach.length) {
            return;
        }
        client.emit('reachability', {
            addresses: pres.reach,
            jid: pres.from
        });
    });
    client.publishReachability = function (data, cb) {
        return this.publish('', REACH_0, {
            reach: data
        }, cb);
    };
}

function Receipts (client, stanzas, config) {
    const sendReceipts = config.sendReceipts !== false;
    client.disco.addFeature(RECEIPTS);
    client.on('message', function (msg) {
        const ackTypes = {
            chat: true,
            headline: true,
            normal: true
        };
        if (sendReceipts && ackTypes[msg.type] && msg.requestReceipt && !msg.receipt) {
            client.sendMessage({
                id: msg.id,
                receipt: msg.id,
                to: msg.from,
                type: msg.type
            });
        }
        if (msg.receipt) {
            client.emit('receipt', msg);
            client.emit('receipt:' + msg.receipt);
        }
    });
}

function Register$1 (client) {
    client.getAccountInfo = function (jid, cb) {
        return this.sendIq({
            register: true,
            to: jid,
            type: 'get'
        }, cb);
    };
    client.updateAccount = function (jid, data, cb) {
        return this.sendIq({
            register: data,
            to: jid,
            type: 'set'
        }, cb);
    };
    client.deleteAccount = function (jid, cb) {
        return this.sendIq({
            register: {
                remove: true
            },
            to: jid,
            type: 'set'
        }, cb);
    };
}

function Roster$1 (client) {
    client.on('iq:set:roster', function (iq) {
        const allowed = {};
        allowed[''] = true;
        allowed[client.jid.bare] = true;
        allowed[client.jid.domain] = true;
        if (!allowed[iq.from.full]) {
            return client.sendIq(iq.errorReply({
                error: {
                    condition: 'service-unavailable',
                    type: 'cancel'
                }
            }));
        }
        client.emit('roster:update', iq);
        client.sendIq({
            id: iq.id,
            type: 'result'
        });
    });
    client.getRoster = function (cb) {
        return client
            .sendIq({
            roster: {
                ver: this.config.rosterVer
            },
            type: 'get'
        })
            .then(resp => {
            if (resp.roster) {
                const ver = resp.roster.ver;
                if (ver) {
                    this.config.rosterVer = ver;
                    this.emit('roster:ver', ver);
                }
            }
            return resp;
        })
            .then(function (result) {
            if (cb) {
                cb(null, result);
            }
            return result;
        }, function (err) {
            if (cb) {
                cb(err);
            }
            else {
                throw err;
            }
        });
    };
    client.updateRosterItem = function (item, cb) {
        return client.sendIq({
            roster: {
                items: [item]
            },
            type: 'set'
        }, cb);
    };
    client.removeRosterItem = function (jid, cb) {
        return client.updateRosterItem({ jid: jid, subscription: 'remove' }, cb);
    };
    client.subscribe = function (jid) {
        client.sendPresence({ type: 'subscribe', to: jid });
    };
    client.unsubscribe = function (jid) {
        client.sendPresence({ type: 'unsubscribe', to: jid });
    };
    client.acceptSubscription = function (jid) {
        client.sendPresence({ type: 'subscribed', to: jid });
    };
    client.denySubscription = function (jid) {
        client.sendPresence({ type: 'unsubscribed', to: jid });
    };
}

function RTT$1 (client) {
    client.disco.addFeature(RTT_0);
    client.on('message', function (msg) {
        if (msg.rtt) {
            client.emit('rtt', msg);
            client.emit('rtt:' + msg.rtt.event, msg);
        }
    });
}

function Time$1 (client) {
    client.disco.addFeature(TIME);
    client.getTime = function (jid, cb) {
        return this.sendIq({
            time: true,
            to: jid,
            type: 'get'
        }, cb);
    };
    client.on('iq:get:time', function (iq) {
        const time = new Date();
        client.sendIq(iq.resultReply({
            time: {
                tzo: time.getTimezoneOffset(),
                utc: time
            }
        }));
    });
}

function Upload$1 (client) {
    function getUploadParameters(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            const { discoInfo } = yield client.getDiscoInfo(jid);
            if (discoInfo.features.includes('urn:xmpp:http:upload:0')) {
                const fields = discoInfo.form.fields;
                let maxSize = null;
                if (fields.some(field => field.name === 'FORM_TYPE' && field.value.includes('urn:xmpp:http:upload:0'))) {
                    maxSize = parseInt(fields.find(field => field.name === 'max-file-size').value, 10);
                }
                return { maxSize, jid };
            }
        });
    }
    client.getUploadService = function (domain = client.jid.domain) {
        return __awaiter(this, void 0, void 0, function* () {
            const domainParameters = yield getUploadParameters(domain);
            if (domainParameters) {
                return domainParameters;
            }
            const { discoItems } = yield client.getDiscoItems(domain);
            for (const item of discoItems.items) {
                const itemParameters = yield getUploadParameters(item.jid);
                if (itemParameters) {
                    return itemParameters;
                }
            }
            throw new Error('No upload service discovered on: ' + domain);
        });
    };
    client.getUploadSlot = function (uploadService, uploadRequest, cb) {
        return client.sendIq({
            to: uploadService,
            type: 'get',
            uploadRequest
        }, cb);
    };
}

function VCard (client) {
    client.disco.addFeature('vcard-temp');
    client.getVCard = function (jid, cb) {
        return this.sendIq({
            to: jid,
            type: 'get',
            vCardTemp: true
        }, cb);
    };
    client.publishVCard = function (vcard, cb) {
        return this.sendIq({
            type: 'set',
            vCardTemp: vcard
        }, cb);
    };
}

function Version$1 (client) {
    client.disco.addFeature('jabber:iq:version');
    client.on('iq:get:version', function (iq) {
        client.sendIq(iq.resultReply({
            version: client.config.softwareVersion || {
                name: 'stanzajs.org'
            }
        }));
    });
    client.getSoftwareVersion = function (jid, cb) {
        return this.sendIq({
            to: jid,
            type: 'get',
            version: true
        }, cb);
    };
}

function Plugins (client) {
    // We always need this one first
    client.use(Disco$2);
    client.use(DiscoOnly);
    client.use(Attention);
    client.use(Avatar$1);
    client.use(Blocking$1);
    client.use(Bob);
    client.use(Bookmarks$1);
    client.use(Carbons$1);
    client.use(ChatStates);
    client.use(Command$1);
    client.use(Correction);
    client.use(CSI$2);
    client.use(DataForms);
    client.use(ExtDisco$1);
    client.use(Geoloc);
    client.use(Invisible);
    client.use(JIDPrep$1);
    client.use(Jingle$1);
    client.use(KeepAlive);
    client.use(Logging);
    client.use(MAM$1);
    client.use(Markers$1);
    client.use(MUC$2);
    client.use(Mood$1);
    client.use(Nick$1);
    client.use(Ping$1);
    client.use(Private$1);
    client.use(Push$1);
    client.use(PubSub);
    client.use(Reach$1);
    client.use(Receipts);
    client.use(Register$1);
    client.use(Roster$1);
    client.use(RTT$1);
    client.use(Time$1);
    client.use(Upload$1);
    client.use(VCard);
    client.use(Version$1);
}

const VERSION$2 = '11.3.2';
const JID$1 = JID;
function createClient(opts) {
    const client = new Client(opts);
    client.use(Plugins);
    return client;
}

export { Client, JID$1 as JID, VERSION$2 as VERSION, createClient, jid };
