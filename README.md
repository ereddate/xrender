# XRender

XRender 是一个轻量级的前端框架，专注于组件化开发和数据驱动视图渲染。它提供了类似 Vue 的语法和功能，支持数据绑定、指令、生命周期钩子等特性。

## 特性
- **组件化开发**：支持创建和复用组件。
- **数据绑定**：支持双向数据绑定和模板插值。
- **指令系统**：提供 `v-if`、`v-for`、`v-show` 等常用指令。
- **生命周期钩子**：支持 `created`、`mounted`、`updated` 等生命周期钩子。
- **插件系统**：支持通过插件扩展功能。
- **模块化架构**：核心框架与功能模块完全解耦，支持按需引入。
- **版本管理**：内置版本管理系统，支持语义化版本控制。
- **独立打包**：每个模块可独立打包，支持版本化文件和目录。
- **SSR 支持**：支持服务器端渲染（SSR）。
- **SSG 支持**：支持静态站点生成（SSG），优化 SEO 性能。
- **路由支持**：支持路由管理和导航。
- **状态管理**：支持状态管理。
- **响应式系统**：支持响应式数据、计算属性和深度监听。
- **Watcher 系统**：支持数据监听和响应式更新，包括深度监听和立即执行。
- **国际化支持**：支持国际化和多语言支持。
- **AJAX 支持**：支持 AJAX 请求和数据获取。
- **MOCK 支持**：支持模拟数据和测试环境。
- **移动端适配**：支持移动端适配和响应式设计。
- **SFC 支持**：支持单文件组件（.xrt）开发，将模板、脚本和样式封装在单一文件中。

## 快速开始

### 安装

```bash
npm install xrender
```

### 基础使用

```javascript
import 'xrender';

const App = $.component('App', {    
  render(createElem) {
    return createElem('div', {class:'page'}, 'Hello, XRender!', createElem(function(){
        return `<button type="button" @click="buttonClickHandle">{{msg}}</button>`
    }));
  },
  data(){
    return{
       msg:'Hello World!'
    }
  },
  methods: {
    buttonClickHandle() {
      console.log("Button Clicked");
    },
  },
});

$.createApp({ App }).$mount('#app');
```

### 模块化引入

XRender 采用模块化架构，核心框架与功能模块完全解耦，支持按需引入：

```javascript
// 只引入核心框架（最轻量）
import XRender from 'xrender/core/xrender-1.0.0.es.js';

// 按需引入功能模块
import { Router } from 'xrender/router/xrender-router-1.0.0.es.js';
import { Store } from 'xrender/store/xrender-store-1.0.0.es.js';
import { I18n } from 'xrender/i18n/xrender-i18n-1.0.0.es.js';
import { Fetch } from 'xrender/fetch/xrender-fetch-1.0.0.es.js';
import 'xrender/touchs/xrender-touchs-1.0.0.es.js';

// 初始化功能模块
const router = new Router(routes);
const store = new Store({ state: {...} });
const i18n = new I18n({ locale: 'zh-CN', messages: {...} });
const fetch = new Fetch();

// 创建应用
XRender.createApp({ router, store, i18n, App }).$mount('#app');
```

### 使用 latest 链接（推荐）

每个模块都会生成 `latest` 目录，指向当前最新版本：

```javascript
// 使用 latest 链接，自动获取最新版本
import XRender from 'xrender/core/latest/xrender.es.js';
import { Router } from 'xrender/router/latest/xrender-router.es.js';
import { Store } from 'xrender/store/latest/xrender-store.es.js';
```

## 单文件组件 (SFC)

XRender 支持单文件组件（SFC）开发，允许将组件的模板、脚本和样式封装在单一文件中，使用 `.xrt` 文件扩展名。

### 初始化 SFC 功能

在使用 SFC 组件之前，需要先初始化 SFC 功能：

```javascript
import { initSFC } from 'xrender/sfc/latest/xrender-sfc.es.js';

// 初始化 SFC 功能
initSFC(XRender);
```

### 基本示例

以下是一个基本的 `.xrt` 文件示例：

```html
<template>
  <div class="counter-container">
    <h1>{{ title }}</h1>
    <div class="counter-display">
      <span>{{ count }}</span>
    </div>
    <div class="counter-controls">
      <button @click="decrement">-</button>
      <button @click="reset">重置</button>
      <button @click="increment">+</button>
    </div>
  </div>
</template>

<script>
  // SFC 脚本部分，使用组合式 API
  
  export default {
    name: 'Counter',
    setup() {
      // 使用 ref 创建响应式状态
      const count = ref(0);
      const title = ref('我的计数器');
      
      // 方法
      const increment = () => {
        count.value++;
      };
      
      const decrement = () => {
        count.value--;
      };
      
      const reset = () => {
        count.value = 0;
      };
      
      // 返回状态和方法
      return {
        count,
        title,
        increment,
        decrement,
        reset
      };
    }
  };
</script>

<style>
  .counter-container {
    max-width: 300px;
    margin: 0 auto;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background-color: #f5f5f5;
  }
  
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 20px;
  }
  
  .counter-display {
    background-color: white;
    border-radius: 4px;
    padding: 20px;
    text-align: center;
    font-size: 2em;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 20px;
  }
  
  .counter-controls {
    display: flex;
    justify-content: space-between;
  }
  
  button {
    padding: 10px 20px;
    font-size: 1em;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  button:hover {
    background-color: #ddd;
  }
</style>
```

