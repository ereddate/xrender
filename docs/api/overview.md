---
title: API 概览
description: XRender 核心 API 参考
---

# API 概览

本文档提供了 XRender 核心 API 的完整参考。

## 全局 API

### `$.component(name, definition)`

注册或获取全局组件。

**参数：**
- `name` (string): 组件名称
- `definition` (object): 组件定义对象

**返回值：** 组件构造函数

**示例：**

```javascript
const MyComponent = $.component('MyComponent', {
  data() {
    return { message: 'Hello' };
  },
  render(createElem) {
    return createElem('div', {}, this.data.message);
  }
});
```

### `$.createApp(options)`

创建应用实例。

**参数：**
- `options` (object): 应用配置对象

**返回值：** 应用实例

**示例：**

```javascript
const app = $.createApp({
  components: { MyComponent },
  router: router,
  store: store
});
```

### `$.use(plugin, options)`

安装插件。

**参数：**
- `plugin` (object/function): 插件对象或函数
- `options` (object): 插件配置选项

**示例：**

```javascript
$.use(MyPlugin, { someOption: true });
```

### `$.directive(name, definition)`

注册或获取全局指令。

**参数：**
- `name` (string): 指令名称
- `definition` (object): 指令定义对象

**示例：**

```javascript
$.directive('focus', {
  inserted(el) {
    el.focus();
  }
});
```

### `$.filter(name, fn)`

注册全局过滤器。

**参数：**
- `name` (string): 过滤器名称
- `fn` (function): 过滤器函数

**示例：**

```javascript
$.filter('capitalize', (value) => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
});
```

## 应用实例 API

### `app.$mount(selectorOrElement)`

挂载应用到 DOM 元素。

**参数：**
- `selectorOrElement` (string/element): 选择器或 DOM 元素

**返回值：** 根组件实例

**示例：**

```javascript
const app = $.createApp({ App });
app.$mount('#app');
```

### `app.unmount()`

卸载应用。

**示例：**

```javascript
app.unmount();
```

### `app.component(name, component)`

注册全局组件。

**示例：**

```javascript
app.component('MyComponent', MyComponent);
```

### `app.directive(name, directive)`

注册全局指令。

**示例：**

```javascript
app.directive('focus', {
  inserted(el) {
    el.focus();
  }
});
```

## 组件实例 API

### `this.$data`

访问组件的响应式数据对象。

**示例：**

```javascript
const App = $.component('App', {
  data() {
    return { count: 0 };
  },
  methods: {
    increment() {
      this.$data.count++;
    }
  }
});
```

### `this.$props`

访问组件的 props 对象。

**示例：**

```javascript
const Child = $.component('Child', {
  props: ['title'],
  render(createElem) {
    return createElem('h1', {}, this.$props.title);
  }
});
```

### `this.$el`

访问组件的根 DOM 元素。

**示例：**

```javascript
mounted() {
  console.log(this.$el); // 组件的根元素
}
```

### `this.$emit(eventName, ...args)`

触发自定义事件。

**参数：**
- `eventName` (string): 事件名称
- `...args`: 事件参数

**示例：**

```javascript
methods: {
  handleClick() {
    this.$emit('click', { value: 42 });
  }
}
```

### `this.$nextTick(callback)`

在下次 DOM 更新循环结束之后执行回调。

**参数：**
- `callback` (function): 回调函数

**示例：**

```javascript
methods: {
  updateData() {
    this.$data.message = 'Updated';
    this.$nextTick(() => {
      console.log('DOM updated');
    });
  }
}
```

### `this.$forceUpdate()`

强制组件重新渲染。

**示例：**

```javascript
methods: {
  forceRefresh() {
    this.$forceUpdate();
  }
}
```

## 响应式 API

### `$.reactive(obj)`

创建响应式对象。

**参数：**
- `obj` (object): 要转换为响应式的对象

**返回值：** 响应式对象

**示例：**

```javascript
const state = $.reactive({
  count: 0,
  message: 'Hello'
});

state.count++; // 触发更新
```

### `$.ref(value)`

创建响应式引用。

**参数：**
- `value` (any): 初始值

**返回值：** 响应式引用对象

**示例：**

```javascript
const count = $.ref(0);
count.value++; // 触发更新
```

### `$.computed(getter)`

创建计算属性。

**参数：**
- `getter` (function): getter 函数

**返回值：** 计算属性对象

**示例：**

```javascript
const count = $.ref(0);
const doubled = $.computed(() => count.value * 2);
console.log(doubled.value); // 0
count.value++;
console.log(doubled.value); // 2
```

### `$.watch(source, callback, options)`

侦听数据变化。

**参数：**
- `source` (string/function/array): 要侦听的数据源
- `callback` (function): 回调函数
- `options` (object): 配置选项

**示例：**

```javascript
const count = $.ref(0);

$.watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`);
});

count.value++; // 输出: Count changed from 0 to 1
```

## 工具函数

### `$.nextTick(callback)`

全局的 nextTick 函数。

**示例：**

```javascript
$.nextTick(() => {
  console.log('DOM updated');
});
```

### `$.set(target, key, value)`

向响应式对象添加属性。

**示例：**

```javascript
const obj = $.reactive({});
$.set(obj, 'newProp', 'value');
```

### `$.delete(target, key)`

删除响应式对象的属性。

**示例：**

```javascript
const obj = $.reactive({ prop: 'value' });
$.delete(obj, 'prop');
```

## 类型定义

### ComponentOptions

```typescript
interface ComponentOptions {
  name?: string;
  data?: () => object;
  props?: string[] | object;
  computed?: object;
  methods?: object;
  watch?: object;
  render?: (createElement: Function) => VNode;
  created?: () => void;
  mounted?: () => void;
  updated?: () => void;
  beforeDestroy?: () => void;
  destroyed?: () => void;
}
```

### VNode

```typescript
interface VNode {
  tag: string | Function;
  data?: object;
  children?: VNode[] | string;
  text?: string;
  elm?: Node;
}
```

## 下一步

- [createApp API](/api/create-app) - 详细的应用 API
- [component API](/api/component) - 组件 API 参考
- [reactivity API](/api/reactivity) - 响应式 API 参考
