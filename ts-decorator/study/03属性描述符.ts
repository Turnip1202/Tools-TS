function validateEmail(target: any, propertyKey: string) {
  let value: string;
  const setter = function (newValue: string) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newValue)) {
          throw new Error(`属性 ${propertyKey} 必须是有效的电子邮件地址`);
      }
      value = newValue;
  };
  const getter = function () {
      return value;
  };

  Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
  });
}

class User {
  @validateEmail
  email: string;

  constructor(email: string) {
      this.email = email;
  }
}

try {
  const user = new User('invalid-email');
} catch (error:any) {
  console.error(error.message);
}

const validUser = new User('valid@example.com');
console.log(validUser.email);
