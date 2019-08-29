"use strict";
// tslint:disable no-bitwise
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("./lib/crypto");
const bth = [];
for (let i = 0; i < 256; ++i) {
    bth[i] = (i + 0x100).toString(16).substr(1);
}
async function timeoutPromise(target, delay, rejectValue = () => undefined) {
    let timeoutRef;
    const result = await Promise.race([
        target,
        new Promise((resolve, reject) => {
            timeoutRef = setTimeout(() => reject(rejectValue()), delay);
        })
    ]);
    if (timeoutRef) {
        clearTimeout(timeoutRef);
    }
    return result;
}
exports.timeoutPromise = timeoutPromise;
async function sleep(time) {
    return new Promise(resolve => {
        setTimeout(() => resolve(), time);
    });
}
exports.sleep = sleep;
function octetCompare(str1, str2) {
    const b1 = typeof str1 === 'string' ? Buffer.from(str1, 'utf8') : str1;
    const b2 = typeof str2 === 'string' ? Buffer.from(str2, 'utf8') : str2;
    return b1.compare(b2);
}
exports.octetCompare = octetCompare;
function uuid() {
    const buf = crypto_1.randomBytes(16);
    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    let i = 0;
    return [
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i++]],
        '-',
        bth[buf[i++]],
        bth[buf[i++]],
        '-',
        bth[buf[i++]],
        bth[buf[i++]],
        '-',
        bth[buf[i++]],
        bth[buf[i++]],
        '-',
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i++]],
        bth[buf[i]]
    ].join('');
}
exports.uuid = uuid;
