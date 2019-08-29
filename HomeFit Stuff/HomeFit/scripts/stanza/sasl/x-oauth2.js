"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.default = XOAuth2;
XOAuth2.prototype.name = 'X-OAUTH2';
XOAuth2.prototype.clientFirst = true;
