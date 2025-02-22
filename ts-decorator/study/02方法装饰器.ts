const methodDecorator = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  console.log("类的原型", target);
  console.log("方法名", propertyKey);
  console.log("方法描述符", descriptor);
  const originalMethod = descriptor.value;
  descriptor.value = (...args: any[]) => {
    console.log("方法执行前...");
    const result = originalMethod.apply(target, args);
    console.log("方法执行后...");
    return result;
  }
  return descriptor;
}

class myClass2 {
    @methodDecorator
    myMethod() {
        console.log('方法执行');
    }
}
const myClassInstance2 = new myClass2();
myClassInstance2.myMethod();