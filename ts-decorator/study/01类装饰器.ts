const classDecorator = (...target: any) => {
  console.log('classDecorator', target);
  target.shift().prototype
    .test = (v: (val: string) => void) => v("测试");
}


class myClass1 {
  constructor() {
    console.log('类实例化');
  }
}


const myClassInstance = new myClass1();
(myClassInstance as any).test(console.log);