# SFC Entry API 文档

## 概述

`entry.js` 是 XRender SFC 系统的入口文件，提供了 SFC 功能的初始化接口。它是用户使用 SFC 功能的主要入口点。

## 导出内容

### `initSFC`

初始化 SFC 功能并将其集成到 XRender 实例中。

**函数签名:**

```javascript
function initSFC(XRender)
```

**参数:**

- `XRender` (Object): XRender 实例对象

**返回值:** (undefined)

**功能:**

1. 验证 XRender 实例是否已加载
2. 将 SFC 相关方法添加到 XRender 实例
3. 添加全局组件加载方法
4. 输出初始化成功消息

**示例:**

```javascript
import { XRender } from 'xrender';
import { initSFC } from 'xrender/sfc/entry';

// 初始化 SFC 功能
initSFC(XRender);

// 现在可以使用 XRender.sfc 方法
const descriptor = XRender.sfc.parse(sfcSource);
const compiled = XRender.sfc.compile(sfcSource);

// 也可以使用全局方法
const component = XRender.loadXRT('./MyComponent.xrt');
XRender.registerXRT('MyComponent', component);
```

## 使用场景

### 1. 基本初始化

```javascript
import { XRender } from 'xrender';
import { initSFC } from 'xrender/sfc/entry';

// 初始化 XRender
const app = new XRender({
  el: '#app',
  data: {
    message: 'Hello'
  }
});

// 初始化 SFC 功能
initSFC(XRender);
```

### 2. 与应用创建结合

```javascript
import { createApp } from 'xrender';
import { initSFC } from 'xrender/sfc/entry';

// 创建应用
const app = createApp({
  template: '<App />'
});

// 初始化 SFC 功能
initSFC(app.constructor);

// 加载 SFC 组件
const App = app.constructor.loadXRT('./App.xrt');
app.component('App', App);

// 挂载应用
app.mount('#app');
```

### 3. 动态加载组件

```javascript
import { XRender } from 'xrender';
import { initSFC } from 'xrender/sfc/entry';

// 初始化
initSFC(XRender);

// 动态加载组件
async function loadComponent(componentName, filePath) {
  try {
    const component = await XRender.loadXRT(filePath);
    XRender.registerXRT(componentName, component);
    console.log(`组件 ${componentName} 加载成功`);
  } catch (error) {
    console.error(`组件 ${componentName} 加载失败:`, error);
  }
}

// 使用
loadComponent('MyComponent', './components/MyComponent.xrt');
```

## 集成后的 API

初始化后，`XRender` 实例将获得以下方法：

### `XRender.sfc.parse(source, options)`

解析 SFC 源码。

**参数:**
- `source` (String): SFC 源码
- `options` (Object): 解析选项

**返回值:** (Object) SFC 描述符

### `XRender.sfc.compile(source, options)`

编译 SFC 源码。

**参数:**
- `source` (String): SFC 源码
- `options` (Object): 编译选项

**返回值:** (Object) 编译结果

### `XRender.sfc.register(name, component)`

注册 SFC 组件。

**参数:**
- `name` (String): 组件名称
- `component` (Object): 组件定义

**返回值:** (undefined)

### `XRender.sfc.loadFromFile(filePath)`

从文件加载 SFC 组件。

**参数:**
- `filePath` (String): 文件路径

**返回值:** (Promise<Object>) 组件定义

### `XRender.loadXRT(filePath)`

从文件加载 XRT 组件（全局方法）。

**参数:**
- `filePath` (String): 文件路径

**返回值:** (Promise<Object>) 组件定义

### `XRender.registerXRT(name, component)`

注册 XRT 组件（全局方法）。

**参数:**
- `name` (String): 组件名称
- `component` (Object): 组件定义

**返回值:** (undefined)

## 完整示例

