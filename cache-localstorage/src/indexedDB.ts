import type{IndexedDBOptions} from "./types"
/**
 * IndexedDB 封装类
 * 提供了简单易用的 IndexedDB 操作接口，支持:
 * 1. 自动创建/升级数据库和对象仓库
 * 2. Promise 化的异步操作
 * 3. 类型安全
 * 4. 过期时间控制
 * 5. 错误处理
 */
export class IndexedDB {
	private db: IDBDatabase | null = null; // 存储数据库实例
	private readonly dbName: string; // 数据库名称
	private readonly storeName: string; // 对象仓库名称
	private readonly version: number; // 数据库版本号
	private readonly defaultExpire: number; // 默认过期时间（秒）

	constructor(options:IndexedDBOptions) {
		this.dbName = options.dbName|| "app_db";
		this.storeName = options.storeName|| "app_store";
		this.version = options.version ?? 1; // 版本号默认为1
		this.defaultExpire = options.expire ?? 0; // 过期时间默认为0（永不过期）
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
	 * 存储数据
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
			const dataToStore = {
				key,
				value,
				expire: expirationTime,
			};
	
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
	 */
	async get<T>(key: string): Promise<T | null> {
		try {
			const store = await this.getStore("readonly");

			return new Promise((resolve, reject) => {
				const request = store.get(key);

				request.onsuccess = () => {
					const data = request.result;
					if (!data) {
						resolve(null);
						return;
					}

					if (data.expire && data.expire < Date.now()) {
						this.remove(key);
						resolve(null);
						return;
					}

					resolve(data.value);
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
