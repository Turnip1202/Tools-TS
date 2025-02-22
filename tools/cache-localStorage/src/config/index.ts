import type{ StorageOptions } from "../types";

// 常量配置
export const STORAGE_CONFIG = {
	storage: {
		prefix: "Turnip_",
		expire: 7 * 24 * 60 * 60,
	},
	encryption: {
		key: "Turnip_Kang",
	},
} as const;


// 默认配置
export const defaultOptions:StorageOptions = {
	dbName: "app_db",
	storeName: "app_store",
	prefix: "KY_",
	expire: 0,
	encryption: false,
	encryptionKey: "",
};