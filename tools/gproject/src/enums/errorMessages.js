"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = exports.ErrorMessages = void 0;
// 定义错误信息枚举
var ErrorMessages;
(function (ErrorMessages) {
    ErrorMessages["PathMustBeAbsolute"] = "Project path must be an absolute path.";
    ErrorMessages["ReadDirectoryError"] = "Error reading directory:";
    ErrorMessages["WriteFileError"] = "Error writing file:";
})(ErrorMessages || (exports.ErrorMessages = ErrorMessages = {}));
// 自定义错误类
var CustomError = /** @class */ (function (_super) {
    __extends(CustomError, _super);
    function CustomError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'CustomError';
        return _this;
    }
    return CustomError;
}(Error));
exports.CustomError = CustomError;
