"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const punycode = require('punycode');
exports.NATIVE_STRINGPREP = false;
function toUnicode(data) {
    return punycode.toUnicode(data);
}
exports.toUnicode = toUnicode;
function nameprep(str) {
    return str.toLowerCase();
}
exports.nameprep = nameprep;
function nodeprep(str) {
    return str.toLowerCase();
}
exports.nodeprep = nodeprep;
function resourceprep(str) {
    return str;
}
exports.resourceprep = resourceprep;
