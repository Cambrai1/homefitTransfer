"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
const EXPORT_MAP = {
    noCopy: 'no-copy',
    noPermanentStore: 'no-permanent-store',
    noStore: 'no-store',
    store: 'store'
};
const IMPORT_MAP = {
    'no-copy': 'noCopy',
    'no-permanent-store': 'noPermanentStore',
    'no-store': 'noStore',
    store: 'store'
};
function default_1(JXT) {
    const Utils = JXT.utils;
    JXT.withMessage(function (Message) {
        JXT.add(Message, 'processingHints', {
            get: function () {
                const results = {};
                for (let i = 0, len = this.xml.childNodes.length; i < len; i++) {
                    const child = this.xml.childNodes[i];
                    const name = child.localName;
                    if (child.namespaceURI !== NS.HINTS) {
                        continue;
                    }
                    if (IMPORT_MAP[name]) {
                        results[IMPORT_MAP[name]] = true;
                    }
                }
                return results;
            },
            set: function (hints) {
                for (let i = 0, len = this.xml.childNodes.length; i < len; i++) {
                    const child = this.xml.childNodes[i];
                    if (child.namespaceURI === NS.HINTS) {
                        this.xml.removeChild(this.xml.childNodes[i]);
                    }
                }
                for (const key of Object.keys(hints)) {
                    if (!hints[key] || !EXPORT_MAP[key]) {
                        continue;
                    }
                    const child = Utils.createElement(NS.HINTS, EXPORT_MAP[key]);
                    this.xml.appendChild(child);
                }
            }
        });
    });
}
exports.default = default_1;
