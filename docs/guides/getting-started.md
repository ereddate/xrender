# 快速开始指南

## 简介

欢迎使用 XRender SFC 系统！本指南将帮助您快速上手，创建您的第一个单文件组件（SFC）。

## 安装

### 通过 npm 安装

```bash
npm install xrender
```

### 通过 CDN 引入

```html
<script src="https://cdn.jsdelivr.net/npm/xrender/dist/xrender.min.js"></script>
```

## 创建第一个 SFC 组件

### 1. 创建 SFC 文件

创建一个名为 `HelloWorld.xrt` 的文件：

```html
<template>
  <div class="hello-world">
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
.hello-world {
  padding: 20px;
  text-align: center;
}

.hello-world h1 {
  color: #333;
}

.hello-world button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.hello-world button:hover {
  background: #0056b3;
}
</style>
```

### 2. 在应用中使用组件

```javascript
import { createApp } from 'xrender';
import HelloWorld from './HelloWorld.xrt';

const app = createApp({
  components: {
    HelloWorld
  },
  template: '<HelloWorld />'
});

app.mount('#app');
```

### 3. 创建 HTML 容器

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My XRender App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./main.js"></script>
</body>
</html>
```

## 基础概念

### 模板（Template）

模板定义了组件的 HTML 结构，支持插值表达式、指令和事件绑定。

```html
<template>
  <div class="container">
    <!-- 插值表达式 -->
    <p>{{ message }}</p>
    
    <!-- 指令 -->
    <div v-if="showContent">可见内容</div>
    <div v-show="isVisible">显示/隐藏</div>
    
    <!-- 事件绑定 -->
    <button @click="handleClick">点击我</button>
    
    <!-- 列表渲染 -->
    <ul>
      <li v-for="item in items" :key="item.id">{{ item.name }}</li>
    </ul>
  </div>
</template>
```

### 脚本（Script）

脚本定义了组件的逻辑，包括数据、方法、生命周期钩子等。

```javascript
<script>
export default {
  // 数据
  data() {
    return {
      message: 'Hello',
      showContent: true,
      isVisible: true,
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
    };
  },
  
  // 方法
  methods: {
    handleClick() {
      console.log('Button clicked!');
    }
  },
  
  // 生命周期钩子
  created() {
    console.log('Component created');
  },
  
  mounted() {
    console.log('Component mounted');
  }
};
</script>
```

### 样式（Style）

样式定义了组件的外观，支持作用域样式。

```html
<style>
.container {
  padding: 20px;
}

.container p {
  color: #333;
}

.container button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.container button:hover {
  background: #0056b3;
}
</style>
```

## 常用指令

### v-text

设置元素的文本内容。

```html
<span v-text="message"></span>
```

### v-html

设置元素的 HTML 内容。

```html
<div v-html="htmlContent"></div>
```

### v-if / v-else-if / v-else

条件渲染。

```html
<div v-if="type === 'A'">A</div>
<div v-else-if="type === 'B'">B</div>
<div v-else>Other</div>
```

### v-show

根据条件控制元素的显示/隐藏。

```html
<div v-show="isVisible">Visible content</div>
```

### v-for

列表渲染。

```html
<ul>
  <li v-for="item in items" :key="item.id">{{ item.name }}</li>
</ul>
```

### v-bind

动态绑定属性，简写为 `:`。

```html
<img :src="imageUrl" :alt="imageAlt">
<div :class="{ active: isActive }"></div>
```

### v-model

双向数据绑定。

```html
<input v-model="username" type="text">
<textarea v-model="description"></textarea>
```

### v-on

事件绑定，简写为 `@`。

```html
<button @click="handleClick">Click me</button>
<input @input="handleInput">
```

## 组件通信

### 父子组件通信

#### 父组件向子组件传递数据

```javascript
// 父组件
<template>
  <ChildComponent :message="parentMessage" />
</template>

<script>
export default {
  data() {
    return {
      parentMessage: 'Hello from parent'
    };
  }
};
</script>
```

```javascript
// 子组件
<template>
  <div>{{ message }}</div>
</template>

<script>
export default {
  props: {
    message: {
      type: String,
      required: true
    }
  }
};
</script>
```

#### 子组件向父组件传递事件

```javascript
// 子组件
<template>
  <button @click="handleClick">Click me</button>
</template>

<script>
export default {
  methods: {
    handleClick() {
      this.$emit('custom-event', 'Data from child');
    }
  }
};
</script>
```

```javascript
// 父组件
<template>
  <ChildComponent @custom-event="handleCustomEvent" />
</template>

<script>
export default {
  methods: {
    handleCustomEvent(data) {
      console.log('Received:', data);
    }
  }
};
</script>
```

### 插槽（Slots）

#### 默认插槽

```javascript
// 父组件
<MyComponent>
  <p>插槽内容</p>
</MyComponent>
```

```javascript
// 子组件
<template>
  <div class="card">
    <slot>默认内容</slot>
  </div>
