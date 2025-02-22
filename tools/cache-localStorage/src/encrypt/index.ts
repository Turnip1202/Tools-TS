// import { STORAGE_CONFIG } from '../config'

/**
 * 生成密码学安全的随机数
 * 使用 Web Crypto API 生成加密安全的随机数
 * 如果不支持，则降级使用 Math.random（不够安全但可用）
 *
 * @param length - 需要生成的随机字节数
 * @returns Uint8Array 类型的随机数数组
 * @throws 如果生成失败，返回降级方案的随机数
 *
 * @example
 * const randomBytes = generateSecureRandom(8)
 *  返回 8 字节的随机数数组
 */
const generateSecureRandom = (length: number): Uint8Array => {
	try {
		// 检查浏览器是否支持 crypto API
		if (!crypto || !crypto.getRandomValues) {
			throw new Error("Crypto API is not supported");
		}

		// 创建指定长度的 Uint8Array
		const array = new Uint8Array(length);
		// 使用 crypto API 填充随机值
		crypto.getRandomValues(array);
		return array;
	} catch (error) {
		console.error("Failed to generate secure random values:", error);
		// 降级方案：使用 Math.random 生成伪随机数
		// 注意：这种方式不够安全，仅作为后备方案
		return Uint8Array.from(
			{ length },
			() => Math.floor(Math.random() * 256), // 生成 0-255 之间的随机数
		);
	}
};

/**
 * 生成随机盐值
 * 盐值用于增加密钥的随机性，防止彩虹表攻击
 *
 * @param length - 盐值长度（字节），默认16字节
 * @returns 十六进制格式的盐值字符串
 * @throws 如果生成失败，抛出错误
 *
 * @example
 * const salt = generateSalt()
 * // 返回类似 "a1b2c3d4e5f6g7h8" 的32字符十六进制字符串
 */
const generateSalt = (length = 16): string => {
	try {
		// 生成随机字节数组
		const array = generateSecureRandom(length);
		// 将字节数组转换为十六进制字符串
		// byte.toString(16) 转换为十六进制
		// padStart(2, '0') 确保每个字节都是两位
		return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
	} catch (error) {
		console.error("Failed to generate salt:", error);
		throw new Error("Encryption initialization failed");
	}
};

/**
 * 使用 SHA-256 生成密钥
 * 将密码和盐值组合，通过 SHA-256 生成固定长度的密钥
 *
 * @param password - 原始密码
 * @param salt - 盐值
 * @returns Promise<ArrayBuffer> 生成的密钥
 * @throws 如果生成失败，抛出错误
 *
 * @example
 * const key = await generateKey('myPassword', 'someSalt')
 */
const generateKey = async (password: string, salt: string): Promise<ArrayBuffer> => {
	try {
		// 检查是否支持 crypto.subtle API
		if (!crypto.subtle) {
			throw new Error("Crypto.subtle is not supported");
		}

		// 创建 TextEncoder 实例用于编码字符串
		const encoder = new TextEncoder();
		// 将密码和盐值组合并编码为字节数组
		const passwordData = encoder.encode(password + salt);

		// 使用 SHA-256 生成密钥
		// SHA-256 会生成 32 字节（256 位）的哈希值
		return await crypto.subtle.digest("SHA-256", passwordData);
	} catch (error) {
		console.error("Failed to generate key:", error);
		throw new Error("Key generation failed");
	}
};

// 修改密钥配置接口，使 key 变为可选
interface EncryptionConfig {
	key: string; // 加密密钥
	iv?: Uint8Array;
}

export const encryption = {
	/**
	 * 加密数据
	 */
	async encrypt(data: string, config: EncryptionConfig): Promise<string> {
		try {
			if (!crypto.subtle) {
				throw new Error("Crypto.subtle is not supported");
			}

			const encryptionKey = config.key; //?? STORAGE_CONFIG.encryption.key

			// 生成盐值和IV
			const salt = generateSalt();
			const iv = config?.iv ?? generateSecureRandom(12);

			// 生成加密密钥
			const keyMaterial = await generateKey(encryptionKey, salt);
			const key = await crypto.subtle.importKey("raw", keyMaterial, { name: "AES-GCM" }, false, [
				"encrypt",
			]);

			// 加密数据
			const encodedData = new TextEncoder().encode(data);
			const encryptedContent = await crypto.subtle.encrypt(
				{
					name: "AES-GCM",
					iv,
				},
				key,
				encodedData,
			);

			// 组合数据：将 IV、盐值和加密内容编码为 Base64
			const result = {
				iv: Array.from(iv)
					.map((b: number) => b.toString(16).padStart(2, "0"))
					.join(""),
				salt,
				content: btoa(String.fromCharCode(...new Uint8Array(encryptedContent))),
			};

			return JSON.stringify(result);
		} catch (error) {
			console.error("Encryption failed:", error);
			return btoa(encodeURIComponent(data));
		}
	},

	/**
	 * 解密数据
	 */
	async decrypt(encryptedData: string, config: EncryptionConfig): Promise<string> {
		try {
			// 解析加密数据
			const { iv, salt, content } = JSON.parse(encryptedData) as {
				iv: string;
				salt: string;
				content: string;
			};

			// 转换 IV 从十六进制字符串回到 Uint8Array
			const ivArray = new Uint8Array(
				iv.match(/.{2}/g)?.map((byte: string) => Number.parseInt(byte, 16)) ?? [],
			);

			// 解码加密内容
			const encryptedContent = Uint8Array.from(atob(content), (c: string) => c.charCodeAt(0));

			// 使用相同的盐值和密钥生成解密密钥
			const decryptionKey = config.key; //?? STORAGE_CONFIG.encryption.key
			const keyMaterial = await generateKey(decryptionKey, salt);
			const key = await crypto.subtle.importKey("raw", keyMaterial, { name: "AES-GCM" }, false, [
				"decrypt",
			]);

			// 解密数据
			const decryptedContent = await crypto.subtle.decrypt(
				{
					name: "AES-GCM",
					iv: ivArray,
				},
				key,
				encryptedContent,
			);

			// 转换为字符串
			return new TextDecoder().decode(decryptedContent);
		} catch (error) {
			console.error("Decryption failed:", error);
			try {
				return decodeURIComponent(atob(encryptedData));
			} catch {
				return "";
			}
		}
	},
};
