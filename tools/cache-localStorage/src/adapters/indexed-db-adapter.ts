import { IndexedDB } from "../indexedDB";
import type { StorageOptions } from "../types";
import type { StorageAdapter } from "./storage-adapter";
import {defaultOptions} from "../config"

export class IndexedDBAdapter implements StorageAdapter {
	private db: IndexedDB;

	constructor(options: StorageOptions = defaultOptions) {
		console.log("options", options);
		this.db = new IndexedDB({
			dbName: options.dbName ?? "app_db",
			storeName: options.storeName ?? "app_store",
			version: options.version ?? 1,
			expire: options.expire,
		});
	}

	async set<T>(key: string, value: T, expire?: number): Promise<boolean> {
		return this.db.set(key, value, expire);
	}

	async get<T>(key: string): Promise<T | null> {
		return this.db.get<T>(key);
	}

	async remove(key: string): Promise<boolean> {
		return this.db.remove(key);
	}

	async clear(): Promise<boolean> {
		return this.db.clear();
	}

	async keys(): Promise<string[]> {
		return this.db.keys();
	}

	async has(key: string): Promise<boolean> {
		return this.db.has(key);
	}

	async getSize(): Promise<{ used: number; total: number }> {
		return this.db.getSize();
	}
}
