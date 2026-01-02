# TemplateCompiler API 文档

## 概述

`TemplateCompiler` 是 XRender SFC 系统中的模板编译器，负责将 SFC 组件中的模板部分转换为 XRender 的渲染函数。它支持丰富的指令系统、插槽机制和作用域样式。

## 类定义

```javascript
export class TemplateCompiler {
  constructor(descriptor, options = {})
}
```

## 构造函数

### `new TemplateCompiler(descriptor, options)`

创建一个新的模板编译器实例。

**参数:**

- `descriptor` (Object): SFC 描述符对象，包含模板、脚本和样式信息
  - `template` (String|Object): 模板内容或模板对象
- `options` (Object): 编译选项（可选）
  - `scopeId` (String): 作用域 ID，用于样式隔离
  - `directiveTransforms` (Object): 自定义指令转换器

**示例:**

```javascript
const descriptor = {
  template: '<div class="container">{{ message }}</div>'
};

const compiler = new TemplateCompiler(descriptor, {
  scopeId: 'my-component-scope'
});
```

## 实例方法

### `compile()`

编译模板并生成渲染函数。

**返回值:** (Object) 编译结果对象
- `render` (Function): 渲染函数，接受 `createElem`, `state`, `actions` 参数
- `slots` (Object): 插槽映射表

**示例:**

```javascript
const result = compiler.compile();
const { render, slots } = result;

// 使用渲染函数
const element = render(createElem, { message: 'Hello' }, {});
```

## 支持的指令

### `v-text`

设置元素的文本内容。

```html
<span v-text="message"></span>
```

### `v-html`

设置元素的 HTML 内容。

```html
<div v-html="htmlContent"></div>
```

### `v-show`

根据条件控制元素的显示/隐藏（通过 CSS `display` 属性）。

```html
<div v-show="isVisible">Visible content</div>
```

### `v-if`

条件渲染元素。

```html
<div v-if="condition">Conditional content</div>
<div v-else-if="otherCondition">Other content</div>
<div v-else>Default content</div>
```

### `v-for`

列表渲染，支持 `item in items` 格式。

```html
<ul>
  <li v-for="item in items" :key="item.id">{{ item.name }}</li>
</ul>
```

### `v-bind`

动态绑定属性，简写为 `:`。

```html
<img :src="imageUrl" :alt="imageAlt">
<div :class="{ active: isActive }"></div>
```

### `v-model`

双向数据绑定，支持 input、textarea、select 等元素。

```html
<input v-model="username" type="text">
<textarea v-model="description"></textarea>
<select v-model="selectedOption">
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

### `v-slot`

插槽定义和使用。

```html
<!-- 定义插槽 -->
<slot name="header">Default header</slot>

<!-- 使用插槽 -->
<MyComponent>
  <template v-slot:header>
    <h1>Custom Header</h1>
  </template>
</MyComponent>
```

### `v-component`

动态组件渲染。

```html
<component :is="currentComponent"></component>
```

### `v-suspense`

异步组件加载时的回退内容。

```html
<suspense fallback="Loading...">
  <AsyncComponent />
</suspense>
```

### `v-transition`

过渡动画支持。

```html
<transition name="fade" mode="out-in">
  <div v-if="show">Animated content</div>
</transition>
```

### `v-transition-group`

列表过渡动画。

```html
<transition-group name="list" tag="ul">
  <li v-for="item in items" :key="item.id">{{ item.name }}</li>
</transition-group>
```

## 事件处理

支持 `@` 简写语法绑定事件。

```html
<button @click="handleClick">Click me</button>
<input @input="handleInput" @keyup.enter="handleEnter">
```

## 插槽系统

### 默认插槽

```html
<!-- 子组件 -->
<div class="card">
  <slot>默认内容</slot>
</div>

<!-- 父组件 -->
<MyComponent>
  自定义内容
</MyComponent>
```

### 命名插槽

```html
<!-- 子组件 -->
<div class="modal">
  <slot name="header">默认标题</slot>
  <div class="body">
    <slot name="body">默认内容</slot>
  </div>
  <slot name="footer">默认底部</slot>
</div>

