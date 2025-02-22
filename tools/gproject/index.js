"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProjectJSONDatawriteFile = exports.generateProjectJSONDataConsole = void 0;
var src_1 = require("./src");
Object.defineProperty(exports, "generateProjectJSONDataConsole", { enumerable: true, get: function () { return src_1.generateProjectJSONDataConsole; } });
Object.defineProperty(exports, "generateProjectJSONDatawriteFile", { enumerable: true, get: function () { return src_1.generateProjectJSONDatawriteFile; } });
// generateProjectJSONDataConsole("D:\\ACode\\Code_test")
// .then(console.log)
//   .catch(console.error)
(0, src_1.generateProjectJSONDatawriteFile)("D:\\ACode\\Code_test")
    .then(console.log)
    .catch(console.error);
