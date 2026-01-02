# StyleProcessor API 文档

## 概述

`StyleProcessor` 是 XRender SFC 系统中的样式处理器，负责处理 SFC 组件中的样式部分。它支持样式作用域、样式提取和自动加载等功能，确保组件样式的隔离和管理。

## 类定义

```javascript
export class StyleProcessor {
  constructor(descriptor, options = {})
}
```

## 构造函数

### `new StyleProcessor(descriptor, options)`

创建一个新的样式处理器实例。

**参数:**

- `descriptor` (Object): SFC 描述符对象，包含样式信息
  - `styles` (Array<String>): 样式内容数组
- `options` (Object): 处理选项（可选）
  - `scopeStyles` (Boolean): 是否启用样式作用域，默认为 `false`
  - `extractStyles` (Boolean): 是否提取样式到独立的 `<style>` 标签，默认为 `true`
  - `autoLoad` (Boolean): 是否自动加载样式到页面，默认为 `true`

**示例:**

```javascript
const descriptor = {
  styles: [
    '.container { color: red; }',
    '.button { background: blue; }'
  ]
};

const processor = new StyleProcessor(descriptor, {
  scopeStyles: true,
  extractStyles: true,
  autoLoad: true
});
```

## 实例方法

### `process()`

处理样式并返回处理结果。

**返回值:** (String|null) 处理后的样式字符串或样式元素 ID

- 如果 `autoLoad` 为 `true`，返回样式元素的 ID
- 如果 `autoLoad` 为 `false`，返回处理后的样式字符串
- 如果没有样式，返回 `null`

**示例:**

```javascript
const result = processor.process();

// 自动加载模式
console.log(result); // "xrender-style-1234567890"

// 非自动加载模式
console.log(result); // ".xrender-scope-abc123 .container { color: red; }"
```

## 样式作用域

### 启用作用域

```javascript
const processor = new StyleProcessor(descriptor, {
  scopeStyles: true
});
```

### 作用域转换规则

样式处理器会自动为所有选择器添加作用域类名：

```css
/* 输入 */
.container { color: red; }
.button { background: blue; }

/* 输出 */
.xrender-scope-abc123 .container { color: red; }
.xrender-scope-abc123 .button { background: blue; }
```

### 伪元素和伪类

```css
/* 输入 */
.button:hover { background: darkblue; }
.input:focus { border: 1px solid blue; }
.item::before { content: ''; }

/* 输出 */
.xrender-scope-abc123 .button:hover { background: darkblue; }
.xrender-scope-abc123 .input:focus { border: 1px solid blue; }
.xrender-scope-abc123 .item::before { content: ''; }
```

### 组合选择器

```css
/* 输入 */
.parent > .child { margin: 10px; }
.sibling + .next { margin-left: 5px; }
.all ~ .elements { color: gray; }

/* 输出 */
.xrender-scope-abc123 .parent > .xrender-scope-abc123 .child { margin: 10px; }
.xrender-scope-abc123 .sibling + .xrender-scope-abc123 .next { margin-left: 5px; }
.xrender-scope-abc123 .all ~ .xrender-scope-abc123 .elements { color: gray; }
```

### 媒体查询

```css
/* 输入 */
@media (max-width: 768px) {
  .container { padding: 10px; }
}

/* 输出 */
@media (max-width: 768px) {
  .xrender-scope-abc123 .container { padding: 10px; }
}
```

### 多选择器

```css
/* 输入 */
.button, .link { color: blue; }

/* 输出 */
.xrender-scope-abc123 .button, .xrender-scope-abc123 .link { color: blue; }
```

## 样式提取和加载

### 自动加载模式

```javascript
const processor = new StyleProcessor(descriptor, {
  extractStyles: true,
  autoLoad: true
});

const styleId = processor.process();
// 返回: "xrender-style-1234567890"
// 样式已自动添加到 <head> 中
```

### 手动加载模式

```javascript
const processor = new StyleProcessor(descriptor, {
  extractStyles: true,
  autoLoad: false
});

const styles = processor.process();
// 返回: ".xrender-scope-abc123 .container { color: red; }"

// 手动添加样式
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);
```

### 不提取模式

```javascript
const processor = new StyleProcessor(descriptor, {
  extractStyles: false,
  autoLoad: false
});

const styles = processor.process();
// 返回: [".container { color: red; }", ".button { background: blue; }"]
```

## 完整示例

### 基本使用

