import { randomUUID } from 'crypto';

// 生成 UUID 的函数
export function generateUUID(): string {
    return randomUUID();
}

// 使用示例
const uuid = generateUUID();
