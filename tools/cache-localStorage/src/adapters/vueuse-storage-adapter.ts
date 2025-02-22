import { useStorage } from "@vueuse/core";
import type { StorageOptions } from "../types";
import type { StorageAdapter } from "./storage-adapter";
import { defaultOptions } from "../config";

export class VueUseStorageAdapter implements StorageAdapter {
	private prefix: string;
	private defaultExpire: number;

	constructor(options: StorageOptions = defaultOptions) {
		this.prefix = options.prefix ?? "";
		this.defaultExpire = options.expire ?? 0;
	}

	private getKey(key: string): string {
		return `${this.prefix}${key}`;
	}

	async set<T>(key: string, value: T, expire?: number): Promise<boolean> {
		try {
			const storage = useStorage<{
				value: T;
				expire?: number;
			}>(this.getKey(key), {
				value,
				expire:
					expire !== undefined
						? Date.now() + expire * 1000
						: this.defaultExpire
							? Date.now() + this.defaultExpire * 1000
							: undefined,
			});

			storage.value = {
				value,
				expire:
					expire !== undefined
						? Date.now() + expire * 1000
						: this.defaultExpire
							? Date.now() + this.defaultExpire * 1000
							: undefined,
			};

			return true;
		} catch (error) {
			console.error("VueUse storage set failed:", error);
			return false;
		}
	}

	async get<T>(key: string): Promise<T | null> {
		try {
			const storage = useStorage<{
				value: T;
				expire?: number;
			}>(this.getKey(key), null);

			if (!storage.value) return null;

			if (typeof storage.value === "string") {
				try {
					const parsed = JSON.parse(storage.value);
					if (parsed && typeof parsed === "object") {
						if (parsed.expire && parsed.expire < Date.now()) {
							await this.remove(key);
							return null;
						}
						return parsed.value;
					}
				} catch {
					return storage.value as unknown as T;
				}
			}

			if (storage.value.expire && storage.value.expire < Date.now()) {
				await this.remove(key);
				return null;
			}

			return storage.value.value;
		} catch (error) {
			console.error("VueUse storage get failed:", error);
			return null;
		}
	}

	async remove(key: string): Promise<boolean> {
		try {
			const storage = useStorage(this.getKey(key), null);
			storage.value = null;
			return true;
		} catch (error) {
			console.error("VueUse storage remove failed:", error);
			return false;
		}
	}

	async clear(): Promise<boolean> {
		try {
			const keys = await this.keys();
			for (const key of keys) {
				await this.remove(key);
			}
			return true;
		} catch (error) {
			console.error("VueUse storage clear failed:", error);
			return false;
		}
	}

	async keys(): Promise<string[]> {
		return Object.keys(localStorage)
			.filter((key) => key.startsWith(this.prefix))
			.map((key) => key.slice(this.prefix.length));
	}

	async has(key: string): Promise<boolean> {
		const value = await this.get(key);
		return value !== null;
	}

	async getSize(): Promise<{ used: number; total: number }> {
		try {
			const used = Object.entries(localStorage)
				.filter(([key]) => key.startsWith(this.prefix))
				.reduce((total, [key, value]) => total + key.length + value.length, 0);

			return {
				used: Math.round(used / 1024),
				total: 5120,
			};
		} catch (error) {
			console.error("Get VueUse storage size failed:", error);
			return { used: 0, total: 5120 };
		}
	}
}
