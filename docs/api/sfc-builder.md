# SFCBuilder API 文档

SFC 组件构建器，将解析和编译的结果与 XRender 组件系统集成。

## 概述

`SFCBuilder` 是 SFC（单文件组件）构建系统的核心组件，负责将 SFC 解析器生成的描述符转换为可用的 XRender 组件。它支持模板编译、样式处理和脚本集成，并提供异步组件加载功能。

## 类

### SFCBuilder

SFC 组件构建器类。

#### 构造函数

```javascript
new SFCBuilder(name, descriptor, options)
```

##### 参数

- `name` (String) - 组件名称
- `descriptor` (Object) - SFC 描述符对象
  - `template` (String) - 模板内容
  - `script` (Object) - 脚本配置
  - `styles` (Array) - 样式数组
- `options` (Object) - 配置选项
  - `template` (Boolean) - 是否处理模板，默认 `true`
  - `styles` (Boolean) - 是否处理样式，默认 `true`
  - `adapter` (Object) - XRender 适配器，默认自动检测

##### 示例

```javascript
import { SFCBuilder } from './sfc-builder.js';

const descriptor = {
  template: '<div>{{ message }}</div>',
  script: {
    setup: `
      const message = ref('Hello World');
      return { message };
    `
  },
  styles: ['.container { color: red; }']
};

const builder = new SFCBuilder('MyComponent', descriptor);
```

#### 方法

##### build

构建组件。

```javascript
build()
```

###### 返回值

返回构建后的组件配置对象。

###### 示例

```javascript
const component = builder.build();
console.log(component);
```

##### _buildTemplate

构建模板。

```javascript
_buildTemplate()
```

###### 返回值

返回编译后的模板对象。

##### _buildStyles

构建样式。

```javascript
_buildStyles()
```

###### 返回值

返回处理后的样式对象。

##### _buildScript

构建脚本。

```javascript
_buildScript(template, styles)
```

###### 参数

- `template` (Object) - 模板对象
- `styles` (Object) - 样式对象

###### 返回值

返回脚本配置对象。

##### _generateScopeId

生成作用域 ID。

```javascript
_generateScopeId()
```

###### 返回值

返回唯一的作用域 ID 字符串。

##### _createSetupFunction

创建 setup 函数。

```javascript
_createSetupFunction(script)
```

###### 参数

- `script` (Object) - 脚本对象

###### 返回值

返回 setup 函数。

##### _evaluateComponent

评估组件。

```javascript
_evaluateComponent(config)
```

###### 参数

- `config` (Object) - 组件配置

###### 返回值

返回评估后的组件。

## 函数

### createAsyncComponent

创建异步组件工厂函数。

```javascript
createAsyncComponent(options)
```

#### 参数

- `options` (Object) - 配置选项
  - `loader` (Function) - 组件加载函数，返回 Promise
  - `loadingComponent` (Object) - 加载中显示的组件，默认 `null`
  - `errorComponent` (Object) - 错误时显示的组件，默认 `null`
  - `delay` (Number) - 延迟显示加载组件的时间（毫秒），默认 `200`
  - `timeout` (Number) - 超时时间（毫秒），默认 `30000`

#### 返回值

返回异步组件工厂函数。

#### 示例

```javascript
import { createAsyncComponent } from './sfc-builder.js';

const AsyncComponent = createAsyncComponent({
  loader: () => import('./MyComponent.js'),
  loadingComponent: {
    render(createElem) {
      return createElem('div', { class: 'loading' }, ['Loading...']);
    }
  },
  errorComponent: {
    render(createElem) {
      return createElem('div', { class: 'error' }, ['Failed to load']);
    }
  },
  delay: 200,
  timeout: 10000
});

// 使用异步组件
AsyncComponent().then(component => {
  console.log('组件加载完成:', component);
});
```

### registerAsyncSFC

注册异步 SFC 组件。

```javascript
registerAsyncSFC(name, options)
```

#### 参数

- `name` (String) - 组件名称
- `options` (Object) - 异步组件选项（同 `createAsyncComponent`）

#### 返回值

返回异步组件配置对象。

#### 示例

```javascript
import { registerAsyncSFC } from './sfc-builder.js';

const asyncComponent = registerAsyncSFC('MyAsyncComponent', {
  loader: () => fetch('./my-component.xrt').then(res => res.text()),
  loadingComponent: { /* ... */ },
  errorComponent: { /* ... */ }
});
```

### registerSFC

注册 SFC 组件。

```javascript
registerSFC(name, source, options)
```

#### 参数

- `name` (String) - 组件名称
- `source` (String) - SFC 源代码
- `options` (Object) - 配置选项（同 `SFCBuilder` 构造函数）

#### 返回值

返回构建后的组件。

#### 示例

```javascript
import { registerSFC } from './sfc-builder.js';

const sfcSource = `
<template>
  <div class="container">
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
  </div>
</template>

<script>
setup() {
  const title = ref('Welcome');
  const message = ref('Hello World');
  return { title, message };
}
</script>

<style>
.container {
  padding: 20px;
}
</style>
`;

const component = registerSFC('MyComponent', sfcSource);
```

### loadXRTFromFile

从文件加载 XRT 组件。

