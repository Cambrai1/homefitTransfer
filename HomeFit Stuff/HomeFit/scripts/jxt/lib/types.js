"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const helpers = tslib_1.__importStar(require("./helpers"));
const find = helpers.find;
const createElement = helpers.createElement;
const field = (exports.field = function (getter, setter) {
    return function () {
        const args = Array.prototype.slice.call(arguments);
        return {
            get: function () {
                return getter.apply(null, [this.xml].concat(args));
            },
            set: function (value) {
                setter.apply(null, [this.xml].concat(args).concat([value]));
            }
        };
    };
});
exports.boolAttribute = field(helpers.getBoolAttribute, helpers.setBoolAttribute);
exports.subAttribute = field(helpers.getSubAttribute, helpers.setSubAttribute);
exports.boolSubAttribute = field(helpers.getSubBoolAttribute, helpers.setSubBoolAttribute);
exports.text = field(helpers.getText, helpers.setText);
exports.subText = field(helpers.getSubText, helpers.setSubText);
exports.textSub = exports.subText;
exports.multiTextSub = (exports.multiSubText = field(helpers.getMultiSubText, helpers.setMultiSubText));
exports.multiSubAttribute = field(helpers.getMultiSubAttribute, helpers.setMultiSubAttribute);
exports.subLangText = field(helpers.getSubLangText, helpers.setSubLangText);
exports.langTextSub = exports.subLangText;
exports.boolSub = field(helpers.getBoolSub, helpers.setBoolSub);
exports.langAttribute = field(function (xml) {
    return xml.getAttributeNS(helpers.XML_NS, 'lang') || '';
}, function (xml, value) {
    xml.setAttributeNS(helpers.XML_NS, 'lang', value);
});
exports.b64Text = field(function (xml) {
    if (xml.textContent && xml.textContent !== '=') {
        return Buffer.from(xml.textContent, 'base64');
    }
    return '';
}, function (xml, value) {
    if (typeof value === 'string') {
        const b64 = Buffer.from(value).toString('base64');
        xml.textContent = b64 || '=';
    }
    else {
        xml.textContent = '';
    }
});
function dateAttribute(attr, now) {
    return {
        get: function () {
            const data = helpers.getAttribute(this.xml, attr);
            if (data) {
                return new Date(data);
            }
            if (now) {
                return new Date(Date.now());
            }
        },
        set: function (value) {
            if (!value) {
                return;
            }
            if (typeof value !== 'string') {
                value = value.toISOString();
            }
            helpers.setAttribute(this.xml, attr, value);
        }
    };
}
exports.dateAttribute = dateAttribute;
function dateSub(NS, sub, now) {
    return {
        get: function () {
            const data = helpers.getSubText(this.xml, NS, sub);
            if (data) {
                return new Date(data);
            }
            if (now) {
                return new Date(Date.now());
            }
        },
        set: function (value) {
            if (!value) {
                return;
            }
            if (typeof value !== 'string') {
                value = value.toISOString();
            }
            helpers.setSubText(this.xml, NS, sub, value);
        }
    };
}
exports.dateSub = dateSub;
function dateSubAttribute(NS, sub, attr, now) {
    return {
        get: function () {
            const data = helpers.getSubAttribute(this.xml, NS, sub, attr);
            if (data) {
                return new Date(data);
            }
            if (now) {
                return new Date(Date.now());
            }
        },
        set: function (value) {
            if (!value) {
                return;
            }
            if (typeof value !== 'string') {
                value = value.toISOString();
            }
            helpers.setSubAttribute(this.xml, NS, sub, attr, value);
        }
    };
}
exports.dateSubAttribute = dateSubAttribute;
function numberAttribute(attr, isFloat, defaultVal) {
    return {
        get: function () {
            const parse = isFloat ? parseFloat : parseInt;
            const data = helpers.getAttribute(this.xml, attr, '');
            if (!data) {
                return defaultVal;
            }
            const parsed = parse(data, 10);
            if (isNaN(parsed)) {
                return defaultVal;
            }
            return parsed;
        },
        set: function (value) {
            helpers.setAttribute(this.xml, attr, value.toString());
        }
    };
}
exports.numberAttribute = numberAttribute;
function numberSub(NS, sub, isFloat, defaultVal) {
    return {
        get: function () {
            const parse = isFloat ? parseFloat : parseInt;
            const data = helpers.getSubText(this.xml, NS, sub, '');
            if (!data) {
                return defaultVal;
            }
            const parsed = parse(data, 10);
            if (isNaN(parsed)) {
                return defaultVal;
            }
            return parsed;
        },
        set: function (value) {
            helpers.setSubText(this.xml, NS, sub, value.toString());
        }
    };
}
exports.numberSub = numberSub;
function numberSubAttribute(NS, sub, name, isFloat, defaultVal) {
    return {
        get: function () {
            const parse = isFloat ? parseFloat : parseInt;
            const data = helpers.getSubAttribute(this.xml, NS, sub, name, '');
            if (!data) {
                return defaultVal;
            }
            const parsed = parse(data, 10);
            if (isNaN(parsed)) {
                return defaultVal;
            }
            return parsed;
        },
        set: function (value) {
            helpers.setSubAttribute(this.xml, NS, sub, name, value.toString());
        }
    };
}
exports.numberSubAttribute = numberSubAttribute;
function attribute(name, defaultVal) {
    return {
        get: function () {
            return helpers.getAttribute(this.xml, name, defaultVal);
        },
        set: function (value) {
            helpers.setAttribute(this.xml, name, value);
        }
    };
}
exports.attribute = attribute;
function attributeNS(NS, name, defaultVal) {
    return {
        get: function () {
            return helpers.getAttributeNS(this.xml, NS, name, defaultVal);
        },
        set: function (value) {
            helpers.setAttributeNS(this.xml, NS, name, value);
        }
    };
}
exports.attributeNS = attributeNS;
function extension(ChildJXT) {
    return {
        get: function () {
            const self = this;
            const name = ChildJXT.prototype._name;
            if (!this._extensions[name]) {
                const existing = find(this.xml, ChildJXT.prototype._NS, ChildJXT.prototype._EL);
                if (!existing.length) {
                    this._extensions[name] = new ChildJXT({}, null, self);
                    this.xml.appendChild(this._extensions[name].xml);
                }
                else {
                    this._extensions[name] = new ChildJXT(null, existing[0], self);
                }
                this._extensions[name].parent = this;
            }
            return this._extensions[name];
        },
        set: function (value) {
            if (value) {
                const child = this[ChildJXT.prototype._name];
                if (value === true) {
                    value = {};
                }
                Object.assign(child, value);
            }
        }
    };
}
exports.extension = extension;
function multiExtension(ChildJXT) {
    return {
        get: function () {
            const self = this;
            const data = find(this.xml, ChildJXT.prototype._NS, ChildJXT.prototype._EL);
            const results = [];
            for (let i = 0, len = data.length; i < len; i++) {
                results.push(new ChildJXT({}, data[i], self));
            }
            return results;
        },
        set: function (value) {
            value = value || [];
            const self = this;
            const existing = find(this.xml, ChildJXT.prototype._NS, ChildJXT.prototype._EL);
            let i;
            let len;
            for (i = 0, len = existing.length; i < len; i++) {
                self.xml.removeChild(existing[i]);
            }
            for (i = 0, len = value.length; i < len; i++) {
                const content = new ChildJXT(value[i], null, self);
                self.xml.appendChild(content.xml);
            }
        }
    };
}
exports.multiExtension = multiExtension;
function enumSub(NS, enumValues) {
    return {
        get: function () {
            const self = this;
            const result = [];
            enumValues.forEach(function (enumVal) {
                const exists = find(self.xml, NS, enumVal);
                if (exists.length) {
                    result.push(exists[0].nodeName);
                }
            });
            return result[0] || '';
        },
        set: function (value) {
            const self = this;
            let alreadyExists = false;
            enumValues.forEach(function (enumVal) {
                const elements = find(self.xml, NS, enumVal);
                if (elements.length) {
                    if (enumVal === value) {
                        alreadyExists = true;
                    }
                    else {
                        self.xml.removeChild(elements[0]);
                    }
                }
            });
            if (value && !alreadyExists) {
                const condition = createElement(NS, value);
                this.xml.appendChild(condition);
            }
        }
    };
}
exports.enumSub = enumSub;
function subExtension(name, NS, sub, ChildJXT) {
    return {
        get: function () {
            if (!this._extensions[name]) {
                let wrapper = find(this.xml, NS, sub);
                if (!wrapper.length) {
                    wrapper = createElement(NS, sub, this._NS);
                    this.xml.appendChild(wrapper);
                }
                else {
                    wrapper = wrapper[0];
                }
                const existing = find(wrapper, ChildJXT.prototype._NS, ChildJXT.prototype._EL);
                if (!existing.length) {
                    this._extensions[name] = new ChildJXT({}, null, { xml: wrapper });
                    wrapper.appendChild(this._extensions[name].xml);
                }
                else {
                    this._extensions[name] = new ChildJXT(null, existing[0], { xml: wrapper });
                }
                this._extensions[name].parent = this;
            }
            return this._extensions[name];
        },
        set: function (value) {
            const wrapper = find(this.xml, NS, sub);
            if (wrapper.length && !value) {
                this.xml.removeChild(wrapper[0]);
            }
            if (value) {
                const child = this[name];
                if (value === true) {
                    value = {};
                }
                Object.assign(child, value);
            }
        }
    };
}
exports.subExtension = subExtension;
function subMultiExtension(NS, sub, ChildJXT) {
    return {
        get: function () {
            const self = this;
            const results = [];
            let existing = find(this.xml, NS, sub);
            if (!existing.length) {
                return results;
            }
            existing = existing[0];
            const data = find(existing, ChildJXT.prototype._NS, ChildJXT.prototype._EL);
            data.forEach(function (xml) {
                results.push(new ChildJXT({}, xml, self));
            });
            return results;
        },
        set: function (values) {
            const self = this;
            let existing = find(this.xml, NS, sub);
            if (existing.length) {
                self.xml.removeChild(existing[0]);
            }
            if (!values.length) {
                return;
            }
            existing = createElement(NS, sub, this._NS);
            values.forEach(function (value) {
                const content = new ChildJXT(value, null, {
                    xml: { namespaceURI: NS }
                });
                existing.appendChild(content.xml);
            });
            self.xml.appendChild(existing);
        }
    };
}
exports.subMultiExtension = subMultiExtension;