```javascript
import { StyleProcessor } from './style-processor.js';

const descriptor = {
  styles: [
    `
    .container {
      padding: 20px;
      background: #f5f5f5;
    }
    
    .title {
      font-size: 24px;
      color: #333;
    }
    
    .button {
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .button:hover {
      background: #0056b3;
    }
    `
  ]
};

const processor = new StyleProcessor(descriptor, {
  scopeStyles: true,
  extractStyles: true,
  autoLoad: true
});

const styleId = processor.process();
console.log('样式已加载，ID:', styleId);
```

### 复杂样式处理

```javascript
const descriptor = {
  styles: [
    `
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .card-header {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    
    .card-body {
      padding: 15px;
    }
    
    .card-footer {
      padding: 15px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .card-footer > button {
      margin-left: 10px;
    }
    
    @media (max-width: 768px) {
      .card {
        margin: 10px;
      }
      
      .card-header,
      .card-body,
      .card-footer {
        padding: 10px;
      }
    }
    `
  ]
};

const processor = new StyleProcessor(descriptor, {
  scopeStyles: true,
  extractStyles: true,
  autoLoad: true
});

const styleId = processor.process();
```

### 与模板编译器配合使用

```javascript
import { StyleProcessor } from './style-processor.js';
import { TemplateCompiler } from './template-compiler.js';

const descriptor = {
  template: '<div class="card">...</div>',
  styles: [
    `
    .card {
      background: white;
      padding: 20px;
      border-radius: 8px;
    }
    `
  ]
};

// 编译模板
const templateCompiler = new TemplateCompiler(descriptor, {
  scopeId: 'my-component-scope'
});
const { render } = templateCompiler.compile();

// 处理样式
const styleProcessor = new StyleProcessor(descriptor, {
  scopeStyles: true,
  extractStyles: true,
  autoLoad: true
});
const styleId = styleProcessor.process();

// 渲染组件
const element = render(createElem, {}, {});
```

## 样式清理

### 移除自动加载的样式

```javascript
const styleId = processor.process();

// 稍后移除样式
const styleElement = document.getElementById(styleId);
if (styleElement) {
  styleElement.remove();
}
```

### 批量清理样式

```javascript
function cleanupStyles() {
  const styleElements = document.querySelectorAll('style[id^="xrender-style-"]');
  styleElements.forEach(element => element.remove());
}
```

## 最佳实践

### 1. 始终启用作用域

```javascript
const processor = new StyleProcessor(descriptor, {
  scopeStyles: true  // 避免样式冲突
});
```

### 2. 使用语义化的类名

```css
/* 推荐 */
.todo-item { }
.todo-item.completed { }
.todo-item__title { }

/* 不推荐 */
.item { }
.item.active { }
.title { }
```

### 3. 合理使用媒体查询

```css
/* 移动优先 */
.container {
  padding: 10px;
}

@media (min-width: 768px) {
  .container {
    padding: 20px;
  }
}
```

### 4. 避免过度嵌套

```css
/* 推荐 */
.button { }
.button.primary { }
.button.large { }

/* 不推荐 */
.container .header .actions .button.primary.large { }
```

### 5. 使用 CSS 变量

```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --border-radius: 4px;
}

.button {
  background: var(--primary-color);
  border-radius: var(--border-radius);
}
```

## 注意事项

1. **作用域限制**: 样式作用域通过添加类名实现，不是真正的 CSS 作用域
2. **全局样式**: 全局样式（如 `body`, `html`）不会被作用域化
3. **性能考虑**: 大量的样式规则可能影响性能，建议按需加载
4. **样式优先级**: 作用域样式可能被全局样式覆盖，需要注意选择器优先级
5. **动态样式**: 动态添加的样式需要手动处理作用域

## 错误处理

样式处理器会静默处理错误，不会抛出异常。建议在使用前验证输入：

```javascript
function validateStyles(descriptor) {
  if (!descriptor || !Array.isArray(descriptor.styles)) {
    console.error('无效的样式描述符');
    return false;
  }
  return true;
}

if (validateStyles(descriptor)) {
  const processor = new StyleProcessor(descriptor);
  const result = processor.process();
}
```

## 相关文档

- [SFC 组件管理指南](../guides/sfc-guide.md)
- [TemplateCompiler API](./template-compiler.md)
- [SFCParser API](./sfc-parser.md)
- [AdvancedStyleProcessor API](./advanced-style-processor.md)
