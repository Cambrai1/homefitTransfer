"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class External {
    response(cred) {
        return cred.authzid || '';
    }
    challenge() {
        return undefined;
    }
}
exports.default = External;
External.prototype.name = 'EXTERNAL';
External.prototype.clientFirst = true;
