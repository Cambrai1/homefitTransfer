"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const anonymous_1 = tslib_1.__importDefault(require("./anonymous"));
exports.Anonymous = anonymous_1.default;
const external_1 = tslib_1.__importDefault(require("./external"));
exports.External = external_1.default;
const plain_1 = tslib_1.__importDefault(require("./plain"));
exports.Plain = plain_1.default;
const digest_md5_1 = tslib_1.__importDefault(require("./digest-md5"));
exports.DigestMD5 = digest_md5_1.default;
const scram_sha_1_1 = tslib_1.__importDefault(require("./scram-sha-1"));
exports.ScramSha1 = scram_sha_1_1.default;
const x_oauth2_1 = tslib_1.__importDefault(require("./x-oauth2"));
exports.XOauth2 = x_oauth2_1.default;
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
exports.Factory = Factory;
