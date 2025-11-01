import type { Dirent } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { 
    IJsonFormatConfig, 
    IJsonDataConfig, 
    IJsonDataType,
    TProjectJSONData,
    TFilesToJSONType, 
    TGenerateProjectJSONDataWriteFileType, 
    IJsonDataConfigExtra 
} from "./types";
import { ErrorMessages, CustomError } from './enums';

import {generateUUID} from "./tools"

// 将对象转换为 JSON 字符串的函数
const jsonFormat = ({ value, replacer, space = 4 }: IJsonFormatConfig) => JSON.stringify(value, replacer, space);

// 将路径下的文件目录转换为指定的 JSON 数据并输出到控制台
export const generateProjectJSONDataConsole: TProjectJSONData = async (projectPath: string, config?: IJsonDataConfig) => {
    // 检查项目路径是否为绝对路径，如果不是则抛出错误
    if (!path.isAbsolute(projectPath)) {
        throw new CustomError(ErrorMessages.PathMustBeAbsolute);
    }
    // 默认配置对象
    const defaultConfig: IJsonDataConfig = {
        paths: [],
        tags: [],
        enabled: true
    };
    try {
        // 读取指定路径下的文件和文件夹信息
        const directoryEntries = await fs.readdir(projectPath, { withFileTypes: true });
        // 过滤出文件夹信息
        const directories = directoryEntries.filter((file: Dirent) => file.isDirectory());
        // 合并默认配置和传入的配置对象
        return await filesToJSON(directories, {...defaultConfig,...config });
    } catch (error:any) {
        // 如果读取目录时出现错误，抛出包含错误信息的错误
        throw new CustomError(`${ErrorMessages.ReadDirectoryError} ${error.message}`);
    }
};

// 将文件夹列表转换为 JSON 数据
const filesToJSON: TFilesToJSONType = async (directoryEntries: Dirent[], config?: IJsonDataConfig) => {
    // 使用数组的 map 方法将每个文件夹信息转换为 JSON 数据对象
    return jsonFormat({
        value: directoryEntries.map((file: Dirent) => ({
            name: file.name,
            rootPath: path.join(file.parentPath, file.name),
            // 复制配置对象中的属性
       ...config
        }))
    });
};

// 将路径下的文件目录转换为指定的 JSON 数据并写入文件
/**
 * 
 * @param projectPath 项目目录，绝对路径
 * @param outFilePath 输出的json文件路径，绝对路径
 * @param config 配置对象
 * @param extraConfig 额外配置对象
 * @returns 
 */
export const generateProjectJSONDatawriteFile: TGenerateProjectJSONDataWriteFileType = async (projectPath: string, outFilePath?: string, config?: IJsonDataConfig, extraConfig?: IJsonDataConfigExtra) => {
    try {
        // 生成 JSON 数据
        const data = await generateProjectJSONDataConsole(projectPath, config);
        const arrData = JSON.parse(data);
        // 过滤数据，排除在额外配置中指定的文件夹名称
        const filterData = arrData.filter((item: IJsonDataType) =>!extraConfig?.filterDirNames?.includes(item.name));
        // 将过滤后的数据转换为 JSON 字符串
        const newData = jsonFormat({ value: filterData });
        // 写入文件，如果没有指定输出路径，则使用项目路径
        await fs.writeFile(path.join(outFilePath?? projectPath, `${extraConfig?.fileName??"project-"+generateUUID()}.json`), newData, { encoding: "utf-8" });
        // 返回生成的 JSON 数据
        return data;
    } catch (error:any) {
        // 如果写入文件时出现错误，抛出包含错误信息的错误
        throw new CustomError(`${ErrorMessages.WriteFileError} ${error.message}`);
    }
};

export default { generateProjectJSONDataConsole, generateProjectJSONDatawriteFile };