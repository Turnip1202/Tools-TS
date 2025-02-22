import { STORAGE_CONFIG } from "./config";
import { encryption } from "./encrypt";
import type { StorageItem, StorageOptions } from "./types";

/**
 * LocalStorage 封装类
 * 提供了安全、可靠的本地存储操作，支持：
 * 1. 数据加密 - 可选择性地对数据进行加密存储
 * 2. 过期时间 - 支持设置数据的过期时间
 * 3. 命名空间隔离 - 通过前缀区分不同模块的数据
 * 4. 类型安全 - 完整的 TypeScript 类型支持
 * 5. 错误处理 - 完善的错误处理和日志记录
 *
 * @example
 * const storage = new LocalStorage({
 *   prefix: 'myApp_',
 *   expire: 7200,
 *   encryption: true
 * })
 */
export class LocalStorage {
	/** 存储键的前缀，用于命名空间隔离，如：'myApp_' */
	private readonly prefix: string;
	/** 数据默认过期时间（秒），如：7200表示2小时 */
	private readonly defaultExpire: number;
	/** 是否启用加密，启用后会对数据进行加密存储 */
	private readonly encryption: boolean;
	/** 加密密钥，如果启用加密则需要提供 */
	private readonly encryptionKey?: string;

	/**
	 * 创建 LocalStorage 实例
	 * @param options - 配置选项
	 * @param options.prefix - 键名前缀，用于命名空间隔离，默认从配置文件获取
	 * @param options.expire - 默认过期时间（秒），默认从配置文件获取
	 * @param options.encryption - 是否启用加密，默认false
	 * @param options.encryptionKey - 加密密钥，如果启用加密则需要提供
	 *
	 * @example
	 * const storage = new LocalStorage({
	 *   prefix: 'myApp_',      // 所有键名将添加此前缀
	 *   expire: 7200,          // 默认2小时过期
	 *   encryption: true       // 启用加密
	 * })
	 */
	constructor(options: StorageOptions ) {
		this.prefix = options.prefix ?? STORAGE_CONFIG.storage.prefix;
		this.defaultExpire = options.expire ?? STORAGE_CONFIG.storage.expire;
		this.encryption = options.encryption ?? false;
		this.encryptionKey = options.encryptionKey ?? STORAGE_CONFIG.encryption.key;
	}

	/**
	 * 获取完整的存储键名（添加前缀）
	 * @param key - 原始键名
	 * @returns 添加前缀后的完整键名
	 *
	 * @example
	 * // 如果 prefix 是 'myApp_'
	 * getKey('user') // 返回: 'myApp_user'
	 * getKey('settings') // 返回: 'myApp_settings'
	 */
	private getKey(key: string): string {
		return `${this.prefix}${key}`;
	}

	/**
	 * 序列化数据
	 * 如果启用加密，将使用提供的密钥或默认密钥进行加密
	 */
	private async serialize(data: unknown): Promise<string> {
		try {
			// 先将数据转换为 JSON 字符串
			const serialized = JSON.stringify(data);

			if (this.encryption) {
				if (!this.encryptionKey) {
					throw new Error("Encryption key is required when encryption is enabled");
				}
				// 加密数据
				return await encryption.encrypt(serialized, {
					key: this.encryptionKey,
				});
			}
			return serialized;
		} catch (error) {
			console.error("Serialization failed:", error);
			return JSON.stringify(null);
		}
	}

	/**
	 * 反序列化数据
	 * 如果启用加密，将使用提供的密钥或默认密钥进行解密
	 */
	private async deserialize<T>(data: string): Promise<T | null> {
		try {
			if (!data) return null;

			let decrypted: string;
			if (this.encryption) {
				if (!this.encryptionKey) {
					throw new Error("Encryption key is required when encryption is enabled");
				}
				// 解密数据
				decrypted = await encryption.decrypt(data, {
					key: this.encryptionKey,
				});
				if (!decrypted) return null;
			} else {
				decrypted = data;
			}

			return JSON.parse(decrypted) as T;
		} catch (error) {
			console.error("Deserialization failed:", error);
			return null;
		}
	}

	/**
	 * 存储数据到 localStorage
	 * 1. 创建存储项，包含值和过期时间
	 * 2. 序列化（可能加密）数据
	 * 3. 存储到 localStorage
	 *
	 * @param key - 存储键名
	 * @param value - 要存储的数据（任意类型）
	 * @param expire - 过期时间（秒），不传则使用默认过期时间
	 * @returns 存储是否成功
	 *
	 * @example
	 * // 存储用户信息，1小时后过期
	 * await storage.set('user', { name: 'John', age: 25 }, 3600)
	 *
	 * // 使用默认过期时间存储设置
	 * await storage.set('settings', { theme: 'dark' })
	 */
	async set<T>(key: string, value: T, expire?: number): Promise<boolean> {
		try {
			// 创建存储项，包含值和过期时间
			const storageItem: StorageItem<T> = {
				value,
				expire:
					expire !== undefined
						? Date.now() + expire * 1000 // 指定过期时间
						: this.defaultExpire
							? Date.now() + this.defaultExpire * 1000
							: undefined, // 默认过期时间
			};

			// 序列化并可能加密数据
			const serialized = await this.serialize(storageItem);
			if (!serialized) return false;

			// 存储到 localStorage
			localStorage.setItem(this.getKey(key), serialized);
			return true;
		} catch (error) {
			console.error("Storage set failed:", error);
			return false;
		}
	}

