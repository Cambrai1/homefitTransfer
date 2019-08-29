"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const async = tslib_1.__importStar(require("../lib/async"));
const WildEmitter_1 = tslib_1.__importDefault(require("../lib/WildEmitter"));
const ws_1 = tslib_1.__importDefault(require("../lib/ws"));
const WS_OPEN = 1;
class WSConnection extends WildEmitter_1.default {
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
        self.sendQueue = async.priorityQueue(function (data, cb) {
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
        self.conn = new ws_1.default(opts.wsURL, 'xmpp', opts.wsOptions);
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
exports.default = WSConnection;
