# SFCParser API 文档

SFC 解析器，用于解析 .xrt 单文件组件。

## 概述

`SFCParser` 是 SFC（单文件组件）解析系统的核心组件，负责将 .xrt 文件源代码解析为结构化的描述符对象。它支持模板、脚本和样式的提取与解析，并提供基本的语法验证功能。

## 类

### SFCParser

SFC 解析器类。

#### 构造函数

```javascript
new SFCParser(source, options)
```

##### 参数

- `source` (String) - SFC 源代码字符串
- `options` (Object) - 配置选项
  - `extractStyles` (Boolean) - 是否提取样式，默认 `true`
  - `scopeStyles` (Boolean) - 是否作用域化样式，默认 `false`

##### 示例

```javascript
import { SFCParser } from './sfc-parser.js';

const sfcSource = `
<template>
  <div class="container">
    <h1>{{ title }}</h1>
  </div>
</template>

<script>
setup() {
  const title = ref('Hello World');
  return { title };
}
</script>

<style>
.container {
  padding: 20px;
}
</style>
`;

const parser = new SFCParser(sfcSource);
```

#### 方法

##### parse

解析 SFC 源代码。

```javascript
parse()
```

###### 返回值

返回 SFC 描述符对象，包含：
- `template` (String) - 模板内容
- `script` (Object) - 脚本配置
  - `name` (String) - 组件名称
  - `setup` (String) - setup 函数内容
  - `state` (Object) - 状态定义
  - `actions` (Object) - 方法定义
- `styles` (Array) - 样式数组
- `errors` (Array) - 错误信息数组
- `name` (String) - 组件名称

###### 示例

```javascript
const descriptor = parser.parse();
console.log(descriptor);
```

##### _parseBlocks

解析各个代码块。

```javascript
_parseBlocks()
```

此方法会提取 `<template>`、`<script>` 和 `<style>` 标签的内容。

##### _validateBlocks

验证代码块。

```javascript
_validateBlocks()
```

此方法会对提取的模板和脚本进行基本验证。

##### _isValidTemplate

验证模板语法。

```javascript
_isValidTemplate(template)
```

###### 参数

- `template` (String) - 模板内容

###### 返回值

返回布尔值，表示模板是否有效。

##### _isValidScript

验证脚本语法。

```javascript
_isValidScript(script)
```

###### 参数

- `script` (String) - 脚本内容

###### 返回值

返回布尔值，表示脚本是否有效。

##### _createDescriptor

创建描述符对象。

```javascript
_createDescriptor()
```

###### 返回值

返回 SFC 描述符对象。

##### _parseScript

解析脚本内容。

```javascript
_parseScript()
```

###### 返回值

返回解析后的脚本对象，包含：
- `name` (String) - 组件名称
- `setup` (String) - setup 函数内容
- `state` (Object) - 状态定义
  - 每个状态项包含 `type`（ref/reactive）和 `value`（值）
- `actions` (Object) - 方法定义

###### 解析规则

1. **组件名称**：从 `name: 'ComponentName'` 中提取
2. **setup 函数**：提取 `setup() { ... }` 函数内容
3. **ref 定义**：解析 `const name = ref(value)` 格式
4. **reactive 定义**：解析 `const name = reactive(object)` 格式
5. **方法定义**：解析 `const methodName = () => { ... }` 格式
6. **返回值**：解析 `return { ... }` 中的导出项

##### _parseState

解析状态字符串。

```javascript
_parseState(stateStr)
```

###### 参数

- `stateStr` (String) - 状态字符串

###### 返回值

返回解析后的状态对象。

##### _parseActions

解析动作字符串。

```javascript
_parseActions(actionsStr)
```

###### 参数

- `actionsStr` (String) - 动作字符串

###### 返回值

返回解析后的动作对象。

## 使用示例

### 基本使用

```javascript
import { SFCParser } from './sfc-parser.js';

const sfcSource = `
<template>
  <div class="hello">
    <h1>{{ message }}</h1>
    <button @click="increment">点击次数: {{ count }}</button>
  </div>
</template>

<script>
setup() {
  const message = ref('Hello World');
  const count = ref(0);
  
  const increment = () => {
    count.value++;
  };
  
  return { message, count, increment };
}
</script>

<style>
.hello {
  padding: 20px;
  text-align: center;
}
</style>
`;

const parser = new SFCParser(sfcSource);
const descriptor = parser.parse();

console.log('模板:', descriptor.template);
console.log('脚本:', descriptor.script);
console.log('样式:', descriptor.styles);
console.log('错误:', descriptor.errors);
```

### 解析结果示例

