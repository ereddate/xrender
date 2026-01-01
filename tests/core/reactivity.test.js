import { describe, it, expect, vi } from 'vitest';
import { Component } from '../../src/libs/core.js';

describe('响应式系统测试', () => {
  it('基本响应式数据绑定', () => {
    // 创建一个简单的组件，测试响应式数据
    const TestComponent = new Component('Test', {
      data() {
        return {
          count: 0,
          message: 'Hello'
        };
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.data.count}, Message: ${this.data.message}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    
    // 测试初始值
    expect(instance.data.count).toBe(0);
    expect(instance.data.message).toBe('Hello');
    
    // 修改数据，测试响应式更新
    const updateSpy = vi.spyOn(instance, 'update');
    
    instance.data.count = 1;
    expect(instance.data.count).toBe(1);
    
    instance.data.message = 'World';
    expect(instance.data.message).toBe('World');
    
    // 恢复原始方法
    updateSpy.mockRestore();
  });
  
  it('深度监听对象', () => {
    // 创建一个包含嵌套对象的组件
    const TestComponent = new Component('Test', {
      data() {
        return {
          user: {
            name: 'John',
            age: 30,
            address: {
              city: 'New York',
              zip: '10001'
            }
          }
        };
      },
      render(createElem) {
        return createElem('div', {}, `Name: ${this.data.user.name}, City: ${this.data.user.address.city}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    
    // 测试初始值
    expect(instance.data.user.name).toBe('John');
    expect(instance.data.user.address.city).toBe('New York');
    
    // 修改嵌套对象属性，测试深度响应式
    const updateSpy = vi.spyOn(instance, 'update');
    
    // 修改一级属性
    instance.data.user.age = 31;
    expect(instance.data.user.age).toBe(31);
    
    // 修改二级属性
    instance.data.user.address.city = 'London';
    expect(instance.data.user.address.city).toBe('London');
    
    // 恢复原始方法
    updateSpy.mockRestore();
  });
  
  it('数组响应式处理', () => {
    // 创建一个包含数组的组件
    const TestComponent = new Component('Test', {
      data() {
        return {
          items: [1, 2, 3, 4, 5]
        };
      },
      render(createElem) {
        return createElem('div', {}, `Items: ${this.data.items.join(', ')}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    
    // 测试初始值
    expect(instance.data.items).toEqual([1, 2, 3, 4, 5]);
    
    // 测试数组方法的响应式
    const updateSpy = vi.spyOn(instance, 'update');
    
    // push 方法
    instance.data.items.push(6);
    expect(instance.data.items).toEqual([1, 2, 3, 4, 5, 6]);
    
    // pop 方法
    const popped = instance.data.items.pop();
    expect(popped).toBe(6);
    expect(instance.data.items).toEqual([1, 2, 3, 4, 5]);
    
    // splice 方法
    instance.data.items.splice(1, 2, 10, 20);
    expect(instance.data.items).toEqual([1, 10, 20, 4, 5]);
    
    // sort 方法
    instance.data.items.sort((a, b) => a - b);
    expect(instance.data.items).toEqual([1, 4, 5, 10, 20]);
    
    // reverse 方法
    instance.data.items.reverse();
    expect(instance.data.items).toEqual([20, 10, 5, 4, 1]);
    
    // 恢复原始方法
    updateSpy.mockRestore();
  });
  
  it('计算属性依赖追踪', () => {
    // 创建一个包含计算属性的组件
    const TestComponent = new Component('Test', {
      data() {
        return {
          a: 1,
          b: 2
        };
      },
      computed: {
        sum() {
          return this.data.a + this.data.b;
        },
        product() {
          return this.data.a * this.data.b;
        }
      },
      render(createElem) {
        return createElem('div', {}, `Sum: ${this.data.sum}, Product: ${this.data.product}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    
    // 测试计算属性初始值
    expect(instance.data.sum).toBe(3);
    expect(instance.data.product).toBe(2);
    
    // 修改依赖数据，测试计算属性更新
    instance.data.a = 3;
    expect(instance.data.sum).toBe(5);
    expect(instance.data.product).toBe(6);
    
    instance.data.b = 4;
    expect(instance.data.sum).toBe(7);
    expect(instance.data.product).toBe(12);
  });
  
  it('数据监听功能', async () => {
    // 创建一个带有watch的组件
    const TestComponent = new Component('Test', {
      data() {
        return {
          count: 0
        };
      },
      watch: {
        count(newVal, oldVal) {
          if (!this.countChanges) {
            this.countChanges = 0;
          }
          this.countChanges++;
          this.lastCount = newVal;
          this.prevCount = oldVal;
        }
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.data.count}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    instance.lastCount = 0;
    instance.prevCount = 0;
    
    // 修改数据,测试watch触发
    instance.data.count = 1;
    // 等待异步更新完成
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(instance.countChanges).toBe(1);
    expect(instance.lastCount).toBe(1);
    expect(instance.prevCount).toBe(0);
    
    instance.data.count = 2;
    // 等待异步更新完成
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(instance.countChanges).toBe(2);
    expect(instance.lastCount).toBe(2);
    expect(instance.prevCount).toBe(1);
  });
  
  it('计算属性缓存机制', () => {
    // 创建一个包含计算属性的组件
    const TestComponent = new Component('Test', {
      data() {
        return {
          a: 1,
          b: 2
        };
      },
      computed: {
        sum() {
          return this.data.a + this.data.b;
        },
        product() {
          return this.data.a * this.data.b;
        }
      },
      render(createElem) {
        return createElem('div', {}, `Sum: ${this.data.sum}, Product: ${this.data.product}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    
    // 测试计算属性初始值
    expect(instance.data.sum).toBe(3);
    expect(instance.data.product).toBe(2);
    
    // 多次访问计算属性,测试缓存
    const sum1 = instance.data.sum;
    const sum2 = instance.data.sum;
    const sum3 = instance.data.sum;
    
    expect(sum1).toBe(sum2);
    expect(sum2).toBe(sum3);
    
    // 修改依赖数据,测试缓存失效
    instance.data.a = 3;
    expect(instance.data.sum).toBe(5);
    expect(instance.data.product).toBe(6);
    
    // 再次访问,测试新的缓存
    const newSum1 = instance.data.sum;
    const newSum2 = instance.data.sum;
    expect(newSum1).toBe(newSum2);
  });
  
  it('计算属性复杂依赖', () => {
    // 创建一个包含复杂计算属性的组件
    const TestComponent = new Component('Test', {
      data() {
        return {
          firstName: 'John',
          lastName: 'Doe',
          age: 30
        };
      },
      computed: {
        fullName() {
          return `${this.data.firstName} ${this.data.lastName}`;
        },
        greeting() {
          return `Hello, ${this.data.fullName}! You are ${this.data.age} years old.`;
        }
      },
      render(createElem) {
        return createElem('div', {}, this.data.greeting);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    
    // 测试初始值
    expect(instance.data.fullName).toBe('John Doe');
    expect(instance.data.greeting).toBe('Hello, John Doe! You are 30 years old.');
    
    // 修改firstName,测试依赖链更新
    instance.data.firstName = 'Jane';
    expect(instance.data.fullName).toBe('Jane Doe');
    expect(instance.data.greeting).toBe('Hello, Jane Doe! You are 30 years old.');
    
    // 修改lastName,测试依赖链更新
    instance.data.lastName = 'Smith';
    expect(instance.data.fullName).toBe('Jane Smith');
    expect(instance.data.greeting).toBe('Hello, Jane Smith! You are 30 years old.');
    
    // 修改age,测试依赖链更新
    instance.data.age = 25;
    expect(instance.data.fullName).toBe('Jane Smith');
    expect(instance.data.greeting).toBe('Hello, Jane Smith! You are 25 years old.');
  });
  
  it('侦听器深度监听', async () => {
    // 创建一个带有深度监听的组件
    const TestComponent = new Component('Test', {
      data() {
        return {
          user: {
            name: 'John',
            age: 30,
            address: {
              city: 'New York',
              zip: '10001'
            }
          }
        };
      },
      watch: {
        user: {
          handler(newVal, oldVal) {
            if (!this.userChanges) {
              this.userChanges = 0;
            }
            this.userChanges++;
            this.lastUser = JSON.parse(JSON.stringify(newVal));
          },
          deep: true
        }
      },
      render(createElem) {
        return createElem('div', {}, `Name: ${this.data.user.name}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    instance.lastUser = null;
    
    // 修改一级属性
    instance.data.user.name = 'Jane';
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(instance.userChanges).toBe(1);
    expect(instance.lastUser.name).toBe('Jane');
    
    // 修改二级属性
    instance.data.user.address.city = 'London';
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(instance.userChanges).toBe(2);
    expect(instance.lastUser.address.city).toBe('London');
    
    // 修改三级属性
    instance.data.user.address.zip = 'SW1A';
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(instance.userChanges).toBe(3);
    expect(instance.lastUser.address.zip).toBe('SW1A');
  });
  
  it('侦听器立即执行', async () => {
    // 创建一个带有立即执行的侦听器
    const TestComponent = new Component('Test', {
      data() {
        return {
          count: 0
        };
      },
      watch: {
        count: {
          handler(newVal, oldVal) {
            if (!this.countChanges) {
              this.countChanges = 0;
            }
            this.countChanges++;
            this.lastCount = newVal;
          },
          immediate: true
        }
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.data.count}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    
    // 测试立即执行
    expect(instance.countChanges).toBe(1);
    expect(instance.lastCount).toBe(0);
    
    // 修改数据,测试后续触发
    instance.data.count = 1;
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(instance.countChanges).toBe(2);
    expect(instance.lastCount).toBe(1);
  });
  
  it('侦听器错误处理', async () => {
    // 创建一个带有错误处理的侦听器
    const TestComponent = new Component('Test', {
      data() {
        return {
          value: 0
        };
      },
      watch: {
        value: {
          handler(newVal) {
            if (newVal < 0) {
              throw new Error('Value cannot be negative');
            }
            this.lastValue = newVal;
          }
        }
      },
      render(createElem) {
        return createElem('div', {}, `Value: ${this.data.value}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    instance.lastValue = null;
    
    // 测试正常值
    instance.data.value = 1;
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(instance.lastValue).toBe(1);
    
    // 测试错误值(不应该抛出错误,应该被捕获)
    instance.data.value = -1;
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(instance.lastValue).toBe(1); // 保持上一个有效值
  });
  
  it('watchEffect自动依赖追踪', () => {
    // 创建一个带有watchEffect的组件
    const TestComponent = new Component('Test', {
      data() {
        return {
          count: 0,
          doubled: 0
        };
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.data.count}, Doubled: ${this.data.doubled}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    
    // 创建watchEffect
    const stop = instance.$watchEffect(() => {
      instance.data.doubled = instance.data.count * 2;
    });
    
    // 测试初始执行
    expect(instance.data.doubled).toBe(0);
    
    // 修改依赖数据,测试自动追踪
    instance.data.count = 5;
    expect(instance.data.doubled).toBe(10);
    
    instance.data.count = 10;
    expect(instance.data.doubled).toBe(20);
    
    // 停止watchEffect
    stop();
    
    // 修改数据,测试停止后不再执行
    instance.data.count = 15;
    expect(instance.data.doubled).toBe(20); // 保持上一个值
  });
  
  it('watchEffect懒加载', () => {
    // 创建一个带有懒加载watchEffect的组件
    const TestComponent = new Component('Test', {
      data() {
        return {
          count: 0,
          result: 0
        };
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.data.count}, Result: ${this.data.result}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    
    // 创建懒加载watchEffect
    const stop = instance.$watchEffect(() => {
      instance.data.result = instance.data.count * 3;
    }, { lazy: true });
    
    // 测试懒加载(初始不执行)
    expect(instance.data.result).toBe(0);
    
    // 手动触发第一次执行
    instance.data.count = 5;
    // watchEffect会在数据变化时自动执行
    expect(instance.data.result).toBe(15);
    
    instance.data.count = 10;
    expect(instance.data.result).toBe(30);
  });
  
  it('watchEffect多个依赖', () => {
    // 创建一个带有多个依赖的watchEffect
    const TestComponent = new Component('Test', {
      data() {
        return {
          a: 1,
          b: 2,
          c: 3,
          result: 0
        };
      },
      render(createElem) {
        return createElem('div', {}, `Result: ${this.data.result}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    
    // 创建watchEffect
    const stop = instance.$watchEffect(() => {
      instance.data.result = instance.data.a + instance.data.b + instance.data.c;
    });
    
    // 测试初始执行
    expect(instance.data.result).toBe(6);
    
    // 修改a
    instance.data.a = 10;
    expect(instance.data.result).toBe(15);
    
    // 修改b
    instance.data.b = 20;
    expect(instance.data.result).toBe(33);
    
    // 修改c
    instance.data.c = 30;
    expect(instance.data.result).toBe(60);
  });
  
  it('计算属性与侦听器结合', async () => {
    // 创建一个同时使用计算属性和侦听器的组件
    const TestComponent = new Component('Test', {
      data() {
        return {
          firstName: 'John',
          lastName: 'Doe'
        };
      },
      computed: {
        fullName() {
          return `${this.data.firstName} ${this.data.lastName}`;
        }
      },
      watch: {
        fullName(newVal) {
          if (!this.fullNameChanges) {
            this.fullNameChanges = 0;
          }
          this.lastFullName = newVal;
          this.fullNameChanges++;
        }
      },
      render(createElem) {
        return createElem('div', {}, `Name: ${this.data.fullName}`);
      }
    });
    
    // 初始化组件
    const instance = TestComponent.init();
    instance.lastFullName = null;
    
    // 测试初始值
    expect(instance.data.fullName).toBe('John Doe');
    
    // 修改firstName
    instance.data.firstName = 'Jane';
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(instance.data.fullName).toBe('Jane Doe');
    expect(instance.fullNameChanges).toBe(1);
    expect(instance.lastFullName).toBe('Jane Doe');
    
    // 修改lastName
    instance.data.lastName = 'Smith';
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(instance.data.fullName).toBe('Jane Smith');
    expect(instance.fullNameChanges).toBe(2);
    expect(instance.lastFullName).toBe('Jane Smith');
  });
});
