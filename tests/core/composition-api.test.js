import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Component } from '../../src/libs/core.js';
import XRender from '../../src/libs/core.js';
import {
  ref,
  reactive,
  computed,
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
  toRefs,
  toRef,
  unref,
  isRef,
  toValue,
  shallowRef,
  triggerRef,
  customRef,
  isProxy,
  isReactive,
  isReadonly,
  readonly,
  shallowReadonly,
  onMounted,
  onUpdated,
  onUnmounted,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
  onErrorCaptured,
  nextTick,
  provide,
  inject
} from '../../src/libs/reactivity.js';

describe('Composition API - ref', () => {
  it('应该创建响应式引用', () => {
    const count = ref(0);
    expect(count.value).toBe(0);
    count.value = 1;
    expect(count.value).toBe(1);
  });

  it('应该支持对象类型的 ref', () => {
    const user = ref({ name: 'John' });
    expect(user.value.name).toBe('John');
    user.value.name = 'Jane';
    expect(user.value.name).toBe('Jane');
  });

  it('应该正确判断是否为 ref', () => {
    const count = ref(0);
    const obj = { value: 0 };
    expect(isRef(count)).toBe(true);
    expect(isRef(obj)).toBe(false);
  });
});

describe('Composition API - reactive', () => {
  it('应该创建响应式对象', () => {
    const state = reactive({ count: 0, name: 'John' });
    expect(state.count).toBe(0);
    state.count = 1;
    expect(state.count).toBe(1);
  });

  it('应该支持嵌套对象', () => {
    const state = reactive({
      user: {
        name: 'John',
        address: {
          city: 'New York'
        }
      }
    });
    expect(state.user.address.city).toBe('New York');
    state.user.address.city = 'Boston';
    expect(state.user.address.city).toBe('Boston');
  });

  it('应该正确判断是否为 reactive', () => {
    const state = reactive({ count: 0 });
    const obj = { count: 0 };
    expect(isReactive(state)).toBe(true);
    expect(isReactive(obj)).toBe(false);
  });

  it('应该正确判断是否为 proxy', () => {
    const state = reactive({ count: 0 });
    const obj = { count: 0 };
    expect(isProxy(state)).toBe(true);
    expect(isProxy(obj)).toBe(false);
  });
});

describe('Composition API - computed', () => {
  it('应该创建计算属性', () => {
    const count = ref(0);
    const doubled = computed(() => count.value * 2);
    expect(doubled.value).toBe(0);
    count.value = 5;
    expect(doubled.value).toBe(10);
  });

  it('应该支持 getter 和 setter', () => {
    const count = ref(0);
    const doubled = computed({
      get: () => count.value * 2,
      set: (val) => { count.value = val / 2; }
    });
    expect(doubled.value).toBe(0);
    doubled.value = 10;
    expect(count.value).toBe(5);
  });

  it('应该缓存计算结果', () => {
    const count = ref(0);
    let getterCallCount = 0;
    const doubled = computed(() => {
      getterCallCount++;
      return count.value * 2;
    });
    expect(doubled.value).toBe(0);
    expect(getterCallCount).toBe(1);
    expect(doubled.value).toBe(0);
    expect(getterCallCount).toBe(1);
    count.value = 5;
    expect(doubled.value).toBe(10);
    expect(getterCallCount).toBe(2);
  });
});

describe('Composition API - watch', () => {
  it('应该监听 ref 的变化', async () => {
    const count = ref(0);
    const callback = vi.fn();
    watch(count, (newVal, oldVal) => {
      callback(newVal, oldVal);
    });
    count.value = 1;
    await nextTick();
    expect(callback).toHaveBeenCalledWith(1, 0);
  });

  it('应该支持 immediate 选项', async () => {
    const count = ref(0);
    const callback = vi.fn();
    watch(count, callback, { immediate: true });
    await nextTick();
    expect(callback).toHaveBeenCalledWith(0, undefined);
  });

  it('应该监听 reactive 对象的变化', async () => {
    const state = reactive({ count: 0 });
    const callback = vi.fn();
    watch(() => state.count, (newVal, oldVal) => {
      callback(newVal, oldVal);
    });
    state.count = 1;
    await nextTick();
    expect(callback).toHaveBeenCalledWith(1, 0);
  });

  it('应该支持 deep 选项', async () => {
    const state = reactive({
      user: {
        name: 'John'
      }
    });
    const callback = vi.fn();
    watch(() => state.user, callback, { deep: true });
    state.user.name = 'Jane';
    await nextTick();
    expect(callback).toHaveBeenCalled();
  });
});

