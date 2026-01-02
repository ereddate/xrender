# 高级样式处理器 API

高级样式处理器提供强大的样式处理功能，支持 CSS Modules 和 Scoped CSS，以及样式注入和缓存。

## 构造函数

```javascript
new AdvancedStyleProcessor(options)
```

### 参数

- `options` (Object): 配置选项
  - `scopeIdPrefix` (String): 作用域 ID 前缀，默认 'xrt-scope-'
  - `enableCSSModules` (Boolean): 是否启用 CSS Modules，默认 true
  - `enableScopedCSS` (Boolean): 是否启用 Scoped CSS，默认 true
  - `generateScopedId` (Function): 生成作用域 ID 的函数
  - `hashFunction` (Function): 哈希函数
  - `minify` (Boolean): 是否压缩 CSS，默认 true
  - `sourceMap` (Boolean): 是否生成源码映射，默认 false

### 示例

```javascript
import { AdvancedStyleProcessor } from './advanced-style-processor';

const styleProcessor = new AdvancedStyleProcessor({
  scopeIdPrefix: 'my-app-',
  enableCSSModules: true,
  enableScopedCSS: true,
  minify: true
});
```

## 方法

### processComponentStyles

处理组件样式。

```javascript
styleProcessor.processComponentStyles(component, options)
```

#### 参数

- `component` (Object): 组件对象
  - `styles` (Array): 样式数组
    - `content` (String): 样式内容
    - `scoped` (Boolean): 是否为 Scoped CSS
    - `modules` (Boolean): 是否为 CSS Modules
    - `lang` (String): 样式语言，默认 'css'
    - `media` (String): 媒体查询
    - `supports` (String): Supports 条件
- `options` (Object): 选项，可选
  - `scopeId` (String): 作用域 ID

#### 返回值

- (Promise): 返回处理结果的 Promise
  - `css` (String): 处理后的 CSS
  - `cssModules` (Object): CSS Modules 映射
  - `scopeId` (String): 作用域 ID

#### 示例

```javascript
const result = await styleProcessor.processComponentStyles({
  name: 'my-component',
  styles: [
    {
      content: '.container { color: red; }',
      scoped: true,
      modules: true
    }
  ]
});

console.log(result.css);
console.log(result.cssModules);
```

### processSFCStyles

处理 SFC 样式块。

```javascript
styleProcessor.processSFCStyles(styles, scopeId, options)
```

#### 参数

- `styles` (Array): 样式块数组
- `scopeId` (String): 作用域 ID
- `options` (Object): 选项，可选
  - `sourceMap` (Boolean): 是否生成源码映射

#### 返回值

- (Object): 处理结果对象
  - `styles` (Array): 处理后的样式数组
  - `modules` (Object): CSS Modules 映射
  - `scopeId` (String): 作用域 ID
  - `sourceMap` (Object): 源码映射

#### 示例

```javascript
const result = styleProcessor.processSFCStyles(
  [
    '<style scoped>.container { color: red; }</style>',
    '<style module>.button { background: blue; }</style>'
  ],
  'my-component'
);

console.log(result.styles);
console.log(result.modules);
```

### injectStyles

注入样式到 DOM。

```javascript
styleProcessor.injectStyles(styles, options)
```

#### 参数

- `styles` (Array): 样式数组
- `options` (Object): 选项，可选
  - `media` (String): 媒体查询
  - `supports` (String): Supports 条件

#### 返回值

- (Array): 注入的样式元素数组

#### 示例

```javascript
const injected = styleProcessor.injectStyles([
  '.container { color: red; }',
  '.button { background: blue; }'
], {
  media: 'screen and (max-width: 768px)'
});
```

### removeStyles

移除样式。

```javascript
styleProcessor.removeStyles(styleId)
```

#### 参数

- `styleId` (String): 样式 ID

#### 示例

```javascript
styleProcessor.removeStyles('style-123');
```

### removeInjectedStyles

移除已注入的样式。

```javascript
styleProcessor.removeInjectedStyles(scopeId)
```

#### 参数

- `scopeId` (String): 作用域 ID

#### 示例

```javascript
styleProcessor.removeInjectedStyles('my-component');
```

### getCSSModules

获取 CSS Modules。

```javascript
styleProcessor.getCSSModules(moduleName)
```

#### 参数

- `moduleName` (String): 模块名称

#### 返回值

- (Object | undefined): CSS Modules 对象，如果不存在则返回 undefined

#### 示例

```javascript
const modules = styleProcessor.getCSSModules('my-component_1');
console.log(modules);
```

### getScopedStyles

获取 Scoped 样式。

```javascript
styleProcessor.getScopedStyles(scopeId)
```

#### 参数

- `scopeId` (String): 作用域 ID

#### 返回值

- (Object | undefined): Scoped 样式对象，如果不存在则返回 undefined

#### 示例

```javascript
const scoped = styleProcessor.getScopedStyles('xrt-scope-my-component');
console.log(scoped.content);
```

### clearCache

清除缓存。

```javascript
styleProcessor.clearCache()
```

#### 示例

```javascript
styleProcessor.clearCache();
```

### getStats

获取统计信息。

```javascript
styleProcessor.getStats()
```

#### 返回值

- (Object): 统计信息对象
  - `totalStyles` (Number): 总样式数
  - `scopedStyles` (Number): Scoped 样式数
  - `moduleStyles` (Number): CSS Modules 样式数
  - `cacheSize` (Number): 缓存大小
  - `memoryUsage` (Number): 内存使用量（字节）

#### 示例

