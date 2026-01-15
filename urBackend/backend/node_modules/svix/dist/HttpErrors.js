"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPValidationError = exports.ValidationError = exports.HttpErrorOut = void 0;
class HttpErrorOut {
    static getAttributeTypeMap() {
        return HttpErrorOut.attributeTypeMap;
    }
}
exports.HttpErrorOut = HttpErrorOut;
HttpErrorOut.discriminator = undefined;
HttpErrorOut.mapping = undefined;
HttpErrorOut.attributeTypeMap = [
    {
        name: "code",
        baseName: "code",
        type: "string",
        format: "",
    },
    {
        name: "detail",
        baseName: "detail",
        type: "string",
        format: "",
    },
];
class ValidationError {
    static getAttributeTypeMap() {
        return ValidationError.attributeTypeMap;
    }
}
exports.ValidationError = ValidationError;
ValidationError.discriminator = undefined;
ValidationError.mapping = undefined;
ValidationError.attributeTypeMap = [
    {
        name: "loc",
        baseName: "loc",
        type: "Array<string>",
        format: "",
    },
    {
        name: "msg",
        baseName: "msg",
        type: "string",
        format: "",
    },
    {
        name: "type",
        baseName: "type",
        type: "string",
        format: "",
    },
];
class HTTPValidationError {
    static getAttributeTypeMap() {
        return HTTPValidationError.attributeTypeMap;
    }
}
exports.HTTPValidationError = HTTPValidationError;
HTTPValidationError.discriminator = undefined;
HTTPValidationError.mapping = undefined;
HTTPValidationError.attributeTypeMap = [
    {
        name: "detail",
        baseName: "detail",
        type: "Array<ValidationError>",
        format: "",
    },
];
//# sourceMappingURL=HttpErrors.js.map