# SFC Index API 文档

## 概述

`index.js` 是 XRender SFC 系统的核心模块文件，提供了完整的 SFC 功能接口。它导出了所有核心类和函数，是开发者使用 SFC 功能的主要入口。

## 导出内容

### 核心类

#### `SFCParser`

SFC 解析器，用于解析单文件组件源码。

**相关文档:** [SFCParser API](./sfc-parser.md)

**示例:**

```javascript
import { SFCParser } from 'xrender/sfc';

const parser = new SFCParser(sfcSource);
const descriptor = parser.parse();
```

#### `TemplateCompiler`

模板编译器，用于编译模板为渲染函数。

**相关文档:** [TemplateCompiler API](./template-compiler.md)

**示例:**

```javascript
import { TemplateCompiler } from 'xrender/sfc';

const compiler = new TemplateCompiler(descriptor);
const { render } = compiler.compile();
```

#### `StyleProcessor`

样式处理器，用于处理组件样式。

**相关文档:** [StyleProcessor API](./style-processor.md)

**示例:**

```javascript
import { StyleProcessor } from 'xrender/sfc';

const processor = new StyleProcessor(descriptor, {
  scopeStyles: true
});
const styles = processor.process();
```

### 核心函数

#### `SFCBuilder`

SFC 构建器，用于构建完整的 SFC 组件。

**相关文档:** [SFCBuilder API](./sfc-builder.md)

**示例:**

```javascript
import { SFCBuilder } from 'xrender/sfc';

const builder = new SFCBuilder(descriptor);
const component = builder.build();
```

#### `registerSFC`

注册 SFC 组件到全局注册表。

**函数签名:**

```javascript
function registerSFC(name, component)
```

**参数:**

- `name` (String): 组件名称
- `component` (Object): 组件定义

**返回值:** (undefined)

**示例:**

```javascript
import { registerSFC } from 'xrender/sfc';

const component = {
  template: '<div>{{ message }}</div>',
  data() {
    return { message: 'Hello' };
  }
};

registerSFC('MyComponent', component);
```

#### `loadXRTFromFile`

从文件加载 XRT 组件。

**函数签名:**

```javascript
function loadXRTFromFile(filePath)
```

**参数:**

- `filePath` (String): 文件路径

**返回值:** (Promise<Object>) 组件定义

**示例:**

```javascript
import { loadXRTFromFile } from 'xrender/sfc';

async function loadComponent() {
  try {
    const component = await loadXRTFromFile('./MyComponent.xrt');
    console.log('组件加载成功:', component);
  } catch (error) {
    console.error('组件加载失败:', error);
  }
}

loadComponent();
```

#### `parseSFC`

解析 SFC 源码的便捷函数。

**函数签名:**

```javascript
function parseSFC(source, options = {})
```

**参数:**

- `source` (String): SFC 源码
- `options` (Object): 解析选项（可选）

**返回值:** (Object) SFC 描述符

**示例:**

```javascript
import { parseSFC } from 'xrender/sfc';

const sfcSource = `
<template>
  <div>{{ message }}</div>
</template>
`;

const descriptor = parseSFC(sfcSource);
console.log('模板:', descriptor.template);
console.log('脚本:', descriptor.script);
console.log('样式:', descriptor.styles);
```

#### `compileSFC`

编译 SFC 源码的便捷函数。

**函数签名:**

```javascript
function compileSFC(source, options = {})
```

**参数:**

- `source` (String): SFC 源码
- `options` (Object): 编译选项（可选）

**返回值:** (Object) 编译结果

**示例:**

```javascript
import { compileSFC } from 'xrender/sfc';

const sfcSource = `
<template>
  <div>{{ message }}</div>
</template>
`;

const compiled = compileSFC(sfcSource);
console.log('渲染函数:', compiled.render);
console.log('插槽:', compiled.slots);
```

#### `initSFC`

初始化 SFC 功能并将其集成到 XRender 实例中。

**函数签名:**

```javascript
function initSFC(XRender)
```

**参数:**

- `XRender` (Object): XRender 实例对象

**返回值:** (undefined)

