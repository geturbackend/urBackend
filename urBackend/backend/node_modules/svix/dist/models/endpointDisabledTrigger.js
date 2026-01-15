"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointDisabledTriggerSerializer = exports.EndpointDisabledTrigger = void 0;
var EndpointDisabledTrigger;
(function (EndpointDisabledTrigger) {
    EndpointDisabledTrigger["Manual"] = "manual";
    EndpointDisabledTrigger["Automatic"] = "automatic";
})(EndpointDisabledTrigger = exports.EndpointDisabledTrigger || (exports.EndpointDisabledTrigger = {}));
exports.EndpointDisabledTriggerSerializer = {
    _fromJsonObject(object) {
        return object;
    },
    _toJsonObject(self) {
        return self;
    },
};
//# sourceMappingURL=endpointDisabledTrigger.js.map