	/**
	 * 从 localStorage 获取数据
	 * 1. 获取原始数据
	 * 2. 反序列化（可能解密）数据
	 * 3. 检查是否过期
	 * 4. 返回数据值
	 *
	 * @param key - 存储键名
	 * @returns 存储的数据，如果不存在、已过期或出错则返回null
	 *
	 * @example
	 * interface UserInfo {
	 *   name: string
	 *   age: number
	 * }
	 *
	 * // 获取用户信息
	 * const user = await storage.get<UserInfo>('user')
	 * if (user) {
	 *   console.log(user.name) // 类型安全
	 * }
	 */
	async get<T>(key: string): Promise<T | null> {
		try {
			// 获取原始数据
			const data = localStorage.getItem(this.getKey(key));
			if (!data) return null;

			// 反序列化数据
			const storageItem = await this.deserialize<StorageItem<T>>(data);
			if (!storageItem) return null;

			// 检查是否过期
			if (storageItem.expire && storageItem.expire < Date.now()) {
				await this.remove(key); // 删除过期数据
				return null;
			}

			return storageItem.value;
		} catch (error) {
			console.error("Storage get failed:", error);
			return null;
		}
	}

	/**
	 * 从 localStorage 删除指定的数据
	 *
	 * @param key - 要删除的键名
	 * @returns 删除是否成功
	 *
	 * @example
	 * // 删除用户信息
	 * await storage.remove('user')
	 */
	async remove(key: string): Promise<boolean> {
		try {
			localStorage.removeItem(this.getKey(key));
			return true;
		} catch (error) {
			console.error("Storage remove failed:", error);
			return false;
		}
	}

	/**
	 * 清空当前命名空间下的所有数据
	 * 只会清除带有当前前缀的项，不会影响其他命名空间的数据
	 *
	 * @returns 清空是否成功
	 *
	 * @example
	 * // 如果 prefix 是 'myApp_'，则只会清除 'myApp_' 开头的数据
	 * await storage.clear()
	 */
	async clear(): Promise<boolean> {
		try {
			const keys = Object.keys(localStorage);
			for (const key of keys) {
				if (key.startsWith(this.prefix)) {
					localStorage.removeItem(key);
				}
			}
			return true;
		} catch (error) {
			console.error("Storage clear failed:", error);
			return false;
		}
	}

	/**
	 * 获取当前命名空间下的所有键名（不含前缀）
	 *
	 * @returns 键名数组
	 *
	 * @example
	 * // 如果存储了 'myApp_user' 和 'myApp_settings'
	 * storage.keys() // 返回: ['user', 'settings']
	 */
	keys(): string[] {
		return Object.keys(localStorage)
			.filter((key) => key.startsWith(this.prefix))
			.map((key) => key.slice(this.prefix.length));
	}

	/**
	 * 检查存储项是否存在且未过期
	 *
	 * @param key - 要检查的键名
	 * @returns 是否存在且未过期
	 *
	 * @example
	 * if (await storage.has('user')) {
	 *   console.log('用户信息存在且未过期')
	 * }
	 */
	async has(key: string): Promise<boolean> {
		const value = await this.get(key);
		return value !== null;
	}

	/**
	 * 获取当前命名空间的存储使用情况
	 * 计算方式：
	 * 1. 只计算当前前缀的数据大小
	 * 2. 包含键名和值的长度
	 * 3. 转换为KB单位
	 *
	 * @returns 已使用空间和总空间（KB）
	 *
	 * @example
	 * const size = storage.getSize()
	 * console.log(`已使用: ${size.used}KB / ${size.total}KB`)
	 */
	getSize(): { used: number; total: number } {
		try {
			// 计算当前命名空间下所有数据的大小
			const used = Object.entries(localStorage)
				.filter(([key]) => key.startsWith(this.prefix))
				.reduce((total, [key, value]) => total + key.length + value.length, 0);

			return {
				used: Math.round(used / 1024), // 转换为KB
				total: 5120, // 浏览器一般限制5MB
			};
		} catch (error) {
			console.error("Get storage size failed:", error);
			return { used: 0, total: 5120 };
		}
	}
}
