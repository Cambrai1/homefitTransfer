"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fetch_1 = tslib_1.__importDefault(require("../lib/fetch"));
const protocol_1 = require("../protocol");
async function promiseAny(promises) {
    try {
        const errors = await Promise.all(promises.map(p => {
            return p.then(val => Promise.reject(val), err => Promise.resolve(err));
        }));
        return Promise.reject(errors);
    }
    catch (val) {
        return Promise.resolve(val);
    }
}
async function getHostMeta(JXT, opts) {
    if (typeof opts === 'string') {
        opts = { host: opts };
    }
    const config = {
        json: true,
        ssl: true,
        xrd: true,
        ...opts
    };
    const scheme = config.ssl ? 'https://' : 'http://';
    return promiseAny([
        fetch_1.default(`${scheme}${config.host}/.well-known/host-meta.json`).then(async (res) => {
            if (!res.ok) {
                throw new Error('could-not-fetch-json');
            }
            return res.json();
        }),
        fetch_1.default(`${scheme}${config.host}/.well-known/host-meta`).then(async (res) => {
            if (!res.ok) {
                throw new Error('could-not-fetch-xml');
            }
            const data = await res.text();
            return JXT.parse(data);
        })
    ]);
}
exports.getHostMeta = getHostMeta;
function default_1(client, stanzas) {
    client.discoverBindings = function (server, cb) {
        getHostMeta(stanzas, server)
            .then(data => {
            const results = {
                bosh: [],
                websocket: []
            };
            const links = data.links || [];
            for (const link of links) {
                if (link.href && link.rel === protocol_1.Namespaces.ALT_CONNECTIONS_WEBSOCKET) {
                    results.websocket.push(link.href);
                }
                if (link.href && link.rel === protocol_1.Namespaces.ALT_CONNECTIONS_XBOSH) {
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
exports.default = default_1;
