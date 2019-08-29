"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const jid = tslib_1.__importStar(require("./protocol/jid"));
exports.jid = jid;
const client_1 = tslib_1.__importDefault(require("./client"));
exports.Client = client_1.default;
const plugins_1 = tslib_1.__importDefault(require("./plugins"));
exports.VERSION = '11.3.2';
exports.JID = jid.JID;
function createClient(opts) {
    const client = new client_1.default(opts);
    client.use(plugins_1.default);
    return client;
}
exports.createClient = createClient;