**示例:**

```javascript
import { XRender } from 'xrender';
import { initSFC } from 'xrender/sfc';

initSFC(XRender);
```

## 完整示例

### 1. 基本使用

```javascript
import { parseSFC, compileSFC } from 'xrender/sfc';

const sfcSource = `
<template>
  <div class="hello">
    <h1>{{ message }}</h1>
    <button @click="updateMessage">更新消息</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello, World!'
    };
  },
  methods: {
    updateMessage() {
      this.message = 'Hello, XRender!';
    }
  }
};
</script>

<style>
.hello {
  padding: 20px;
  text-align: center;
}

.hello h1 {
  color: #333;
}

.hello button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
`;

// 解析 SFC
const descriptor = parseSFC(sfcSource);
console.log('SFC 描述符:', descriptor);

// 编译 SFC
const compiled = compileSFC(sfcSource);
console.log('编译结果:', compiled);
```

### 2. 使用核心类

```javascript
import {
  SFCParser,
  TemplateCompiler,
  StyleProcessor,
  SFCBuilder
} from 'xrender/sfc';

const sfcSource = `
<template>
  <div>{{ message }}</div>
</template>

<script>
export default {
  data() {
    return { message: 'Hello' };
  }
};
</script>

<style>
div { color: red; }
</style>
`;

// 1. 解析 SFC
const parser = new SFCParser(sfcSource);
const descriptor = parser.parse();

// 2. 编译模板
const templateCompiler = new TemplateCompiler(descriptor);
const { render } = templateCompiler.compile();

// 3. 处理样式
const styleProcessor = new StyleProcessor(descriptor, {
  scopeStyles: true
});
const styles = styleProcessor.process();

// 4. 构建组件
const builder = new SFCBuilder(descriptor);
const component = builder.build();

console.log('组件:', component);
```

### 3. 从文件加载组件

```javascript
import { loadXRTFromFile, registerSFC } from 'xrender/sfc';

async function loadAndRegisterComponents() {
  try {
    // 加载组件
    const Button = await loadXRTFromFile('./components/Button.xrt');
    const Input = await loadXRTFromFile('./components/Input.xrt');
    const Modal = await loadXRTFromFile('./components/Modal.xrt');

    // 注册组件
    registerSFC('Button', Button);
    registerSFC('Input', Input);
    registerSFC('Modal', Modal);

    console.log('所有组件加载并注册成功');
  } catch (error) {
    console.error('组件加载失败:', error);
  }
}

loadAndRegisterComponents();
```

### 4. 集成到 XRender

```javascript
import { XRender } from 'xrender';
import { initSFC, loadXRTFromFile } from 'xrender/sfc';

// 初始化 SFC 功能
initSFC(XRender);

// 创建应用
const app = new XRender({
  el: '#app',
  data: {
    message: 'Hello, XRender!'
  }
});

// 加载并注册组件
async function setupApp() {
  try {
    const App = await loadXRTFromFile('./App.xrt');
    XRender.registerXRT('App', App);

    const Header = await loadXRTFromFile('./components/Header.xrt');
    XRender.registerXRT('Header', Header);

    const Footer = await loadXRTFromFile('./components/Footer.xrt');
    XRender.registerXRT('Footer', Footer);

    console.log('应用设置完成');
  } catch (error) {
    console.error('应用设置失败:', error);
  }
}

setupApp();
```

### 5. 高级用法：自定义选项

```javascript
import {
  parseSFC,
  compileSFC,
  TemplateCompiler,
  StyleProcessor
} from 'xrender/sfc';

const sfcSource = `
<template>
  <div>{{ message }}</div>
</template>

<style>
.container { color: red; }
</style>
`;

// 使用自定义选项解析
const descriptor = parseSFC(sfcSource, {
  filename: 'MyComponent.xrt',
  sourceRoot: '/src/components'
});

// 使用自定义选项编译模板
const templateCompiler = new TemplateCompiler(descriptor, {
  scopeId: 'my-component-scope',
  directiveTransforms: {
    'my-directive': (node, dir, context) => {
      // 自定义指令转换逻辑
      return `customTransform(${node}, ${dir.value})`;
    }
  }
});

const { render } = templateCompiler.compile();

// 使用自定义选项处理样式
const styleProcessor = new StyleProcessor(descriptor, {
  scopeStyles: true,
  extractStyles: true,
  autoLoad: false
});

const styles = styleProcessor.process();

console.log('渲染函数:', render);
console.log('样式:', styles);
```