### 加载 SFC 组件

有两种方式可以加载 SFC 组件：

#### 1. 从字符串直接注册

```javascript
import { registerSFC } from 'xrender/sfc/latest/xrender-sfc.es.js';

const sfcSource = `
<template>
  <div>{{ message }}</div>
</template>

<script>
  export default {
    setup() {
      const message = ref('Hello, XRender!');
      return { message };
    }
  };
</script>
`;

registerSFC('MyComponent', sfcSource);
```

#### 2. 从 .xrt 文件加载

```javascript
import { loadXRTFromFile } from 'xrender/sfc/latest/xrender-sfc.es.js';

// 从文件加载组件
const component = await loadXRTFromFile('./components/MyComponent.xrt');
```

### 在应用中使用 SFC 组件

注册后的 SFC 组件可以像普通组件一样使用：

```javascript
const App = $.component('App', {
  render(createElem) {
    return createElem('div', {}, [
      createElem('MyComponent')
    ]);
  }
});

$.createApp({ App }).$mount('#app');
```

### 样式作用域

默认情况下，SFC 组件中的样式是作用域化的，样式只会应用到当前组件的元素上：

```html
<style scoped>
  .component-specific-class {
    /* 只会在当前组件中生效 */
  }
</style>
```

### 生命周期钩子

SFC 组件支持所有标准的生命周期钩子：

```html
<script>
  export default {
    setup() {
      // 组件逻辑
      return {};
    },
    
    onMounted() {
      console.log('组件已挂载');
    },
    
    onUpdated() {
      console.log('组件已更新');
    }
  };
</script>
```

## 版本管理

XRender 内置版本管理系统，支持语义化版本控制（Semantic Versioning）。

### 查看版本

```bash
# 查看所有模块版本
npm run version:get

# 查看指定模块版本
npm run version:get xrender
```

### 设置版本

```bash
# 设置指定模块版本
npm run version:set xrender 1.2.0
```

### 升级版本

```bash
# 升级主版本（不兼容的 API 修改）
npm run version:bump xrender major

# 升级次版本（向下兼容的功能新增）
npm run version:bump xrender minor

# 升级修订号（向下兼容的问题修正）
npm run version:bump xrender patch

# 升级所有模块
npm run version:bump-all minor
```

### 构建和发布

```bash
# 构建所有模块
npm run build

# 构建指定模块
npm run build:libs
npm run build:fetch
npm run build:router
npm run build:store
npm run build:i18n
npm run build:touchs

# 更新 latest 链接
npm run post-build:latest

# 清理旧版本
npm run post-build:clean

# 列出所有版本
npm run post-build:list
```

### 版本化目录结构

构建后的文件会按版本号组织：

```
dist/libs/
├── xrender/
│   ├── 1.0.0/
│   │   └── xrender-1.0.0.es.js
│   ├── 1.1.0/
│   │   └── xrender-1.1.0.es.js
│   └── latest/
│       └── xrender-1.1.0.es.js
├── router/
│   ├── 1.0.0/
│   │   ├── xrender-router-1.0.0.es.js
│   │   └── xrender-router-1.0.0.umd.js
│   └── latest/
│       ├── xrender-router-1.0.0.es.js
│       └── xrender-router-1.0.0.umd.js
└── ...
```
## 组件化开发
XRender 支持创建和复用组件。以下是一个简单的组件示例：
```javascript
const MyComponent = $.component('MyComponent', {
  data() {
    return {
      message: 'Hello, XRender!'
    };
  },
  render(createElem) {
    return createElem('div', {}, this.data.message);
  }
});
```
## 数据绑定
XRender 支持双向数据绑定和模板插值。以下是一个数据绑定的示例：
```javascript
const App = $.component('App', {
  data() {
    return {
      username: 'XRender User'
    };
  },
  render(createElem) {
    return createElem('div', {}, `Welcome, {{username}}!`);
  }
});
```

## 响应式系统
XRender 提供了强大的响应式系统，支持数据监听、计算属性和深度监听。

### 计算属性
计算属性基于依赖自动计算并缓存结果，只有在依赖项变化时才会重新计算：
```javascript
const App = $.component('App', {
  data() {
    return {
      firstName: 'John',
      lastName: 'Doe'
    };
  },
  computed: {
    fullName() {
      return `${this.data.firstName} ${this.data.lastName}`;
    }
  },
  render(createElem) {
    return createElem('div', {}, `Full Name: {{fullName}}`);
  }
});
```

### Watcher 监听
Watcher 允许监听数据的变化并执行相应的操作：
```javascript
const App = $.component('App', {
  data() {
    return {
      count: 0
    };
  },
  watch: {
    count(newVal, oldVal) {
      console.log(`Count changed from ${oldVal} to ${newVal}`);
    }
  },
  render(createElem) {
    return createElem('div', {}, `Count: {{count}}`);
  }
});
```

