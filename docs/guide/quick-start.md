---
title: 快速开始
description: 5分钟快速上手 XRender
---

# 快速开始

本指南将帮助你在 5 分钟内快速上手 XRender。

## 安装

使用 npm 安装：

```bash
npm install xrender
```

或使用 yarn：

```bash
yarn add xrender
```

## 创建第一个应用

### 1. HTML 文件

创建一个 `index.html` 文件：

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
  <script type="module">
    import 'xrender';
    
    const App = $.component('App', {
      data() {
        return {
          message: 'Hello, XRender!'
        };
      },
      render(createElem) {
        return createElem('div', { class: 'app' }, this.data.message);
      }
    });
    
    $.createApp({ App }).$mount('#app');
  </script>
</body>
</html>
```

### 2. 使用 Vite（推荐）

如果你使用 Vite，可以这样配置：

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      'xrender': 'xrender/core/xrender-1.0.0.es.js'
    }
  }
});
```

然后在你的应用中引入：

```javascript
// main.js
import 'xrender';

const App = $.component('App', {
  data() {
    return {
      count: 0
    };
  },
  methods: {
    increment() {
      this.data.count++;
    }
  },
  render(createElem) {
    return createElem('div', { class: 'counter' }, [
      createElem('h1', {}, `Count: ${this.data.count}`),
      createElem('button', { 
        onclick: () => this.increment() 
      }, 'Increment')
    ]);
  }
});

$.createApp({ App }).$mount('#app');
```

## 响应式数据

XRender 的响应式系统会自动追踪依赖并在数据变化时更新视图：

```javascript
const App = $.component('App', {
  data() {
    return {
      user: {
        name: 'John',
        age: 30
      }
    };
  },
  methods: {
    updateName() {
      this.data.user.name = 'Jane';
    }
  },
  render(createElem) {
    return createElem('div', {}, [
      createElem('p', {}, `Name: ${this.data.user.name}`),
      createElem('p', {}, `Age: ${this.data.user.age}`),
      createElem('button', { 
        onclick: () => this.updateName() 
      }, 'Update Name')
    ]);
  }
});
```

## 使用指令

XRender 提供了丰富的指令：

```javascript
const App = $.component('App', {
  data() {
    return {
      items: ['Apple', 'Banana', 'Orange'],
      isVisible: true
    };
  },
  methods: {
    toggle() {
      this.data.isVisible = !this.data.isVisible;
    }
  },
  render(createElem) {
    return createElem('div', {}, [
      createElem('button', { 
        onclick: () => this.toggle() 
      }, 'Toggle'),
      this.data.isVisible ? createElem('ul', {}, 
        this.data.items.map(item => 
          createElem('li', {}, item)
        )
      ) : null
    ]);
  }
});
```

## 下一步

现在你已经掌握了 XRender 的基础用法，可以继续学习：

- [组件](/guide/components) - 深入了解组件系统
- [响应式系统](/guide/reactivity) - 学习响应式原理
- [指令](/guide/directives) - 掌握所有指令的用法
- [路由](/guide/router) - 构建多页面应用
