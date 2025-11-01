import type{IndexedDBOptions, StorageItem} from "./types"
import { encryption } from "./encrypt";
import { STORAGE_CONFIG } from "./config";

/**
 * IndexedDB 封装类
 * 提供了简单易用的 IndexedDB 操作接口，支持:
 * 1. 自动创建/升级数据库和对象仓库
 * 2. Promise 化的异步操作
 * 3. 类型安全
 * 4. 过期时间控制
 * 5. 数据加密（可选）
 * 6. 错误处理
 */
export class IndexedDB {
	private db: IDBDatabase | null = null; // 存储数据库实例
	private readonly dbName: string; // 数据库名称
	private readonly storeName: string; // 对象仓库名称
	private readonly version: number; // 数据库版本号
	private readonly defaultExpire: number; // 默认过期时间（秒）
	/** 是否启用加密，启用后会对数据进行加密存储 */
	private readonly encryption: boolean;
	/** 加密密钥，如果启用加密则需要提供 */
	private readonly encryptionKey?: string;

	constructor(options:IndexedDBOptions) {
		this.dbName = options.dbName|| "app_db";
		this.storeName = options.storeName|| "app_store";
		this.version = options.version ?? 1; // 版本号默认为1
		this.defaultExpire = options.expire ?? 0; // 过期时间默认为0（永不过期）
		this.encryption = options.encryption ?? false;
		this.encryptionKey = options.encryptionKey ?? STORAGE_CONFIG.encryption.key;
	}

	/**
	 * 初始化数据库连接
	 */
	private async initDB(): Promise<IDBDatabase> {
		if (this.db) return this.db;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version);

			request.onerror = () => {
				reject(new Error("Failed to open database"));
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve(request.result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: "key" });
				}
			};
		});
	}

	/**
	 * 获取对象仓库的事务
	 */
	private async getStore(mode: IDBTransactionMode = "readonly"): Promise<IDBObjectStore> {
		const db = await this.initDB();
		const transaction = db.transaction(this.storeName, mode);
		return transaction.objectStore(this.storeName);
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
	 * 存储数据
	 * 如果启用加密，会对数据进行加密存储
	 */
	async set<T>(key: string, value: T, expire?: number): Promise<boolean> {
		try {
			const store = await this.getStore("readwrite");
	
			// 计算过期时间戳
			let expirationTime: number | undefined;
			if (expire !== undefined) {
				expirationTime = Date.now() + expire * 1000;
			} else if (this.defaultExpire > 0) {
				expirationTime = Date.now() + this.defaultExpire * 1000;
			}
	
			// 准备要存储的数据对象
			const storageItem: StorageItem<T> = {
				value,
				expire: expirationTime,
			};

			// 如果启用加密，先序列化并加密数据
			let dataToStore: { key: string; value: T | string; expire?: number };
			if (this.encryption) {
				const encrypted = await this.serialize(storageItem);
				if (!encrypted) {
					return false;
				}
				// 存储加密后的字符串
				dataToStore = {
					key,
					value: encrypted as unknown as T,
					expire: expirationTime,
				};
			} else {
				// 未加密时直接存储
				dataToStore = {
					key,
					value,
					expire: expirationTime,
				};
			}
	
			return new Promise((resolve, reject) => {
				const request = store.put(dataToStore);
	
				request.onsuccess = () => resolve(true);
				request.onerror = () => reject(new Error("Failed to store data"));
			});
		} catch (error) {
			console.error("IndexedDB set failed:", error);
			return false;
		}
	}
	
	
	
	

	/**
	 * 获取数据
	 * 如果启用加密，会先解密数据再返回
	 */
	async get<T>(key: string): Promise<T | null> {
		try {
			const store = await this.getStore("readonly");

			return new Promise((resolve, reject) => {
				const request = store.get(key);

				request.onsuccess = async () => {
					const data = request.result;
					if (!data) {
						resolve(null);
						return;
					}

					// 检查是否过期
					if (data.expire && data.expire < Date.now()) {
						await this.remove(key);
						resolve(null);
						return;
					}

					// 如果启用加密，需要解密数据
					if (this.encryption) {
						try {
							// 从存储中读取的是加密字符串，需要解密
							const encryptedData = data.value as unknown as string;
							const storageItem = await this.deserialize<StorageItem<T>>(encryptedData);
							if (!storageItem) {
								resolve(null);
								return;
							}
							resolve(storageItem.value);
						} catch (error) {
							console.error("Decryption failed:", error);
							resolve(null);
						}
					} else {
						// 未加密时直接返回
						resolve(data.value as T);
					}
				};

				request.onerror = () => reject(new Error("Failed to get data"));
			});
		} catch (error) {
			console.error("IndexedDB get failed:", error);
			return null;
		}
	}

	/**
	 * 删除数据
	 */
	async remove(key: string): Promise<boolean> {
		try {
			const store = await this.getStore("readwrite");

			return new Promise((resolve, reject) => {
				const request = store.delete(key);
				request.onsuccess = () => resolve(true);
				request.onerror = () => reject(new Error("Failed to remove data"));
			});
		} catch (error) {
			console.error("IndexedDB remove failed:", error);
			return false;
		}
	}

	/**
	 * 清空所有数据
	 */
	async clear(): Promise<boolean> {
		try {
			const store = await this.getStore("readwrite");

			return new Promise((resolve, reject) => {
				const request = store.clear();
				request.onsuccess = () => resolve(true);
				request.onerror = () => reject(new Error("Failed to clear data"));
			});
		} catch (error) {
			console.error("IndexedDB clear failed:", error);
			return false;
		}
	}

	/**
	 * 获取所有键名
	 */
	async keys(): Promise<string[]> {
		try {
			const store = await this.getStore("readonly");

			return new Promise((resolve, reject) => {
				const request = store.getAllKeys();
				request.onsuccess = () => resolve(Array.from(request.result as string[]));
				request.onerror = () => reject(new Error("Failed to get keys"));
			});
		} catch (error) {
			console.error("IndexedDB keys failed:", error);
			return [];
		}
	}

	/**
	 * 检查键是否存在
	 */
	async has(key: string): Promise<boolean> {
		const value = await this.get(key);
		return value !== null;
	}

	/**
	 * 获取存储使用情况
	 * 注意: IndexedDB 没有直接的方式获取存储大小
	 * 这里返回一个估计值
	 */
	async getSize(): Promise<{ used: number; total: number }> {
		try {
			const store = await this.getStore("readonly");
			let size = 0;

			return new Promise((resolve) => {
				const request = store.openCursor();
				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest).result;
					if (cursor) {
						const value = cursor.value;
						size += JSON.stringify(value).length;
						cursor.continue();
					} else {
						resolve({
							used: Math.round(size / 1024),
							total: 1024 * 1024, // 假设限制为 1GB
						});
					}
				};
			});
		} catch (error) {
			console.error("Get IndexedDB size failed:", error);
			return { used: 0, total: 1024 * 1024 };
		}
	}

	/**
	 * 关闭数据库连接
	 */
	close(): void {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}
}