## API 对比

### parseSFC vs SFCParser

| 特性 | parseSFC | SFCParser |
|------|----------|-----------|
| 使用方式 | 函数调用 | 类实例化 |
| 灵活性 | 低 | 高 |
| 自定义选项 | 有限 | 完全支持 |
| 推荐场景 | 简单解析 | 复杂解析 |

### compileSFC vs TemplateCompiler

| 特性 | compileSFC | TemplateCompiler |
|------|------------|------------------|
| 使用方式 | 函数调用 | 类实例化 |
| 灵活性 | 低 | 高 |
| 自定义选项 | 有限 | 完全支持 |
| 推荐场景 | 简单编译 | 复杂编译 |

### registerSFC vs XRender.registerXRT

| 特性 | registerSFC | XRender.registerXRT |
|------|-------------|---------------------|
| 使用方式 | 直接调用 | 需要初始化 |
| 全局可用 | 是 | 否（需要 initSFC） |
| 推荐场景 | 独立使用 | 集成到 XRender |

## 最佳实践

### 1. 选择合适的 API

```javascript
// 简单场景：使用便捷函数
import { parseSFC, compileSFC } from 'xrender/sfc';
const descriptor = parseSFC(source);
const compiled = compileSFC(source);

// 复杂场景：使用核心类
import { SFCParser, TemplateCompiler } from 'xrender/sfc';
const parser = new SFCParser(source, customOptions);
const compiler = new TemplateCompiler(descriptor, customOptions);
```

### 2. 错误处理

```javascript
import { loadXRTFromFile } from 'xrender/sfc';

async function safeLoadComponent(filePath) {
  try {
    const component = await loadXRTFromFile(filePath);
    return { success: true, component };
  } catch (error) {
    console.error(`加载组件失败: ${filePath}`, error);
    return { success: false, error };
  }
}

const result = await safeLoadComponent('./MyComponent.xrt');
if (result.success) {
  console.log('组件加载成功:', result.component);
} else {
  console.error('组件加载失败:', result.error);
}
```

### 3. 组件预加载

```javascript
import { loadXRTFromFile, registerSFC } from 'xrender/sfc';

async function preloadComponents() {
  const components = [
    { name: 'Button', path: './components/Button.xrt' },
    { name: 'Input', path: './components/Input.xrt' },
    { name: 'Modal', path: './components/Modal.xrt' }
  ];

  const results = await Promise.allSettled(
    components.map(async ({ name, path }) => {
      const component = await loadXRTFromFile(path);
      registerSFC(name, component);
      return { name, success: true };
    })
  );

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(`组件 ${components[index].name} 预加载失败`);
    }
  });
}

preloadComponents();
```

### 4. 模块化导入

```javascript
// 推荐按需导入
import { parseSFC } from 'xrender/sfc';

// 不推荐导入所有
import * as SFC from 'xrender/sfc';
```

## 注意事项

1. **初始化顺序**: 使用 `initSFC` 时必须先加载 XRender
2. **异步操作**: `loadXRTFromFile` 是异步方法，需要使用 `await` 或 `.then()`
3. **文件路径**: 文件路径是相对于当前工作目录的
4. **内存管理**: 大量加载组件时注意内存使用
5. **错误处理**: 始终处理异步操作的错误

## 相关文档

- [SFCParser API](./sfc-parser.md)
- [TemplateCompiler API](./template-compiler.md)
- [StyleProcessor API](./style-processor.md)
- [SFCBuilder API](./sfc-builder.md)
- [Entry API](./entry.md)
- [XProgress API](./xprogress.md)
- [快速开始指南](../guides/getting-started.md)
- [架构设计文档](../architecture.md)