describe('Composition API - watchEffect', () => {
  it('应该自动追踪依赖', async () => {
    const count = ref(0);
    const callback = vi.fn();
    watchEffect(() => {
      callback(count.value);
    });
    await nextTick();
    expect(callback).toHaveBeenCalledWith(0);
    count.value = 1;
    await nextTick();
    expect(callback).toHaveBeenCalledWith(1);
  });

  it('应该支持停止监听', async () => {
    const count = ref(0);
    const callback = vi.fn();
    const stop = watchEffect(() => {
      callback(count.value);
    });
    await nextTick();
    expect(callback).toHaveBeenCalledTimes(1);
    stop();
    count.value = 1;
    await nextTick();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('应该支持 cleanup 函数', async () => {
    const count = ref(0);
    const cleanupCallback = vi.fn();
    watchEffect((onCleanup) => {
      onCleanup(cleanupCallback);
    });
    await nextTick();
    expect(cleanupCallback).not.toHaveBeenCalled();
  });
});

describe('Composition API - toRefs', () => {
  it('应该将 reactive 对象转换为 ref', () => {
    const state = reactive({ count: 0, name: 'John' });
    const refs = toRefs(state);
    expect(refs.count.value).toBe(0);
    expect(refs.name.value).toBe('John');
    refs.count.value = 1;
    expect(state.count).toBe(1);
  });

  it('应该支持 toRef', () => {
    const state = reactive({ count: 0, name: 'John' });
    const countRef = toRef(state, 'count');
    expect(countRef.value).toBe(0);
    countRef.value = 1;
    expect(state.count).toBe(1);
  });
});

describe('Composition API - unref', () => {
  it('应该解包 ref', () => {
    const count = ref(10);
    expect(unref(count)).toBe(10);
    expect(unref(20)).toBe(20);
  });
});

describe('Composition API - toValue', () => {
  it('应该将值转换为实际值', () => {
    const count = ref(10);
    expect(toValue(count)).toBe(10);
    expect(toValue(() => 20)).toBe(20);
    expect(toValue(30)).toBe(30);
  });
});

describe('Composition API - shallowRef', () => {
  it('应该创建浅层响应式 ref', () => {
    const state = shallowRef({ count: 0 });
    expect(state.value.count).toBe(0);
    state.value.count = 1;
    expect(state.value.count).toBe(1);
  });
});

describe('Composition API - readonly', () => {
  it('应该创建只读对象', () => {
    const original = reactive({ count: 0 });
    const copy = readonly(original);
    expect(copy.count).toBe(0);
    expect(() => { copy.count = 1; }).not.toThrow();
    expect(original.count).toBe(0);
  });

  it('应该正确判断是否为 readonly', () => {
    const state = reactive({ count: 0 });
    const readonlyState = readonly(state);
    expect(isReadonly(readonlyState)).toBe(true);
    expect(isReadonly(state)).toBe(false);
  });
});

describe('Composition API - shallowReadonly', () => {
  it('应该创建浅层只读对象', () => {
    const original = { count: 0, nested: { value: 1 } };
    const copy = shallowReadonly(original);
    expect(copy.count).toBe(0);
    expect(() => { copy.count = 1; }).not.toThrow();
    expect(original.count).toBe(0);
  });
});

describe('Composition API - 生命周期钩子', () => {
  let component;

  beforeEach(() => {
    component = new Component('Test', {
      data() {
        return { count: 0 };
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.data.count}`);
      }
    });
  });

  it('应该在组件挂载时调用 onMounted', () => {
    const mountedCallback = vi.fn();
    const TestComponent = new Component('Test', {
      setup() {
        onMounted(mountedCallback);
        return {};
      },
      render(createElem) {
        return createElem('div', {}, 'Test');
      }
    });
    TestComponent.init();
    expect(mountedCallback).toHaveBeenCalled();
  });

  it('应该在组件更新时调用 onUpdated', async () => {
    const updatedCallback = vi.fn();
    const TestComponent = new Component('Test', {
      data() {
        return { count: 0 };
      },
      setup() {
        onUpdated(updatedCallback);
        return {};
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.data.count}`);
      }
    });
    const instance = TestComponent.init();
    instance.data.count = 1;
    await nextTick();
    expect(updatedCallback).toHaveBeenCalled();
  });

  it('应该在组件卸载时调用 onUnmounted', () => {
    const unmountedCallback = vi.fn();
    const TestComponent = new Component('Test', {
      setup() {
        onUnmounted(unmountedCallback);
        return {};
      },
      render(createElem) {
        return createElem('div', {}, 'Test');
      }
    });
    const instance = TestComponent.init();
    instance.destroy();
    expect(unmountedCallback).toHaveBeenCalled();
  });

  it('应该在组件挂载前调用 onBeforeMount', () => {
    const beforeMountCallback = vi.fn();
    const TestComponent = new Component('Test', {
      setup() {
        onBeforeMount(beforeMountCallback);
        return {};
      },
      render(createElem) {
        return createElem('div', {}, 'Test');
      }
    });
    TestComponent.init();
    expect(beforeMountCallback).toHaveBeenCalled();
  });

  it('应该在组件更新前调用 onBeforeUpdate', async () => {
    const beforeUpdateCallback = vi.fn();
    const TestComponent = new Component('Test', {
      data() {
        return { count: 0 };
      },
      setup() {
        onBeforeUpdate(beforeUpdateCallback);
        return {};
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.data.count}`);
      }
    });
    const instance = TestComponent.init();
    instance.data.count = 1;
    await XRender.nextTick();
    expect(beforeUpdateCallback).toHaveBeenCalled();
  });

  it('应该在组件卸载前调用 onBeforeUnmount', () => {
    const beforeUnmountCallback = vi.fn();
    const TestComponent = new Component('Test', {
      setup() {
        onBeforeUnmount(beforeUnmountCallback);
        return {};
      },
      render(createElem) {
        return createElem('div', {}, 'Test');
      }
    });
    const instance = TestComponent.init();
    instance.destroy();
    expect(beforeUnmountCallback).toHaveBeenCalled();
  });
});

describe('Composition API - provide/inject', () => {
  it('应该支持 provide 和 inject', () => {
    const ParentComponent = new Component('Parent', {
      setup() {
        provide('message', 'Hello from parent');
        return {};
      },
      render(createElem) {
        return createElem('div', {}, 'Parent');
      }
    });

    const childOptions = {
      setup() {
        const message = inject('message', 'default');
        return { message };
      },
      render(createElem) {
        return createElem('div', {}, this.message);
      }
    };

    const parent = ParentComponent.init();
    const child = new Component('Child', childOptions, parent);
    child.init();
    expect(child.message).toBe('Hello from parent');
  });

  it('应该支持默认值', () => {
    const TestComponent = new Component('Test', {
      setup() {
        const value = inject('nonexistent', 'default');
        return { value };
      },
      render(createElem) {
        return createElem('div', {}, this.value);
      }
    });
    const instance = TestComponent.init();
    expect(instance.value).toBe('default');
  });
});

describe('Composition API - nextTick', () => {
  it('应该在下一个 tick 执行回调', async () => {
    let executed = false;
    await nextTick(() => {
      executed = true;
    });
    expect(executed).toBe(true);
  });

  it('应该返回 Promise', async () => {
    const result = await nextTick();
    expect(result).toBeUndefined();
  });
});

describe('Composition API - setup 函数', () => {
  it('应该在 setup 中使用 ref', () => {
    const TestComponent = new Component('Test', {
      setup() {
        const count = ref(0);
        return { count };
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.count.value}`);
      }
    });
    const instance = TestComponent.init();
    expect(instance.count.value).toBe(0);
    instance.count.value = 1;
    expect(instance.count.value).toBe(1);
  });

  it('应该在 setup 中使用 reactive', () => {
    const TestComponent = new Component('Test', {
      setup() {
        const state = reactive({ count: 0, name: 'John' });
        return { state };
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.state.count}`);
      }
    });
    const instance = TestComponent.init();
    expect(instance.state.count).toBe(0);
    instance.state.count = 1;
    expect(instance.state.count).toBe(1);
  });

  it('应该在 setup 中使用 computed', () => {
    const TestComponent = new Component('Test', {
      setup() {
        const count = ref(0);
        const doubled = computed(() => count.value * 2);
        return { count, doubled };
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.count.value}, Doubled: ${this.doubled.value}`);
      }
    });
    const instance = TestComponent.init();
    expect(instance.doubled.value).toBe(0);
    instance.count.value = 5;
    expect(instance.doubled.value).toBe(10);
  });

  it('应该在 setup 中使用 watch', () => {
    const TestComponent = new Component('Test', {
      setup() {
        const count = ref(0);
        const callback = vi.fn();
        watch(count, (newVal) => {
          callback(newVal);
        });
        return { count };
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.count.value}`);
      }
    });
    const instance = TestComponent.init();
    instance.count.value = 1;
  });

  it('应该在 setup 中使用 watchEffect', () => {
    const TestComponent = new Component('Test', {
      setup() {
        const count = ref(0);
        const callback = vi.fn();
        watchEffect(() => {
          callback(count.value);
        });
        return { count };
      },
      render(createElem) {
        return createElem('div', {}, `Count: ${this.count.value}`);
      }
    });
    const instance = TestComponent.init();
    instance.count.value = 1;
  });

  it('应该在 setup 中使用生命周期钩子', () => {
    const mountedCallback = vi.fn();
    const TestComponent = new Component('Test', {
      setup() {
        onMounted(mountedCallback);
        return {};
      },
      render(createElem) {
        return createElem('div', {}, 'Test');
      }
    });
    TestComponent.init();
    expect(mountedCallback).toHaveBeenCalled();
  });

  it('应该在 setup 中使用 provide/inject', () => {
    const ParentComponent = new Component('Parent', {
      setup() {
        provide('message', 'Hello from parent');
        return {};
      },
      render(createElem) {
        return createElem('div', {}, 'Parent');
      }
    });

    const childOptions = {
      setup() {
        const message = inject('message', 'default');
        return { message };
      },
      render(createElem) {
        return createElem('div', {}, this.message);
      }
    };

    const parent = ParentComponent.init();
    const child = new Component('Child', childOptions, parent);
    child.init();
    expect(child.message).toBe('Hello from parent');
  });

  it('应该在 setup 中使用 provide/inject 响应式数据', () => {
    const ParentComponent = new Component('Parent', {
      setup() {
        const count = ref(0);
        provide('count', count);
        return { count };
      },
      render(createElem) {
        return createElem('div', {}, `Parent: ${this.count.value}`);
      }
    });

    const childOptions = {
      setup() {
        const count = inject('count');
        return { count };
      },
      render(createElem) {
        return createElem('div', {}, `Child: ${this.count.value}`);
      }
    };

    const parent = ParentComponent.init();
    const child = new Component('Child', childOptions, parent);
    child.init();
    expect(child.count.value).toBe(0);
    parent.count.value = 10;
    expect(child.count.value).toBe(10);
  });

  it('应该在 setup 中使用 provide/inject 响应式对象', () => {
    const ParentComponent = new Component('Parent', {
      setup() {
        const state = reactive({ count: 0, name: 'test' });
        provide('state', state);
        return { state };
      },
      render(createElem) {
        return createElem('div', {}, `Parent: ${this.state.count}`);
      }
    });

    const childOptions = {
      setup() {
        const state = inject('state');
        return { state };
      },
      render(createElem) {
        return createElem('div', {}, `Child: ${this.state.count}`);
      }
    };

    const parent = ParentComponent.init();
    const child = new Component('Child', childOptions, parent);
    child.init();
    expect(child.state.count).toBe(0);
    parent.state.count = 20;
    expect(child.state.count).toBe(20);
  });

  it('应该在组件实例方法中使用 provide/inject', () => {
    const ParentComponent = new Component('Parent', {
      setup() {
        provide('config', { theme: 'dark', lang: 'zh' });
        return {};
      },
      render(createElem) {
        return createElem('div', {}, 'Parent');
      }
    });

    const childOptions = {
      setup() {
        const config = this.inject('config');
        return { config };
      },
      render(createElem) {
        return createElem('div', {}, `Theme: ${this.config.theme}`);
      }
    };

    const parent = ParentComponent.init();
    const child = new Component('Child', childOptions, parent);
    child.init();
    expect(child.config.theme).toBe('dark');
  });
});
