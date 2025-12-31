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
    instance.countChanges = 0;
    instance.lastCount = 0;
    instance.prevCount = 0;
    
    // 修改数据，测试watch触发
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
});