```javascript
loadXRTFromFile(path, options)
```

#### 参数

- `path` (String) - XRT 文件路径
- `options` (Object) - 配置选项（同 `registerSFC`）

#### 返回值

返回 Promise，解析为构建后的组件。

#### 示例

```javascript
import { loadXRTFromFile } from './sfc-builder.js';

loadXRTFromFile('./components/MyComponent.xrt')
  .then(component => {
    console.log('组件加载完成:', component);
  })
  .catch(error => {
    console.error('组件加载失败:', error);
  });
```

### loadAsyncSFCFromFile

异步加载 SFC 文件。

```javascript
loadAsyncSFCFromFile(path, asyncOptions)
```

#### 参数

- `path` (String) - SFC 文件路径
- `asyncOptions` (Object) - 异步组件选项（同 `createAsyncComponent`）

#### 返回值

返回异步组件配置对象。

#### 示例

```javascript
import { loadAsyncSFCFromFile } from './sfc-builder.js';

const asyncComponent = loadAsyncSFCFromFile('./components/MyComponent.xrt', {
  loadingComponent: { /* ... */ },
  errorComponent: { /* ... */ },
  delay: 300
});
```

## 使用示例

### 基本使用

```javascript
import { SFCBuilder, SFCParser } from './sfc-builder.js';

// 解析 SFC
const parser = new SFCParser(sfcSource);
const descriptor = parser.parse();

// 构建组件
const builder = new SFCBuilder('MyComponent', descriptor);
const component = builder.build();

// 使用组件
XRender.mount(component, '#app');
```

### 使用便捷函数

```javascript
import { registerSFC } from './sfc-builder.js';

const sfcSource = `
<template>
  <div>{{ message }}</div>
</template>

<script>
setup() {
  const message = ref('Hello');
  return { message };
}
</script>
`;

const component = registerSFC('MyComponent', sfcSource);
XRender.component('MyComponent', component);
```

### 异步组件

```javascript
import { createAsyncComponent } from './sfc-builder.js';

const AsyncComponent = createAsyncComponent({
  loader: () => import('./HeavyComponent.js'),
  loadingComponent: {
    render(createElem) {
      return createElem('div', { class: 'loading-spinner' }, [
        createElem('div', { class: 'spinner' })
      ]);
    }
  },
  errorComponent: {
    render(createElem) {
      return createElem('div', { class: 'error-message' }, [
        '组件加载失败，请刷新页面重试'
      ]);
    }
  },
  delay: 500,
  timeout: 15000
});

// 在路由中使用
const routes = [
  {
    path: '/heavy',
    component: AsyncComponent
  }
];
```

### 从文件加载

```javascript
import { loadXRTFromFile } from './sfc-builder.js';

async function loadComponent() {
  try {
    const component = await loadXRTFromFile('./components/MyComponent.xrt');
    XRender.component('MyComponent', component);
  } catch (error) {
    console.error('加载组件失败:', error);
  }
}

loadComponent();
```

### 批量加载组件

```javascript
import { loadXRTFromFile } from './sfc-builder.js';

async function loadComponents() {
  const componentPaths = [
    './components/Header.xrt',
    './components/Footer.xrt',
    './components/Sidebar.xrt'
  ];

  const components = await Promise.all(
    componentPaths.map(path => loadXRTFromFile(path))
  );

  components.forEach((component, index) => {
    const name = componentPaths[index].split('/').pop().replace('.xrt', '');
    XRender.component(name, component);
  });
}

loadComponents();
```

### 自定义构建选项

```javascript
import { SFCBuilder, SFCParser } from './sfc-builder.js';

const parser = new SFCParser(sfcSource);
const descriptor = parser.parse();

const builder = new SFCBuilder('MyComponent', descriptor, {
  template: true,
  styles: true,
  adapter: XRender
});

const component = builder.build();
```

## 最佳实践

1. **使用便捷函数**：优先使用 `registerSFC` 等便捷函数，简化组件注册流程。

2. **异步加载大组件**：对于大型组件，使用 `createAsyncComponent` 进行异步加载，提升首屏加载速度。

3. **提供加载状态**：为异步组件提供友好的加载和错误状态组件，提升用户体验。

4. **合理设置超时时间**：根据网络环境和组件大小设置合理的超时时间。

5. **错误处理**：始终处理组件加载失败的情况，提供友好的错误提示。

6. **组件命名规范**：使用清晰的组件命名规范，便于管理和维护。

7. **文件组织**：将 SFC 文件组织在合理的目录结构中，便于查找和维护。

8. **缓存策略**：对于频繁使用的组件，考虑使用缓存策略减少重复加载。

## 注意事项

- SFC 文件必须包含 `<template>` 标签，否则构建会失败。
- `<script>` 标签中的 `setup` 函数必须返回一个对象，包含需要在模板中使用的变量和方法。
- 样式处理依赖于浏览器的 CSS 支持，某些高级特性可能不兼容。
- 异步组件的加载函数必须返回 Promise。
- 加载组件时，确保文件路径正确，并且服务器支持 CORS（如果跨域加载）。
- 在生产环境中，建议使用构建工具（如 Webpack、Vite）来处理 SFC 文件。
- 作用域 ID 是随机生成的，不要依赖其特定值。
