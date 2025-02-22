function validatePositive(target: any, propertyKey: string, parameterIndex: number) {
  // 保存原始的方法描述符
  const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
  const originalMethod = descriptor?.value;

  // 使用 Object.defineProperty 来确保方法被正确替换
  Object.defineProperty(target, propertyKey, {
      configurable: true,
      enumerable: false,
      get() {
          // 返回包装后的函数
          return function(this: any, ...args: any[]) {
              // 验证参数
              if (args[parameterIndex] < 0) {
                  throw new Error(`Parameter at position ${parameterIndex} must be positive, received: ${args[parameterIndex]}`);
              }
              // 调用原始方法
              return originalMethod.apply(this, args);
          };
      }
  });
}

class MathUtils {
  square(@validatePositive num1:any, @validatePositive num2:any) {
      console.log("Executing square method with:", num1, num2);
      return num1 * num2;
  }
}

// 测试用例
console.log("=== Testing positive numbers ===");
try {
  const math1 = new MathUtils();
  const result = math1.square(5, 2);
  console.log("Result:", result);
} catch (error:any) {
  console.error("Error:", error.message);
}

console.log("\n=== Testing negative numbers ===");
try {
  const math2 = new MathUtils();
  const result = math2.square(-5, 2);
  console.log("Result:", result);  // 这行不应该执行到
} catch (error:any) {
  console.error("Error:", error.message);
}

// 测试第二个参数为负数的情况
console.log("\n=== Testing second parameter negative ===");
try {
  const math3 = new MathUtils();
  const result = math3.square(5, -2);
  console.log("Result:", result);  // 这行不应该执行到
} catch (error:any) {
  console.error("Error:", error.message);
}