### 深度监听
深度监听可以监听嵌套对象内部的变化：
```javascript
const App = $.component('App', {
  data() {
    return {
      user: {
        name: 'John',
        age: 30,
        address: {
          city: 'New York'
        }
      }
    };
  },
  watch: {
    user: {
      handler(newVal, oldVal) {
        console.log('User changed:', newVal);
      },
      deep: true
    }
  },
  render(createElem) {
    return createElem('div', {}, `Name: {{user.name}}`);
  }
});
```

### 立即执行监听器
使用 `immediate` 选项可以在监听器创建时立即执行：
```javascript
const App = $.component('App', {
  data() {
    return {
      message: 'Hello'
    };
  },
  watch: {
    message: {
      handler(newVal) {
        console.log('Message:', newVal);
      },
      immediate: true
    }
  },
  render(createElem) {
    return createElem('div', {}, `Message: {{message}}`);
  }
});
```
## 指令系统
XRender 提供了 `v-if`、`v-for`、`v-show` 等常用指令。以下是一个指令的示例：
```javascript
const App = $.component('App', {
  data() {
    return {
      showMessage: true
    };
  },
  render(createElem) {
    return createElem('div', {}, [
      createElem('p', { 'v-if': 'showMessage' }, 'This is a message.')
    ]);
  }
});
```
## 生命周期钩子
XRender 支持 `created`、`mounted`、`updated` 等生命周期钩子。以下是一个生命周期钩子的示例：
```javascript
const App = $.component('App', {
  created() {
    console.log('Component created');
  },
  mounted() {
    console.log('Component mounted');
  },
  updated() {
    console.log('Component updated');
  },
  render(createElem) {
    return createElem('div', {}, 'Hello, XRender!');
  }
});
```
## 插件系统
XRender 支持通过插件扩展功能。以下是一个插件的示例：
```javascript
const MyPlugin = {
  install(app) {
    app.directive('myDirective', {
      bind(el, binding) {
        el.textContent = `My Directive: ${binding.value}`;
      }
    });
  }
};
$.use(MyPlugin);
```
## 服务器端渲染（SSR）
XRender 支持服务器端渲染（SSR）。以下是一个 SSR 的示例：
```javascript
const App = $.component('App', {
  render(createElem) {
    return createElem('div', {}, 'Hello, XRender!');
  }
});

const app = $.createApp({ App });
const html = app.$mount().$html();
console.log(html);
```

## 静态站点生成（SSG）
XRender 支持静态站点生成（SSG），可以将应用预渲染为静态 HTML 文件，从而显著提升 SEO 性能和首屏加载速度。

### 快速开始

#### 1. 安装 SSG 模块

```bash
npm install xrender
```

#### 2. 配置 Vite 插件

在 `vite.config.js` 中配置 SSG 插件：

```javascript
import { defineConfig } from "vite";
import { xrenderSSGPlugin } from "xrender/libs/ssg/vite-plugin.js";

export default defineConfig({
  plugins: [
    xrenderSSGPlugin({
      routes: [
        {
          path: '/',
          component: Home,
          meta: {
            title: '首页',
            description: '这是首页描述'
          }
        }
      ]
    })
  ]
});
```

#### 3. 构建静态站点

```bash
npm run build:ssg
```

### 配置选项

```javascript
{
  routes: [],           // 路由配置
  outDir: 'dist',       // 输出目录
  templatePath: 'index.html', // HTML 模板路径
  publicPath: '/',      // 公共路径
  preloadData: true,    // 是否预加载数据
  concurrency: 5,        // 并发数
  minify: true          // 是否压缩 HTML
}
```

### 元数据配置

每个路由可以配置 SEO 元数据：

```javascript
{
  path: '/about',
  component: About,
  meta: {
    title: '关于我们',
    description: '页面描述',
    keywords: '关键词',
    ogTitle: 'OG 标题',
    ogDescription: 'OG 描述',
    twitterCard: 'summary_large_image'
  }
}
```

### 示例项目

查看完整的 SSG 示例项目：

```bash
cd examples/ssg-demo
npm install
npm run build:ssg
npm run preview
```

详细的 SSG 使用指南请参考 [SSG 使用指南](docs/guides/ssg-guide.md)。

## 许可证
XRender 基于 MIT 许可证发布。请查看 [LICENSE](LICENSE) 文件了解更多信息。

## 贡献
欢迎贡献代码和文档改进。请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目。

---

### 文档说明
1. **快速开始**：提供了简单的安装和使用示例，帮助开发者快速上手。
2. **核心概念**：介绍了组件、数据绑定、指令和生命周期钩子等核心概念，并提供了代码示例。
3. **API 文档**：列出了 XRender 的主要 API，方便开发者查阅。
4. **示例项目**：提供了示例项目的链接，展示 XRender 的实际应用。
5. **贡献和许可证**：鼓励开发者贡献代码，并说明项目的开源许可证。

通过这份 `README.md`，开发者可以快速了解 XRender 的功能和使用方法，并参与到项目的开发中。