```javascript
import { XRender } from 'xrender';
import { initSFC } from 'xrender/sfc/entry';

// 1. 初始化 SFC 功能
initSFC(XRender);

// 2. 解析 SFC
const sfcSource = `
<template>
  <div class="hello">
    <h1>{{ message }}</h1>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello, World!'
    };
  }
};
</script>

<style>
.hello {
  padding: 20px;
}
</style>
`;

const descriptor = XRender.sfc.parse(sfcSource);
console.log('SFC 描述符:', descriptor);

// 3. 编译 SFC
const compiled = XRender.sfc.compile(sfcSource);
console.log('编译结果:', compiled);

// 4. 从文件加载组件
async function loadAndRegisterComponents() {
  try {
    // 加载主应用组件
    const App = await XRender.loadXRT('./App.xrt');
    XRender.registerXRT('App', App);

    // 加载其他组件
    const Header = await XRender.loadXRT('./components/Header.xrt');
    XRender.registerXRT('Header', Header);

    const Footer = await XRender.loadXRT('./components/Footer.xrt');
    XRender.registerXRT('Footer', Footer);

    console.log('所有组件加载完成');
  } catch (error) {
    console.error('组件加载失败:', error);
  }
}

// 5. 创建应用实例
const app = new XRender({
  el: '#app',
  components: {
    App: XRender.sfc.register('App', null) // 预注册
  },
  template: '<App />'
});

// 6. 加载组件并启动应用
loadAndRegisterComponents().then(() => {
  console.log('应用启动成功');
});
```

## 错误处理

### XRender 未加载

```javascript
import { initSFC } from 'xrender/sfc/entry';

// 错误：XRender 未加载
initSFC(null);
// 输出: "XRender 未加载，无法初始化 SFC 功能"
```

### 组件加载失败

```javascript
try {
  const component = await XRender.loadXRT('./NonExistent.xrt');
} catch (error) {
  console.error('组件加载失败:', error);
  // 处理错误逻辑
}
```

## 最佳实践

### 1. 早期初始化

```javascript
// 推荐：在应用启动时尽早初始化
import { XRender } from 'xrender';
import { initSFC } from 'xrender/sfc/entry';

initSFC(XRender); // 早期初始化

// 然后创建应用
const app = new XRender({ /* ... */ });
```

### 2. 错误处理

```javascript
import { XRender } from 'xrender';
import { initSFC } from 'xrender/sfc/entry';

try {
  initSFC(XRender);
} catch (error) {
  console.error('SFC 初始化失败:', error);
  // 降级处理
}
```

### 3. 组件预加载

```javascript
import { XRender } from 'xrender';
import { initSFC } from 'xrender/sfc/entry';

initSFC(XRender);

// 预加载常用组件
async function preloadComponents() {
  const components = [
    { name: 'Button', path: './components/Button.xrt' },
    { name: 'Input', path: './components/Input.xrt' },
    { name: 'Modal', path: './components/Modal.xrt' }
  ];

  for (const { name, path } of components) {
    try {
      const component = await XRender.loadXRT(path);
      XRender.registerXRT(name, component);
    } catch (error) {
      console.warn(`组件 ${name} 预加载失败:`, error);
    }
  }
}

preloadComponents();
```

## 注意事项

1. **初始化顺序**: 必须先加载 XRender，再初始化 SFC 功能
2. **单次初始化**: 只需要初始化一次，重复初始化不会产生副作用
3. **全局污染**: 初始化后会在 XRender 实例上添加全局方法
4. **异步加载**: `loadXRT` 和 `loadFromFile` 是异步方法，需要使用 `await` 或 `.then()`
5. **文件路径**: 文件路径是相对于当前工作目录的

## 相关文档

- [SFC Index API](./index.md)
- [SFCParser API](./sfc-parser.md)
- [TemplateCompiler API](./template-compiler.md)
- [StyleProcessor API](./style-processor.md)
- [SFCBuilder API](./sfc-builder.md)
- [快速开始指南](../guides/getting-started.md)