```javascript
const stats = styleProcessor.getStats();
console.log(`总样式数: ${stats.totalStyles}`);
console.log(`Scoped 样式数: ${stats.scopedStyles}`);
console.log(`CSS Modules 样式数: ${stats.moduleStyles}`);
console.log(`内存使用: ${stats.memoryUsage} 字节`);
```

### destroy

销毁样式处理器。

```javascript
styleProcessor.destroy()
```

#### 示例

```javascript
styleProcessor.destroy();
```

## 全局实例

```javascript
import { advancedStyleProcessor } from './advanced-style-processor';

// 使用全局实例
const result = await advancedStyleProcessor.processComponentStyles(component);
```

## 便捷方法

### processStyles

处理样式。

```javascript
import { processStyles } from './advanced-style-processor';

const result = processStyles(styles, scopeId, options);
```

### injectStyles

注入样式。

```javascript
import { injectStyles } from './advanced-style-processor';

const injected = injectStyles(styles, options);
```

### getCSSModules

获取 CSS Modules。

```javascript
import { getCSSModules } from './advanced-style-processor';

const modules = getCSSModules(moduleName);
```

### getScopedStyles

获取 Scoped 样式。

```javascript
import { getScopedStyles } from './advanced-style-processor';

const scoped = getScopedStyles(scopeId);
```

## 使用示例

### 处理组件样式

```javascript
import { AdvancedStyleProcessor } from './advanced-style-processor';

const styleProcessor = new AdvancedStyleProcessor();

const result = await styleProcessor.processComponentStyles({
  name: 'my-component',
  styles: [
    {
      content: '.container { color: red; }',
      scoped: true,
      modules: true
    }
  ]
});

console.log(result.css);
console.log(result.cssModules);
```

### 处理 SFC 样式

```javascript
const result = styleProcessor.processSFCStyles(
  [
    '<style scoped>.container { color: red; }</style>',
    '<style module>.button { background: blue; }</style>',
    '<style lang="scss">@import "variables";</style>'
  ],
  'my-component',
  { sourceMap: true }
);

console.log(result.styles);
console.log(result.modules);
console.log(result.sourceMap);
```

### 注入样式

```javascript
// 注入样式到 DOM
const injected = styleProcessor.injectStyles([
  '.container { color: red; }',
  '.button { background: blue; }'
]);

// 带媒体查询
styleProcessor.injectStyles(
  ['.container { color: red; }'],
  { media: 'screen and (max-width: 768px)' }
);

// 带 Supports 条件
styleProcessor.injectStyles(
  ['.container { color: red; }'],
  { supports: '(display: grid)' }
);
```

### 移除样式

```javascript
// 移除特定样式
styleProcessor.removeStyles('style-123');

// 移除所有相关样式
styleProcessor.removeInjectedStyles('my-component');
```

### 获取 CSS Modules

```javascript
const modules = styleProcessor.getCSSModules('my-component_1');
console.log(modules.container); // 'my-component_1_abc123'
console.log(modules.button); // 'my-component_1_def456'
```

### 获取 Scoped 样式

```javascript
const scoped = styleProcessor.getScopedStyles('xrt-scope-my-component');
console.log(scoped.content);
console.log(scoped.scopeId);
```

### 统计信息

```javascript
const stats = styleProcessor.getStats();
console.log(`总样式数: ${stats.totalStyles}`);
console.log(`Scoped 样式数: ${stats.scopedStyles}`);
console.log(`CSS Modules 样式数: ${stats.moduleStyles}`);
console.log(`缓存大小: ${stats.cacheSize}`);
console.log(`内存使用: ${stats.memoryUsage} 字节`);
```

### 清除缓存

```javascript
// 清除所有缓存
styleProcessor.clearCache();
```

### 销毁处理器

```javascript
// 销毁样式处理器，移除所有注入的样式
styleProcessor.destroy();
```

## CSS Modules 使用示例

### 定义 CSS Modules

```javascript
const result = styleProcessor.processSFCStyles(
  [
    '<style module>' +
    '.container { padding: 20px; }' +
    '.button { background: blue; }' +
    '</style>'
  ],
  'my-component'
);

// result.modules 包含:
// {
//   container: 'my-component_abc123',
//   button: 'my-component_def456'
// }
```

### 使用 CSS Modules

```javascript
const modules = result.modules;

// 在模板中使用
const html = `
  <div class="${modules.container}">
    <button class="${modules.button}">Click me</button>
  </div>
`;
```

## Scoped CSS 使用示例

### 定义 Scoped CSS

```javascript
const result = styleProcessor.processSFCStyles(
  [
    '<style scoped>' +
    '.container { padding: 20px; }' +
    '.button { background: blue; }' +
    '</style>'
  ],
  'my-component'
);

// result.styles 包含作用域化的 CSS
```

### 使用 Scoped CSS

```javascript
// 在模板中添加 data 属性
const html = `
  <div data-xrt-scope-my-component>
    <div class="container">
      <button class="button">Click me</button>
    </div>
  </div>
`;

// 注入样式
styleProcessor.injectStyles(result.styles);
```

## 媒体查询和 Supports

### 媒体查询

```javascript
styleProcessor.injectStyles(
  ['.container { color: red; }'],
  { media: 'screen and (max-width: 768px)' }
);
```

### Supports 条件

```javascript
styleProcessor.injectStyles(
  ['.container { display: grid; }'],
  { supports: '(display: grid)' }
);
```

## 样式压缩

样式处理器默认会压缩 CSS，可以通过配置禁用：

```javascript
const styleProcessor = new AdvancedStyleProcessor({
  minify: false
});
```

## 源码映射

可以生成源码映射以支持调试：

```javascript
const result = styleProcessor.processSFCStyles(
  styles,
  'my-component',
  { sourceMap: true }
);

console.log(result.sourceMap);
```