```javascript
{
  template: '<div class="hello">...</div>',
  script: {
    name: '',
    setup: 'const message = ref("Hello World"); const count = ref(0); const increment = () => { count.value++; }; return { message, count, increment };',
    state: {
      message: { type: 'ref', value: '"Hello World"' },
      count: { type: 'ref', value: '0' }
    },
    actions: {
      increment: 'count.value++;'
    }
  },
  styles: ['.hello { padding: 20px; text-align: center; }'],
  errors: [],
  name: ''
}
```

### 处理错误

```javascript
const parser = new SFCParser(invalidSource);
const descriptor = parser.parse();

if (descriptor.errors.length > 0) {
  console.error('解析错误:');
  descriptor.errors.forEach(error => {
    console.error('- ' + error);
  });
}
```

### 使用配置选项

```javascript
const parser = new SFCParser(sfcSource, {
  extractStyles: true,
  scopeStyles: false
});

const descriptor = parser.parse();
```

### 解析复杂脚本

```javascript
const complexScript = `
<script>
setup() {
  const title = ref('My App');
  const user = reactive({
    name: 'John',
    age: 30
  });
  
  const items = ref([1, 2, 3]);
  
  const addItem = () => {
    items.value.push(items.value.length + 1);
  };
  
  const removeItem = (index) => {
    items.value.splice(index, 1);
  };
  
  return { 
    title, 
    user, 
    items,
    addItem,
    removeItem 
  };
}
</script>
`;

const parser = new SFCParser(complexScript);
const descriptor = parser.parse();

console.log('状态:', descriptor.script.state);
console.log('方法:', descriptor.script.actions);
```

### 解析多个样式块

```javascript
const multiStyleSource = `
<template>
  <div class="container">...</div>
</template>

<style>
.container {
  padding: 20px;
}
</style>

<style scoped>
.button {
  background: blue;
}
</style>
`;

const parser = new SFCParser(multiStyleSource);
const descriptor = parser.parse();

console.log('样式数量:', descriptor.styles.length);
descriptor.styles.forEach((style, index) => {
  console.log(`样式 ${index + 1}:`, style);
});
```

## 解析规则详解

### 模板解析

- 提取 `<template>` 标签内的所有内容
- 支持嵌套的 HTML 结构
- 保留所有属性和指令
- 不进行语法转换，仅提取内容

### 脚本解析

#### setup 函数解析

```javascript
setup() {
  // setup 函数体
}
```

#### ref 定义解析

```javascript
const variableName = ref(initialValue);
```

解析为：
```javascript
{
  variableName: {
    type: 'ref',
    value: 'initialValue'
  }
}
```

#### reactive 定义解析

```javascript
const objectName = reactive({
  key1: value1,
  key2: value2
});
```

解析为：
```javascript
{
  objectName: {
    type: 'reactive',
    value: { key1: value1, key2: value2 }
  }
}
```

#### 方法定义解析

```javascript
const methodName = () => {
  // 方法体
};
```

解析为：
```javascript
{
  methodName: '方法体内容'
}
```

#### 返回值解析

```javascript
return {
  prop1,
  prop2: alias2,
  method1
};
```

解析时会处理重命名和导出项。

### 样式解析

- 提取所有 `<style>` 标签的内容
- 支持多个样式块
- 保留所有 CSS 规则
- 不进行作用域转换（由 StyleProcessor 处理）

## 最佳实践

1. **验证解析结果**：始终检查 `errors` 数组，确保解析成功。

2. **使用标准格式**：遵循 SFC 文件的标准格式，确保标签正确闭合。

3. **命名规范**：使用清晰的变量和方法命名，便于解析和维护。

4. **错误处理**：为解析过程添加适当的错误处理和日志记录。

5. **类型检查**：在解析后对提取的内容进行类型检查，确保数据正确。

6. **缓存解析结果**：对于频繁使用的组件，缓存解析结果以提高性能。

7. **组合使用**：与 `SFCBuilder`、`TemplateCompiler` 等组件配合使用，构建完整的 SFC 处理流程。

## 注意事项

- 解析器使用正则表达式进行简单的模式匹配，不支持复杂的 JavaScript 语法。
- setup 函数必须使用标准格式，不支持箭头函数或函数表达式。
- ref 和 reactive 的值会被提取为字符串，不会进行求值。
- 方法体会被提取为字符串，不会进行语法分析。
- 返回值中的重命名功能是基础实现，可能不支持所有场景。
- 样式解析不处理 `scoped` 属性，作用域化由 `StyleProcessor` 处理。
- 解析器的验证功能是基础实现，不能替代完整的语法检查。
- 对于复杂的 SFC 文件，建议使用更强大的解析器（如 Vue 的编译器）。
