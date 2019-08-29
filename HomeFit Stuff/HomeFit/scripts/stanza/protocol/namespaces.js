"use strict";
// ================================================================
// RFCS
// ================================================================
Object.defineProperty(exports, "__esModule", { value: true });
// RFC 6120
exports.BIND = 'urn:ietf:params:xml:ns:xmpp-bind';
exports.CLIENT = 'jabber:client';
exports.SASL = 'urn:ietf:params:xml:ns:xmpp-sasl';
exports.SERVER = 'jabber:server';
exports.SESSION = 'urn:ietf:params:xml:ns:xmpp-session';
exports.STANZA_ERROR = 'urn:ietf:params:xml:ns:xmpp-stanzas';
exports.STREAM = 'http://etherx.jabber.org/streams';
exports.STREAM_ERROR = 'urn:ietf:params:xml:ns:xmpp-streams';
// RFC 6121
exports.ROSTER = 'jabber:iq:roster';
exports.ROSTER_VERSIONING = 'urn:xmpp:features:rosterver';
exports.SUBSCRIPTION_PREAPPROVAL = 'urn:xmpp:features:pre-approval';
// RFC 7395
exports.FRAMING = 'urn:ietf:params:xml:ns:xmpp-framing';
// ================================================================
// XEPS
// ================================================================
// XEP-0004
exports.DATAFORM = 'jabber:x:data';
// XEP-0009
exports.RPC = 'jabber:iq:rpc';
// XEP-0012
exports.LAST_ACTIVITY = 'jabber:iq:last';
// XEP-0016
exports.PRIVACY = 'jabber:iq:privacy';
// XEP-0030
exports.DISCO_INFO = 'http://jabber.org/protocol/disco#info';
exports.DISCO_ITEMS = 'http://jabber.org/protocol/disco#items';
// XEP-0033
exports.ADDRESS = 'http://jabber.org/protocol/address';
// XEP-0045
exports.MUC = 'http://jabber.org/protocol/muc';
exports.MUC_ADMIN = 'http://jabber.org/protocol/muc#admin';
exports.MUC_OWNER = 'http://jabber.org/protocol/muc#owner';
exports.MUC_USER = 'http://jabber.org/protocol/muc#user';
// XEP-0047
exports.IBB = 'http://jabber.org/protocol/ibb';
// XEP-0048
exports.BOOKMARKS = 'storage:bookmarks';
// XEP-0049
exports.PRIVATE = 'jabber:iq:private';
// XEP-0050
exports.ADHOC_COMMANDS = 'http://jabber.org/protocol/commands';
// XEP-0054
exports.VCARD_TEMP = 'vcard-temp';
// XEP-0055
exports.SEARCH = 'jabber:iq:search';
// XEP-0059
exports.RSM = 'http://jabber.org/protocol/rsm';
// XEP-0060
exports.PUBSUB = 'http://jabber.org/protocol/pubsub';
exports.PUBSUB_ERRORS = 'http://jabber.org/protocol/pubsub#errors';
exports.PUBSUB_EVENT = 'http://jabber.org/protocol/pubsub#event';
exports.PUBSUB_OWNER = 'http://jabber.org/protocol/pubsub#owner';
// XEP-0065
exports.SOCKS5 = 'http://jabber.org/protocol/bytestreams';
// XEP-0066
exports.OOB_IQ = 'jabber:iq:oob';
exports.OOB = 'jabber:x:oob';
// XEP-0070
exports.HTTP_AUTH = 'http://jabber.org/protocol/http-auth';
// XEP-0071
exports.XHTML_IM = 'http://jabber.org/protocol/xhtml-im';
// XEP-0077
exports.REGISTER = 'jabber:iq:register';
// XEP-0079
exports.AMP = 'http://jabber.org/protocol/amp';
// XEP-0080
exports.GEOLOC = 'http://jabber.org/protocol/geoloc';
// XEP-0083
exports.ROSTER_DELIMITER = 'roster:delimiter';
// XEP-0084
exports.AVATAR_DATA = 'urn:xmpp:avatar:data';
exports.AVATAR_METADATA = 'urn:xmpp:avatar:metadata';
// XEP-0085
exports.CHAT_STATES = 'http://jabber.org/protocol/chatstates';
// XEP-0092
exports.VERSION = 'jabber:iq:version';
// XEP-0107
exports.MOOD = 'http://jabber.org/protocol/mood';
// XEP-0108
exports.ACTIVITY = 'http://jabber.org/protocol/activity';
// XEP-0114
exports.COMPONENT = 'jabber:component:accept';
// XEP-0115
exports.CAPS = 'http://jabber.org/protocol/caps';
// XEP-0118
exports.TUNE = 'http://jabber.org/protocol/tune';
// XEP-0122
exports.DATAFORM_VALIDATION = 'http://jabber.org/protocol/xdata-validate';
// XEP-0124
exports.BOSH = 'http://jabber.org/protocol/httpbind';
// XEP-0131
exports.SHIM = 'http://jabber.org/protocol/shim';
// XEP-0138
exports.COMPRESSION = 'http://jabber.org/features/compress';
// XEP-0141
exports.DATAFORM_LAYOUT = 'http://jabber.org/protocol/xdata-layout';
// XEP-0144
exports.ROSTER_EXCHANGE = 'http://jabber.org/protocol/rosterx';
// XEP-0145
exports.ROSTER_NOTES = 'storage:rosternotes';
// XEP-0152
exports.REACH_0 = 'urn:xmpp:reach:0';
// XEP-0153
exports.VCARD_TEMP_UPDATE = 'vcard-temp:x:update';
// XEP-0156
exports.ALT_CONNECTIONS_WEBSOCKET = 'urn:xmpp:alt-connections:websocket';
exports.ALT_CONNECTIONS_XBOSH = 'urn:xmpp:alt-connections:xbosh';
// XEP-0158
exports.CAPTCHA = 'urn:xmpp:captcha';
// XEP-0163
exports.PEP_NOTIFY = ns => `${ns}+notify`;
// XEP-0166
exports.JINGLE_1 = 'urn:xmpp:jingle:1';
exports.JINGLE_ERRORS_1 = 'urn:xmpp:jingle:errors:1';
// XEP-0167
exports.JINGLE_RTP_1 = 'urn:xmpp:jingle:apps:rtp:1';
exports.JINGLE_RTP_ERRORS_1 = 'urn:xmpp:jingle:apps:rtp:errors:1';
exports.JINGLE_RTP_INFO_1 = 'urn:xmpp:jingle:apps:rtp:info:1';
exports.JINGLE_RTP_AUDIO = 'urn:xmpp:jingle:apps:rtp:audio';
exports.JINGLE_RTP_VIDEO = 'urn:xmpp:jingle:apps:rtp:video';
// XEP-0171
exports.LANG_TRANS = 'urn:xmpp:langtrans';
exports.LANG_TRANS_ITEMS = 'urn:xmpp:langtrans:items';
// XEP-0172
exports.NICK = 'http://jabber.org/protocol/nick';
// XEP-0176
exports.JINGLE_ICE_UDP_1 = 'urn:xmpp:jingle:transports:ice-udp:1';
// XEP-0177
exports.JINGLE_RAW_UDP_1 = 'urn:xmpp:jingle:transports:raw-udp:1';
// XEP-0184
exports.RECEIPTS = 'urn:xmpp:receipts';
// XEP-0186
exports.INVISIBLE_0 = 'urn:xmpp:invisible:0';
// XEP-0191
exports.BLOCKING = 'urn:xmpp:blocking';
// XEP-0198
exports.SMACKS_3 = 'urn:xmpp:sm:3';
// XEP-0199
exports.PING = 'urn:xmpp:ping';
// XEP-0202
exports.TIME = 'urn:xmpp:time';
// XEP-0203
exports.DELAY = 'urn:xmpp:delay';
// XEP-0206
exports.BOSH_XMPP = 'urn:xmpp:xbosh';
// XEP-0215
exports.DISCO_EXTERNAL_1 = 'urn:xmpp:extdisco:1';
// XEP-0221
exports.DATAFORM_MEDIA = 'urn:xmpp:media-element';
// XEP-0224
exports.ATTENTION_0 = 'urn:xmpp:attention:0';
// XEP-0231
exports.BOB = 'urn:xmpp:bob';
// XEP-0234
exports.FILE_TRANSFER_3 = 'urn:xmpp:jingle:apps:file-transfer:3';
exports.FILE_TRANSFER_4 = 'urn:xmpp:jingle:apps:file-transfer:4';
exports.FILE_TRANSFER_5 = 'urn:xmpp:jingle:apps:file-transfer:5';
// XEP-0249
exports.MUC_DIRECT_INVITE = 'jabber:x:conference';
// XEP-0258
exports.SEC_LABEL_0 = 'urn:xmpp:sec-label:0';
exports.SEC_LABEL_CATALOG_2 = 'urn:xmpp:sec-label:catalog:2';
exports.SEC_LABEL_ESS_0 = 'urn:xmpp:sec-label:ess:0';
// XEP-0260
exports.JINGLE_SOCKS5_1 = 'urn:xmpp:jingle:transports:s5b:1';
// XEP-0261
exports.JINGLE_IBB_1 = 'urn:xmpp:jingle:transports:ibb:1';
// XEP-0262
exports.JINGLE_RTP_ZRTP_1 = 'urn:xmpp:jingle:apps:rtp:zrtp:1';
// XEP-0264
exports.THUMBS_0 = 'urn:xmpp:thumbs:0';
exports.THUMBS_1 = 'urn:xmpp:thumbs:1';
// XEP-0276
exports.DECLOAKING_0 = 'urn:xmpp:decloaking:0';
// XEP-0280
exports.CARBONS_2 = 'urn:xmpp:carbons:2';
// XEP-0293
exports.JINGLE_RTP_RTCP_FB_0 = 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0';
// XEP-0294
exports.JINGLE_RTP_HDREXT_0 = 'urn:xmpp:jingle:apps:rtp:rtp-hdrext:0';
// XEP-0297
exports.FORWARD_0 = 'urn:xmpp:forward:0';
// XEP-0300
exports.HASHES_1 = 'urn:xmpp:hashes:1';
exports.HASH_NAME = name => `urn:xmpp:hash-function-text-names:${name}`;
// XEP-0301
exports.RTT_0 = 'urn:xmpp:rtt:0';
// XEP-0307
exports.MUC_UNIQUE = 'http://jabber.org/protocol/muc#unique';
// XEP-308
exports.CORRECTION_0 = 'urn:xmpp:message-correct:0';
// XEP-0310
exports.PSA = 'urn:xmpp:psa';
// XEP-0313
exports.MAM_TMP = 'urn:xmpp:mam:tmp';
exports.MAM_0 = 'urn:xmpp:mam:0';
exports.MAM_1 = 'urn:xmpp:mam:1';
exports.MAM_2 = 'urn:xmpp:mam:2';
// XEP-0317
exports.HATS_0 = 'urn:xmpp:hats:0';
// XEP-0319
exports.IDLE_1 = 'urn:xmpp:idle:1';
// XEP-0320
exports.JINGLE_DTLS_0 = 'urn:xmpp:jingle:apps:dtls:0';
// XEP-0328
exports.JID_PREP_0 = 'urn:xmpp:jidprep:0';
// XEP-0333
exports.CHAT_MARKERS_0 = 'urn:xmpp:chat-markers:0';
// XEP-0334
exports.HINTS = 'urn:xmpp:hints';
// XEP-0335
exports.JSON_0 = 'urn:xmpp:json:0';
// XEP-0337
exports.EVENTLOG = 'urn:xmpp:eventlog';
// XEP-0338
exports.JINGLE_GROUPING_0 = 'urn:xmpp:jingle:apps:grouping:0';
// XEP-0339
exports.JINGLE_RTP_SSMA_0 = 'urn:xmpp:jingle:apps:rtp:ssma:0';
// XEP-0340
exports.COLIBRI = 'http://jitsi.org/protocol/colibri';
// XEP-0343
exports.DTLS_SCTP_1 = 'urn:xmpp:jingle:transports:dtls-sctp:1';
// XEP-0352
exports.CSI = 'urn:xmpp:csi:0';
// XEP-0353
exports.JINGLE_MSG_INITIATE_0 = 'urn:xmpp:jingle:jingle-message:0';
// XEP-0357
exports.PUSH_0 = 'urn:xmpp:push:0';
// XEP-0358
exports.JINGLE_PUB_1 = 'urn:xmpp:jinglepub:1';
// XEP-0359
exports.STANZA_ID_0 = 'urn:xmpp:sid:0';
// XEP-0363
exports.HTTP_UPLOAD_0 = 'urn:xmpp:http:upload:0';
// XEP-0370
exports.JINGLE_HTTP_0 = 'urn:xmpp:jingle:transports:http:0';
exports.JINGLE_HTTP_UPLOAD_0 = 'urn:xmpp:jingle:transports:http:upload:0';
// XEP-0372
exports.REFERENCE_0 = 'urn:xmpp:reference:0';
// XEP-0380
exports.EME_0 = 'urn:xmpp:eme:0';
// XEP-0382
exports.SPOILER_0 = 'urn:xmppp:spoiler:0';
// XEP-0384
exports.OMEMO_AXOLOTL = 'eu.siacs.conversations.axolotl';
exports.OMEMO_AXOLOTL_DEVICELIST = 'eu.siacs.conversations.axolotl.devicelist';
exports.OMEMO_AXOLOTL_BUNDLE = deviceId => `eu.siacs.conversations.axolotl.bundles:${deviceId}`;
// ================================================================
// OTHER
// ================================================================
exports.XRD = 'http://docs.oasis-open.org/ns/xri/xrd-1.0';
