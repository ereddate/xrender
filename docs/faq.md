# 常见问题解答 (FAQ)

本文档回答了关于 XRender SFC 的常见问题。

## 目录

- [基础问题](#基础问题)
- [组件开发](#组件开发)
- [生命周期](#生命周期)
- [类型检查](#类型检查)
- [性能优化](#性能优化)
- [错误处理](#错误处理)
- [样式处理](#样式处理)
- [插槽管理](#插槽管理)
- [异步组件](#异步组件)
- [测试](#测试)

## 基础问题

### Q1: XRender SFC 是什么？

XRender SFC 是一个单文件组件系统，允许开发者将模板、脚本和样式封装在一个 `.xrt` 文件中。它提供了完整的组件生命周期管理、类型检查、缓存机制等功能。

### Q2: 如何开始使用 XRender SFC？

首先需要初始化 SFC 功能：

```javascript
import { XRender } from 'xrender';
import { initSFC } from 'xrender/sfc/entry';

// 初始化 SFC 功能
initSFC(XRender);

// 现在可以使用 XRender.sfc 方法
const component = XRender.loadXRT('./MyComponent.xrt');
```

### Q3: .xrt 文件的结构是什么？

一个标准的 `.xrt` 文件包含三个部分：

```html
<template>
  <div>{{ message }}</div>
</template>

<script>
export default {
  data() {
    return { message: 'Hello World' };
  }
};
</script>

<style>
div {
  color: red;
}
</style>
```

### Q4: XRender SFC 支持哪些浏览器？

XRender SFC 支持所有现代浏览器（Chrome、Firefox、Safari、Edge）的最新版本。对于 IE11，需要额外的 polyfill。

## 组件开发

### Q5: 如何创建一个简单的组件？

```javascript
// MyComponent.xrt
<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: 'Hello',
      description: 'This is my component'
    };
  }
};
</script>

<style>
.my-component {
  padding: 20px;
}
</style>
```

### Q6: 如何在组件中使用 props？

```javascript
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    }
  }
};
</script>
```

### Q7: 如何在组件中定义方法？

```javascript
<script>
export default {
  data() {
    return {
      counter: 0
    };
  },
  methods: {
    increment() {
      this.counter++;
    },
    decrement() {
      this.counter--;
    }
  }
};
</script>
```

### Q8: 如何使用计算属性？

```javascript
<script>
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
</script>
```

### Q9: 如何监听数据变化？

```javascript
<script>
export default {
  data() {
    return {
      message: 'Hello'
    };
  },
  watch: {
    message(newVal, oldVal) {
      console.log(`Message changed from ${oldVal} to ${newVal}`);
    }
  }
};
</script>
```

## 生命周期

### Q10: XRender SFC 支持哪些生命周期钩子？

XRender SFC 支持以下生命周期钩子：

- `created`: 组件实例创建完成后调用
- `mounted`: 组件挂载到 DOM 后调用
- `updated`: 组件更新后调用
- `destroyed`: 组件销毁后调用

### Q11: 如何使用生命周期钩子？

```javascript
<script>
export default {
  created() {
    console.log('Component created');
    this.fetchData();
  },
  mounted() {
    console.log('Component mounted');
    this.initEventListeners();
  },
  destroyed() {
    console.log('Component destroyed');
    this.cleanupEventListeners();
  },
  methods: {
    fetchData() {
      // 获取数据
    },
    initEventListeners() {
      // 初始化事件监听
    },
    cleanupEventListeners() {
      // 清理事件监听
    }
  }
};
</script>
```

### Q12: 生命周期钩子的执行顺序是什么？

1. `created` - 组件实例创建
2. `mounted` - 组件挂载到 DOM
3. `updated` - 组件更新（每次数据变化）
4. `destroyed` - 组件销毁

### Q13: 如何在生命周期钩子中执行异步操作？

```javascript
<script>
export default {
  async created() {
    try {
      const data = await this.fetchData();
      this.items = data;
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  },
  methods: {
    async fetchData() {
      const response = await fetch('/api/items');
      return response.json();
    }
  }
};
</script>
```

## 类型检查

### Q14: 如何启用类型检查？

类型检查默认启用。你可以在组件定义中指定类型：

```javascript
<script>
export default {
  types: {
    data: {
      message: 'string',
      count: 'number'
    },
    methods: {
      handleClick: 'function',
      handleSubmit: 'function'
    }
  },
  data() {
    return {
      message: 'Hello',
      count: 0
    };
  },
  methods: {
    handleClick() {
      console.log('Clicked');
    },
    handleSubmit() {
      console.log('Submitted');
    }
  }
};
</script>
```

### Q15: 类型检查支持哪些类型？

支持以下基本类型：
- `string`: 字符串
- `number`: 数字
- `boolean`: 布尔值
- `function`: 函数
- `object`: 对象
- `array`: 数组

### Q16: 如何禁用类型检查？

```javascript
import { TypeScriptTypeManager } from 'xrender/sfc';

const typeManager = new TypeScriptTypeManager({
  enabled: false
});
```

### Q17: 类型检查失败会发生什么？

类型检查失败时，会在控制台输出警告信息，但不会阻止组件渲染。这是为了提供更好的开发体验。

## 性能优化

### Q18: 如何启用组件缓存？

```javascript
import { ComponentCacheManager } from 'xrender/sfc';

const cacheManager = new ComponentCacheManager({
  maxSize: 100,
  ttl: 3600000 // 1小时
});
```

### Q19: 如何监控组件性能？

```javascript
import { ComponentPerformanceMonitor } from 'xrender/sfc';

const monitor = new ComponentPerformanceMonitor({
  enabled: true,
  sampleRate: 1.0,
  threshold: 16 // 16ms
});

monitor.on('slow-render', (data) => {
  console.warn('Slow render detected:', data);
});
```

### Q20: 如何优化组件渲染性能？

1. **使用计算属性缓存计算结果**
2. **合理使用 v-if 和 v-show**
3. **避免在模板中使用复杂表达式**
4. **使用 key 属性优化列表渲染**
5. **启用组件缓存**

### Q21: 如何分析性能瓶颈？

使用性能监控 API：

```javascript
const report = monitor.getPerformanceReport();
console.log('Average render time:', report.averageRenderTime);
console.log('Slowest component:', report.slowestComponent);
```

## 错误处理

### Q22: 如何使用错误边界？

```javascript
import { ErrorBoundaryManager } from 'xrender/sfc';

const errorBoundary = new ErrorBoundaryManager({
  fallbackComponent: ErrorFallback,
  onError: (error, component) => {
    console.error('Component error:', error);
    // 上报错误到服务器
  }
});

// 错误回退组件
function ErrorFallback({ error }) {
  return `
    <div class="error-fallback">
      <h2>Something went wrong</h2>
      <p>${error.message}</p>
      <button onclick="window.location.reload()">Retry</button>
    </div>
  `;
}
```

### Q23: 如何捕获异步错误？

```javascript
<script>
export default {
  async created() {
    try {
      await this.fetchData();
    } catch (error) {
      this.handleError(error);
    }
  },
  methods: {
    async fetchData() {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return response.json();
    },
    handleError(error) {
      console.error('Error:', error);
      // 显示错误信息给用户
      this.errorMessage = error.message;
    }
  }
};
</script>
```

### Q24: 如何调试组件错误？

1. **使用浏览器开发者工具**
2. **检查控制台错误信息**
3. **使用 console.log 调试**
4. **启用性能监控查看渲染时间**
5. **使用错误边界捕获错误**

## 样式处理

### Q25: 如何使用 scoped 样式？

```html
<style scoped>
.my-component {
  padding: 20px;
}
</style>
```

### Q26: 如何使用 CSS 模块？

```javascript
import { AdvancedStyleProcessor } from 'xrender/sfc';

const styleProcessor = new AdvancedStyleProcessor({
  cssModules: true
});
```

### Q27: 如何动态加载样式？

```javascript
<script>
export default {
  data() {
    return {
      theme: 'light'
    };
  },
  computed: {
    themeClass() {
      return `theme-${this.theme}`;
    }
  }
};
</script>

<template>
  <div :class="themeClass">
    Content
  </div>
</template>

<style>
.theme-light {
  background: white;
  color: black;
}

.theme-dark {
  background: black;
  color: white;
}
</style>
```

### Q28: 如何处理样式冲突？

1. **使用 scoped 样式**
2. **使用 CSS 模块**
3. **使用特定的类名前缀**
4. **使用 BEM 命名规范**

## 插槽管理

### Q29: 如何使用默认插槽？

```html
<!-- ParentComponent.xrt -->
<template>
  <div>
    <slot></slot>
  </div>
</template>

<!-- 使用 -->
<ParentComponent>
  <p>This is slot content</p>
</ParentComponent>
```

### Q30: 如何使用具名插槽？

```html
<!-- ParentComponent.xrt -->
<template>
  <div>
    <header>
      <slot name="header"></slot>
    </header>
    <main>
      <slot></slot>
    </main>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<!-- 使用 -->
<ParentComponent>
  <template slot="header">
    <h1>Header</h1>
  </template>
  <p>Main content</p>
  <template slot="footer">
    <p>Footer</p>
  </template>
</ParentComponent>
```

### Q31: 如何使用作用域插槽？

```html
<!-- ParentComponent.xrt -->
<template>
  <div>
    <slot :item="item" :index="index"></slot>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
    };
  }
};
</script>

<!-- 使用 -->
<ParentComponent>
  <template slot-scope="{ item, index }">
    <div>{{ index }}: {{ item.name }}</div>
  </template>
</ParentComponent>
```

### Q32: 如何动态切换插槽内容？

```javascript
import { AdvancedSlotManager } from 'xrender/sfc';

const slotManager = new AdvancedSlotManager();

// 动态注册插槽
slotManager.registerSlot('dynamic-slot', (props) => {
  return `<div>${props.content}</div>`;
});

// 动态切换插槽
slotManager.switchSlot('dynamic-slot', 'alternative-slot');
```

## 异步组件

### Q33: 如何定义异步组件？

```javascript
import { AsyncComponentManager } from 'xrender/sfc';

const asyncManager = new AsyncComponentManager({
  retryTimes: 3,
  retryDelay: 1000
});

const AsyncComponent = asyncManager.defineAsyncComponent({
  loader: () => import('./MyComponent.xrt'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
});
```

### Q34: 如何处理异步组件加载失败？

```javascript
const AsyncComponent = asyncManager.defineAsyncComponent({
  loader: () => import('./MyComponent.xrt'),
  errorComponent: ErrorComponent,
  onError: (error, retry) => {
    console.error('Failed to load component:', error);
    // 可以选择重试
    if (error.retryCount < 3) {
      retry();
    }
  }
});
```

### Q35: 如何预加载异步组件？

```javascript
// 在应用启动时预加载
asyncManager.preloadComponent('./MyComponent.xrt');

// 或者在路由切换前预加载
router.beforeEach((to, from, next) => {
  const componentPath = to.meta.component;
  asyncManager.preloadComponent(componentPath);
  next();
});
```

## 测试

### Q36: 如何测试 SFC 组件？

```javascript
import { SFCParser, TemplateCompiler, StyleProcessor, SFCBuilder } from 'xrender/sfc';

describe('MyComponent', () => {
  let component;

  beforeEach(() => {
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
    `;

    const parser = new SFCParser(sfcSource);
    const descriptor = parser.parse();

    const builder = new SFCBuilder(descriptor);
    component = builder.build();
  });

  it('should render message', () => {
    expect(component.data().message).toBe('Hello');
  });
});
```

### Q37: 如何测试生命周期钩子？

```javascript
describe('Lifecycle Hooks', () => {
  it('should call created hook', () => {
    const createdSpy = jest.fn();
    
    const component = {
      created: createdSpy,
      data() {
        return { message: 'Hello' };
      }
    };

    const manager = new EnhancedLifecycleManager(component);
    manager.executeHook('created');

    expect(createdSpy).toHaveBeenCalled();
  });
});
```

### Q38: 如何测试类型检查？

```javascript
describe('Type Checking', () => {
  it('should validate data types', () => {
    const typeManager = new TypeScriptTypeManager();
    
    const result = typeManager.validateDataTypes(
      { message: 'Hello', count: 10 },
      { message: 'string', count: 'number' }
    );

    expect(result.valid).toBe(true);
  });

  it('should reject invalid types', () => {
    const typeManager = new TypeScriptTypeManager();
    
    const result = typeManager.validateDataTypes(
      { message: 123 },
      { message: 'string' }
    );

    expect(result.valid).toBe(false);
  });
});
```

### Q39: 如何测试异步组件？

```javascript
describe('Async Component', () => {
  it('should load component asynchronously', async () => {
    const asyncManager = new AsyncComponentManager();
    
    const AsyncComponent = asyncManager.defineAsyncComponent({
      loader: () => Promise.resolve({ template: '<div>Async</div>' })
    });

    const component = await AsyncComponent.load();
    expect(component).toBeDefined();
  });
});
```

### Q40: 如何测试错误边界？

```javascript
describe('Error Boundary', () => {
  it('should catch component errors', () => {
    const errorBoundary = new ErrorBoundaryManager({
      fallbackComponent: ErrorFallback
    });

    const error = new Error('Test error');
    const component = { name: 'TestComponent' };

    const result = errorBoundary.captureError(error, component);
    
    expect(result).toBe(true);
  });
});
```

## 其他问题

### Q41: 如何升级 XRender SFC？

查看 [CHANGELOG](../CHANGELOG.md) 了解版本变更，然后运行：

```bash
npm update xrender
```

### Q42: 如何报告 bug？

在 GitHub 上创建 issue，包含：
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（浏览器、XRender 版本等）

### Q43: 如何贡献代码？

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

### Q44: 在哪里可以获得帮助？

- 查看 [文档](../README.md)
- 查看 [API 参考](./api/)
- 查看 [指南](./guides/)
- 在 GitHub 上创建 issue

### Q45: XRender SFC 是否支持 TypeScript？

是的，XRender SFC 支持 TypeScript。你可以使用 TypeScript 编写组件定义：

```typescript
interface MyComponentData {
  message: string;
  count: number;
}

export default {
  data(): MyComponentData {
    return {
      message: 'Hello',
      count: 0
    };
  }
};
```

## 获取更多帮助

如果你有其他问题，请：

1. 查看完整文档
2. 搜索 GitHub Issues
3. 在社区论坛提问
4. 联系技术支持

---

**最后更新**: 2026-01-02
