# SFC 组件管理系统指南

XRender 的单文件组件（SFC）系统允许开发者将组件的模板、脚本和样式封装在单一文件中，使用 `.xrt` 文件扩展名。这种组织方式提高了代码的可维护性和可读性。

## 目录

- [概述](#概述)
- [初始化 SFC 功能](#初始化-sfc-功能)
- [SFC 文件结构](#sfc-文件结构)
- [基本用法](#基本用法)
- [高级特性](#高级特性)
- [生命周期钩子](#生命周期钩子)
- [类型检查](#类型检查)
- [性能优化](#性能优化)
- [最佳实践](#最佳实践)

## 概述

SFC（Single File Component）是 XRender 的核心特性之一，它允许开发者在一个文件中编写组件的所有部分：

- **Template**: 组件的 HTML 模板
- **Script**: 组件的逻辑代码
- **Style**: 组件的样式

### 主要特性

- **模块化**: 所有组件代码集中在一个文件中
- **作用域样式**: 支持样式作用域，避免样式冲突
- **类型检查**: 集成 TypeScript 类型检查
- **生命周期管理**: 增强的生命周期钩子系统
- **性能监控**: 内置性能监控和优化
- **错误边界**: 错误捕获和恢复机制

## 初始化 SFC 功能

在使用 SFC 组件之前，需要先初始化 SFC 功能：

```javascript
import XRender from 'xrender/core/latest/xrender.es.js';
import { initSFC } from 'xrender/sfc/latest/xrender-sfc.es.js';

// 初始化 SFC 功能
initSFC(XRender);
```

初始化后，XRender 将获得以下全局方法：

- `XRender.sfc.parse()` - 解析 SFC 源码
- `XRender.sfc.compile()` - 编译 SFC 源码
- `XRender.sfc.register()` - 注册 SFC 组件
- `XRender.sfc.loadFromFile()` - 从文件加载 SFC 组件
- `XRender.loadXRT()` - 加载 .xrt 文件的快捷方法
- `XRender.registerXRT()` - 注册 .xrt 组件的快捷方法

## SFC 文件结构

一个完整的 `.xrt` 文件包含三个主要部分：

```html
<template>
  <!-- 模板部分 -->
</template>

<script>
  // 脚本部分
  export default {
    // 组件配置
  };
</script>

<style>
  /* 样式部分 */
</style>
```

### Template 部分

模板部分定义组件的 HTML 结构，支持：

- 插值表达式: `{{ message }}`
- 指令: `v-if`, `v-for`, `v-show`, `v-bind`, `v-on`
- 事件绑定: `@click`, `@input`
- 属性绑定: `:class`, `:style`
- 插槽: `<slot>`

```html
<template>
  <div class="counter-container">
    <h1>{{ title }}</h1>
    <div class="counter-display">
      <span>{{ count }}</span>
    </div>
    <button @click="increment">增加</button>
  </div>
</template>
```

### Script 部分

脚本部分定义组件的逻辑，支持组合式 API：

```html
<script>
export default {
  name: 'Counter',
  
  setup() {
    // 使用 ref 创建响应式状态
    const count = ref(0);
    const title = ref('计数器');
    
    // 方法
    const increment = () => {
      count.value++;
    };
    
    // 计算属性
    const doubleCount = computed(() => count.value * 2);
    
    // 返回状态和方法
    return {
      count,
      title,
      increment,
      doubleCount
    };
  }
};
</script>
```

### Style 部分

样式部分定义组件的样式，支持普通样式和作用域样式：

```html
<style>
  /* 全局样式 */
  .counter-container {
    padding: 20px;
  }
</style>

<style scoped>
  /* 作用域样式 - 只在当前组件生效 */
  .counter-display {
    background: white;
    padding: 10px;
  }
</style>
```

## 基本用法

### 从字符串注册组件

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

### 从文件加载组件

```javascript
import { loadXRTFromFile } from 'xrender/sfc/latest/xrender-sfc.es.js';

// 从文件加载组件
const component = await loadXRTFromFile('./components/MyComponent.xrt');
```

### 在应用中使用组件

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

## 高级特性

### 生命周期钩子

SFC 组件支持增强的生命周期钩子系统：

```html
<script>
export default {
  setup() {
    const count = ref(0);
    
    onMounted(() => {
      console.log('组件已挂载');
    });
    
    onUpdated(() => {
      console.log('组件已更新');
    });
    
    onBeforeUnmount(() => {
      console.log('组件即将卸载');
    });
    
    return { count };
  }
};
</script>
```

### 类型检查

SFC 组件支持 TypeScript 类型检查：

```html
<script>
export default {
  name: 'TypedComponent',
  
  types: {
    props: {
      value: 'number',
      label: 'string'
    },
    data: {
      count: 'number',
      message: 'string'
    },
    methods: {
      increment: 'function',
      decrement: 'function'
    }
  },
  
  setup() {
    const count = ref(0);
    const message = ref('Hello');
    
    const increment = () => {
      count.value++;
    };
    
    const decrement = () => {
      count.value--;
    };
    
    return {
      count,
      message,
      increment,
      decrement
    };
  }
};
</script>
```

### 组件缓存

使用组件缓存管理器提高性能：

```javascript
import { ComponentCacheManager } from 'xrender/sfc/latest/xrender-sfc.es.js';

const cacheManager = new ComponentCacheManager({
  maxSize: 50,
  ttl: 300000 // 5分钟
});

// 缓存组件
cacheManager.cache('MyComponent', componentConfig);

// 获取缓存的组件
const cachedComponent = cacheManager.get('MyComponent');
```

### 异步组件

支持异步加载组件：

```javascript
import { createAsyncComponent } from 'xrender/sfc/latest/xrender-sfc.es.js';

const AsyncComponent = createAsyncComponent({
  loader: () => import('./components/HeavyComponent.xrt'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorMessage,
  delay: 200,
  timeout: 30000
});
```

### 高级插槽

支持动态和条件化插槽：

```html
<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">默认标题</slot>
    </div>
    <div class="card-body">
      <slot>默认内容</slot>
    </div>
    <div class="card-footer">
      <slot name="footer" v-if="showFooter">默认页脚</slot>
    </div>
  </div>
</template>

<script>
export default {
  setup() {
    const showFooter = ref(true);
    return { showFooter };
  }
};
</script>
```

### 错误边界

使用错误边界捕获和处理错误：

```html
<script>
export default {
  setup() {
    const error = ref(null);
    const errorInfo = ref(null);
    
    const handleError = (err, info) => {
      error.value = err;
      errorInfo.value = info;
      console.error('组件错误:', err, info);
    };
    
    return {
      error,
      errorInfo,
      handleError
    };
  }
};
</script>

<template>
  <div>
    <div v-if="error" class="error-boundary">
      <h2>出错了</h2>
      <p>{{ error.message }}</p>
      <button @click="error = null">重试</button>
    </div>
    <div v-else>
      <slot></slot>
    </div>
  </div>
</template>
```

### 性能监控

内置性能监控功能：

```html
<script>
export default {
  setup() {
    const performanceData = ref({});
    
    onMounted(() => {
      // 获取性能数据
      const perf = window.__XRenderPerformance__;
      if (perf) {
        performanceData.value = perf.getComponentMetrics('MyComponent');
      }
    });
    
    return { performanceData };
  }
};
</script>
```

## 生命周期钩子

SFC 组件支持完整的生命周期钩子：

### 创建阶段

- `beforeCreate`: 实例创建前
- `created`: 实例创建后
- `beforeMount`: 挂载前
- `mounted`: 挂载后

### 更新阶段

- `beforeUpdate`: 更新前
- `updated`: 更新后

### 销毁阶段

- `beforeUnmount`: 卸载前
- `unmounted`: 卸载后

### 错误捕获

- `errorCaptured`: 错误捕获

### 示例

```html
<script>
export default {
  setup() {
    const lifecycleLog = ref([]);
    
    onBeforeCreate(() => {
      lifecycleLog.value.push('beforeCreate');
    });
    
    onCreated(() => {
      lifecycleLog.value.push('created');
    });
    
    onBeforeMount(() => {
      lifecycleLog.value.push('beforeMount');
    });
    
    onMounted(() => {
      lifecycleLog.value.push('mounted');
    });
    
    onBeforeUpdate(() => {
      lifecycleLog.value.push('beforeUpdate');
    });
    
    onUpdated(() => {
      lifecycleLog.value.push('updated');
    });
    
    onBeforeUnmount(() => {
      lifecycleLog.value.push('beforeUnmount');
    });
    
    onUnmounted(() => {
      lifecycleLog.value.push('unmounted');
    });
    
    return { lifecycleLog };
  }
};
</script>
```

## 类型检查

SFC 组件支持 TypeScript 类型检查，可以在运行时验证组件的 props、data 和 methods：

### 定义类型

```html
<script>
export default {
  name: 'TypedComponent',
  
  types: {
    props: {
      value: {
        type: 'number',
        required: true,
        validator: (val) => val >= 0
      },
      label: {
        type: 'string',
        default: 'Default Label'
      }
    },
    data: {
      count: 'number',
      message: 'string',
      items: 'array'
    },
    methods: {
      increment: 'function',
      decrement: 'function',
      reset: 'function'
    }
  }
};
</script>
```

### 类型验证

```javascript
import { TypeScriptTypeManager } from 'xrender/sfc/latest/xrender-sfc.es.js';

const typeManager = new TypeScriptTypeManager();

// 验证组件类型
const validation = typeManager.validateComponent(componentConfig);

if (!validation.valid) {
  console.error('类型验证失败:', validation.errors);
}
```

## 性能优化

### 组件缓存

使用组件缓存减少重复创建：

```javascript
import { ComponentCacheManager } from 'xrender/sfc/latest/xrender-sfc.es.js';

const cacheManager = new ComponentCacheManager({
  maxSize: 100,
  ttl: 600000 // 10分钟
});

// 缓存频繁使用的组件
cacheManager.cache('FrequentlyUsedComponent', componentConfig);
```

### 懒加载

使用异步组件实现懒加载：

```javascript
import { loadAsyncSFCFromFile } from 'xrender/sfc/latest/xrender-sfc.es.js';

const LazyComponent = loadAsyncSFCFromFile('./components/HeavyComponent.xrt', {
  delay: 300,
  timeout: 10000
});
```

### 性能监控

监控组件性能：

```html
<script>
export default {
  setup() {
    const metrics = ref({});
    
    onMounted(() => {
      const perf = window.__XRenderPerformance__;
      if (perf) {
        metrics.value = perf.getComponentMetrics('MyComponent');
        console.log('组件性能指标:', metrics.value);
      }
    });
    
    return { metrics };
  }
};
</script>
```

## 最佳实践

### 1. 组件命名

使用 PascalCase 命名组件：

```html
<script>
export default {
  name: 'UserProfileCard', // 推荐
  // 而不是 'userProfileCard' 或 'user_profile_card'
};
</script>
```

### 2. 样式作用域

始终使用作用域样式避免样式冲突：

```html
<style scoped>
.component-specific {
  /* 只在当前组件生效 */
}
</style>
```

### 3. 类型定义

为组件定义明确的类型：

```html
<script>
export default {
  name: 'TypedComponent',
  
  types: {
    props: {
      // 定义 props 类型
    },
    data: {
      // 定义 data 类型
    },
    methods: {
      // 定义 methods 类型
    }
  }
};
</script>
```

### 4. 错误处理

使用错误边界处理组件错误：

```html
<template>
  <ErrorBoundary>
    <MyComponent />
  </ErrorBoundary>
</template>
```

### 5. 性能优化

- 使用组件缓存减少重复创建
- 使用异步组件实现懒加载
- 避免不必要的重新渲染
- 使用计算属性缓存计算结果

### 6. 代码组织

保持代码清晰和模块化：

```html
<template>
  <!-- 清晰的模板结构 -->
</template>

<script>
export default {
  name: 'MyComponent',
  
  setup() {
    // 1. 响应式状态
    const state = reactive({ ... });
    
    // 2. 计算属性
    const computedValue = computed(() => { ... });
    
    // 3. 方法
    const methods = {
      method1() { ... },
      method2() { ... }
    };
    
    // 4. 生命周期
    onMounted(() => { ... });
    
    // 5. 返回
    return {
      ...state,
      ...methods
    };
  }
};
</script>

<style scoped>
/* 作用域样式 */
</style>
```

## 相关文档

- [SFC API 参考](../api/sfc.md)
- [生命周期管理器 API](../api/lifecycle-manager.md)
- [类型检查 API](../api/typescript-type-manager.md)
- [组件缓存 API](../api/component-cache.md)
- [架构设计 - SFC 架构](../architecture/sfc-architecture.md)
