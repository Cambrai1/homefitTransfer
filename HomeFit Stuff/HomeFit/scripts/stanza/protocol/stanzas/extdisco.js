"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NS = tslib_1.__importStar(require("../namespaces"));
function default_1(JXT) {
    const Utils = JXT.utils;
    const Services = JXT.define({
        element: 'services',
        fields: {
            type: Utils.attribute('type')
        },
        name: 'services',
        namespace: NS.DISCO_EXTERNAL_1
    });
    const Credentials = JXT.define({
        element: 'credentials',
        name: 'credentials',
        namespace: NS.DISCO_EXTERNAL_1
    });
    const Service = JXT.define({
        element: 'service',
        fields: {
            host: Utils.attribute('host'),
            password: Utils.attribute('password'),
            port: Utils.attribute('port'),
            transport: Utils.attribute('transport'),
            type: Utils.attribute('type'),
            username: Utils.attribute('username')
        },
        name: 'service',
        namespace: NS.DISCO_EXTERNAL_1
    });
    JXT.extend(Services, Service, 'services');
    JXT.extend(Credentials, Service);
    JXT.extendIQ(Services);
    JXT.extendIQ(Credentials);
    JXT.withDataForm(function (DataForm) {
        JXT.extend(Service, DataForm);
    });
}
exports.default = default_1;
