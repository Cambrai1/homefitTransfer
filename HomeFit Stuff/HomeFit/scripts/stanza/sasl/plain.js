"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.default = Plain;
Plain.prototype.name = 'PLAIN';
Plain.prototype.clientFirst = true;
