"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProjectJSONDatawriteFile = exports.generateProjectJSONDataConsole = void 0;
var fs = require("node:fs/promises");
var path = require("node:path");
var enums_1 = require("./enums");
var tools_1 = require("./tools");
// 将对象转换为 JSON 字符串的函数
var jsonFormat = function (_a) {
    var value = _a.value, replacer = _a.replacer, _b = _a.space, space = _b === void 0 ? 4 : _b;
    return JSON.stringify(value, replacer, space);
};
// 将路径下的文件目录转换为指定的 JSON 数据并输出到控制台
var generateProjectJSONDataConsole = function (projectPath, config) { return __awaiter(void 0, void 0, void 0, function () {
    var defaultConfig, directoryEntries, directories, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // 检查项目路径是否为绝对路径，如果不是则抛出错误
                if (!path.isAbsolute(projectPath)) {
                    throw new enums_1.CustomError(enums_1.ErrorMessages.PathMustBeAbsolute);
                }
                defaultConfig = {
                    paths: [],
                    tags: [],
                    enabled: true
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, fs.readdir(projectPath, { withFileTypes: true })];
            case 2:
                directoryEntries = _a.sent();
                directories = directoryEntries.filter(function (file) { return file.isDirectory(); });
                return [4 /*yield*/, filesToJSON(directories, __assign(__assign({}, defaultConfig), config))];
            case 3: 
            // 合并默认配置和传入的配置对象
            return [2 /*return*/, _a.sent()];
            case 4:
                error_1 = _a.sent();
                // 如果读取目录时出现错误，抛出包含错误信息的错误
                throw new enums_1.CustomError("".concat(enums_1.ErrorMessages.ReadDirectoryError, " ").concat(error_1.message));
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.generateProjectJSONDataConsole = generateProjectJSONDataConsole;
// 将文件夹列表转换为 JSON 数据
var filesToJSON = function (directoryEntries, config) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // 使用数组的 map 方法将每个文件夹信息转换为 JSON 数据对象
        return [2 /*return*/, jsonFormat({
                value: directoryEntries.map(function (file) { return (__assign({ name: file.name, rootPath: path.join(file.parentPath, file.name) }, config)); })
            })];
    });
}); };
// 将路径下的文件目录转换为指定的 JSON 数据并写入文件
/**
 *
 * @param projectPath 项目目录，绝对路径
 * @param outFilePath 输出的json文件路径，绝对路径
 * @param config 配置对象
 * @param extraConfig 额外配置对象
 * @returns
 */
var generateProjectJSONDatawriteFile = function (projectPath, outFilePath, config, extraConfig) { return __awaiter(void 0, void 0, void 0, function () {
    var data, arrData, filterData, newData, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, exports.generateProjectJSONDataConsole)(projectPath, config)];
            case 1:
                data = _b.sent();
                arrData = JSON.parse(data);
                filterData = arrData.filter(function (item) { var _a; return !((_a = extraConfig === null || extraConfig === void 0 ? void 0 : extraConfig.filterDirNames) === null || _a === void 0 ? void 0 : _a.includes(item.name)); });
                newData = jsonFormat({ value: filterData });
                // 写入文件，如果没有指定输出路径，则使用项目路径
                return [4 /*yield*/, fs.writeFile(path.join(outFilePath !== null && outFilePath !== void 0 ? outFilePath : projectPath, "".concat((_a = extraConfig === null || extraConfig === void 0 ? void 0 : extraConfig.fileName) !== null && _a !== void 0 ? _a : "project-" + (0, tools_1.generateUUID)(), ".json")), newData, { encoding: "utf-8" })];
            case 2:
                // 写入文件，如果没有指定输出路径，则使用项目路径
                _b.sent();
                // 返回生成的 JSON 数据
                return [2 /*return*/, data];
            case 3:
                error_2 = _b.sent();
                // 如果写入文件时出现错误，抛出包含错误信息的错误
                throw new enums_1.CustomError("".concat(enums_1.ErrorMessages.WriteFileError, " ").concat(error_2.message));
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.generateProjectJSONDatawriteFile = generateProjectJSONDatawriteFile;
exports.default = { generateProjectJSONDataConsole: exports.generateProjectJSONDataConsole, generateProjectJSONDatawriteFile: exports.generateProjectJSONDatawriteFile };