</template>
```

#### 命名插槽

```javascript
// 父组件
<MyComponent>
  <template v-slot:header>
    <h1>标题</h1>
  </template>
  <template v-slot:body>
    <p>内容</p>
  </template>
</MyComponent>
```

```javascript
// 子组件
<template>
  <div class="modal">
    <slot name="header">默认标题</slot>
    <div class="body">
      <slot name="body">默认内容</slot>
    </div>
  </div>
</template>
```

## 生命周期钩子

```javascript
export default {
  beforeCreate() {
    console.log('beforeCreate: 实例初始化之后');
  },
  created() {
    console.log('created: 实例创建完成');
  },
  beforeMount() {
    console.log('beforeMount: 挂载开始之前');
  },
  mounted() {
    console.log('mounted: 实例挂载完成');
  },
  beforeUpdate() {
    console.log('beforeUpdate: 数据更新之前');
  },
  updated() {
    console.log('updated: 数据更新之后');
  },
  beforeUnmount() {
    console.log('beforeUnmount: 卸载开始之前');
  },
  unmounted() {
    console.log('unmounted: 实例卸载完成');
  }
};
```

## 计算属性和侦听器

### 计算属性

```javascript
export default {
  data() {
    return {
      firstName: 'John',
      lastName: 'Doe'
    };
  },
  computed: {
    fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
};
```

### 侦听器

```javascript
export default {
  data() {
    return {
      message: 'Hello'
    };
  },
  watch: {
    message(newVal, oldVal) {
      console.log(`Message changed from "${oldVal}" to "${newVal}"`);
    }
  }
};
```

## 完整示例：Todo 应用

```html
<!-- TodoApp.xrt -->
<template>
  <div class="todo-app">
    <h1>{{ title }}</h1>
    
    <div class="input-group">
      <input 
        v-model="newTodo" 
        @keyup.enter="addTodo"
        placeholder="添加新的待办事项"
      />
      <button @click="addTodo">添加</button>
    </div>
    
    <ul class="todo-list">
      <li 
        v-for="todo in filteredTodos" 
        :key="todo.id"
        :class="{ completed: todo.completed }"
      >
        <input 
          type="checkbox" 
          v-model="todo.completed"
        />
        <span>{{ todo.text }}</span>
        <button @click="removeTodo(todo.id)">删除</button>
      </li>
    </ul>
    
    <div class="filters">
      <button 
        v-for="filter in filters" 
        :key="filter.value"
        :class="{ active: currentFilter === filter.value }"
        @click="currentFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>
    
    <p class="stats">
      剩余 {{ remainingTodos }} 项，已完成 {{ completedTodos }} 项
    </p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: '我的待办事项',
      newTodo: '',
      todos: [
        { id: 1, text: '学习 XRender', completed: false },
        { id: 2, text: '创建第一个应用', completed: true }
      ],
      currentFilter: 'all',
      filters: [
        { label: '全部', value: 'all' },
        { label: '进行中', value: 'active' },
        { label: '已完成', value: 'completed' }
      ]
    };
  },
  computed: {
    filteredTodos() {
      switch (this.currentFilter) {
        case 'active':
          return this.todos.filter(todo => !todo.completed);
        case 'completed':
          return this.todos.filter(todo => todo.completed);
        default:
          return this.todos;
      }
    },
    remainingTodos() {
      return this.todos.filter(todo => !todo.completed).length;
    },
    completedTodos() {
      return this.todos.filter(todo => todo.completed).length;
    }
  },
  methods: {
    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          id: Date.now(),
          text: this.newTodo.trim(),
          completed: false
        });
        this.newTodo = '';
      }
    },
    removeTodo(id) {
      this.todos = this.todos.filter(todo => todo.id !== id);
    }
  }
};
</script>

<style>
.todo-app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.todo-app h1 {
  text-align: center;
  color: #333;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.input-group input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-group button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.todo-list li.completed span {
  text-decoration: line-through;
  color: #999;
}

.todo-list li span {
  flex: 1;
  margin: 0 10px;
}

.todo-list li button {
  padding: 5px 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.filters {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 20px 0;
}

.filters button {
  padding: 5px 15px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.filters button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.stats {
  text-align: center;
  color: #666;
}
</style>
```

## 下一步

恭喜您完成了快速开始指南！现在您可以：

1. 阅读 [SFC 组件管理指南](./guides/sfc-guide.md) 了解更多高级功能
2. 查看 [API 文档](./api/) 了解详细的 API 参考
3. 阅读 [最佳实践指南](./guides/best-practices.md) 学习开发技巧
4. 查看 [常见问题解答](./guides/faq.md) 解决常见问题

## 获取帮助

如果您遇到问题或有任何疑问，请：

- 查看 [文档](./README.md)
- 提交 [Issue](https://github.com/your-repo/xrender/issues)
- 加入社区讨论

祝您使用愉快！