<!-- 父组件 -->
<MyComponent>
  <template v-slot:header>
    <h1>自定义标题</h1>
  </template>
  <template v-slot:body>
    <p>自定义内容</p>
  </template>
  <template v-slot:footer>
    <button>确定</button>
  </template>
</MyComponent>
```

## 作用域样式

模板编译器自动为所有元素添加作用域类名，实现样式隔离。

```javascript
const compiler = new TemplateCompiler(descriptor, {
  scopeId: 'my-component-scope'
});

// 编译后的元素会自动添加 scopeId 作为类名
// <div class="container my-component-scope">...</div>
```

## 表达式编译

### 插值表达式

```html
<div>{{ message }}</div>
<div>{{ user.name }}</div>
<div>{{ items[0].name }}</div>
```

### 表达式修饰符

支持多种修饰符用于处理表达式：

- `.trim`: 去除首尾空格
- `.number`: 转换为数字
- `.debounce`: 防抖处理
- `.lazy`: 延迟更新
- `.capitalize`: 首字母大写
- `.uppercase`: 转换为大写
- `.lowercase`: 转换为小写

```html
<input v-model.trim="username">
<input v-model.number="age" type="number">
<input v-model.lazy="description">
```

## 自定义指令

可以通过 `directiveTransforms` 选项自定义指令转换器。

```javascript
const compiler = new TemplateCompiler(descriptor, {
  directiveTransforms: {
    'my-directive': (node, dir, context) => {
      // 自定义指令转换逻辑
      return `customTransform(${node}, ${dir.value})`;
    }
  }
});
```

## 多根元素处理

自动处理多个根元素的情况，用一个 `div` 包装。

```html
<!-- 输入 -->
<p>Paragraph 1</p>
<p>Paragraph 2</p>

<!-- 自动包装为 -->
<div>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</div>
```

## 完整示例

```javascript
import { TemplateCompiler } from './template-compiler.js';

const descriptor = {
  template: `
    <div class="todo-app">
      <h1>{{ title }}</h1>
      <input v-model="newTodo" @keyup.enter="addTodo" placeholder="Add new todo">
      <ul>
        <li v-for="todo in todos" :key="todo.id">
          <input type="checkbox" v-model="todo.completed">
          <span :class="{ completed: todo.completed }">{{ todo.text }}</span>
          <button @click="removeTodo(todo.id)">Remove</button>
        </li>
      </ul>
      <slot name="footer">
        <p>Total: {{ todos.length }}</p>
      </slot>
    </div>
  `
};

const compiler = new TemplateCompiler(descriptor, {
  scopeId: 'todo-app-scope'
});

const { render, slots } = compiler.compile();

// 使用渲染函数
const state = {
  title: 'My Todo App',
  newTodo: '',
  todos: [
    { id: 1, text: 'Learn XRender', completed: false },
    { id: 2, text: 'Build awesome apps', completed: false }
  ]
};

const actions = {
  addTodo: () => {
    if (state.newTodo.trim()) {
      state.todos.push({
        id: Date.now(),
        text: state.newTodo,
        completed: false
      });
      state.newTodo = '';
    }
  },
  removeTodo: (id) => {
    state.todos = state.todos.filter(todo => todo.id !== id);
  }
};

const element = render(createElem, state, actions);
```

## 注意事项

1. **指令优先级**: 某些指令（如 `v-if` 和 `v-for`）不能同时使用在同一个元素上
2. **插槽作用域**: 插槽内容可以访问父组件的作用域
3. **性能考虑**: 复杂的表达式和大量的条件渲染可能影响性能
4. **样式隔离**: 作用域样式通过添加类名实现，不是真正的 CSS 作用域
5. **事件处理**: 事件处理函数会自动绑定到 `actions` 对象中

## 错误处理

模板编译器会在遇到不支持的指令或格式错误时输出警告信息：

```javascript
// 不支持的指令
console.warn('未支持的指令: v-unknown');

// v-for 格式错误
console.warn('v-for 指令格式不正确:', value);
```

## 相关文档

- [SFC 组件管理指南](../guides/sfc-guide.md)
- [StyleProcessor API](./style-processor.md)
- [SFCParser API](./sfc-parser.md)
- [SFCBuilder API](./sfc-builder.md)
