// 定义一个记录函数执行时间的装饰器
function logExecutionTime(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // 保存原始函数
    const originalMethod = descriptor.value;

    // 重写函数
    descriptor.value = async function (...args: any[]) {
        // 记录开始时间
        const startTime = performance.now();

        // 调用原始函数并保存结果
        const result = await originalMethod.apply(this, args);

        // 记录结束时间
        const endTime = performance.now();

        // 计算执行时间
        const executionTime = endTime - startTime;

        // 输出执行时间信息
        console.log(`Function ${propertyKey} took ${executionTime} milliseconds to execute.`);

        // 返回原始函数的结果
        return result;
    };

    return descriptor;
}

function delayWithCallback<T>(ms: number, callback: () => T): Promise<T> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const result = callback();
            resolve(result);
        }, ms);
    });
}
const myCallback = (message: string) => () => `回调函数返回的结果:${message}`;
class ExampleClass {
    // 使用装饰器
    @logExecutionTime
    async longRunningFunction() {
        let sum = 0;
        for (let i = 0; i <= 100; i++) {
            await delayWithCallback(2 * i, myCallback(i.toString()));
            sum += i;
        }
        return sum;
    }
}

// 创建类的实例
const example = new ExampleClass();

// 调用被装饰的函数
example.longRunningFunction().then((result) => {
    console.log('Promise result:', result);
});