"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUUID = generateUUID;
var crypto_1 = require("crypto");
// 生成 UUID 的函数
function generateUUID() {
    return (0, crypto_1.randomUUID)();
}
// 使用示例
var uuid = generateUUID();
