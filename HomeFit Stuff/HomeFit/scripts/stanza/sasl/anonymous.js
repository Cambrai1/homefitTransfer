"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Anonymous {
    response(cred) {
        return cred.trace || '';
    }
    challenge() {
        return undefined;
    }
}
exports.default = Anonymous;
Anonymous.prototype.name = 'ANONYMOUS';
Anonymous.prototype.clientFirst = true;
