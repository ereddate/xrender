# 生命周期管理器 API

`EnhancedLifecycleManager` 是一个增强的生命周期钩子系统，支持中间件、条件执行、异步钩子等高级特性。

## 构造函数

```javascript
new EnhancedLifecycleManager(options)
```

### 参数

- `options` (Object): 配置选项
  - `enableAsyncHooks` (Boolean): 是否启用异步钩子，默认 `true`
  - `enableHookConditions` (Boolean): 是否启用钩子条件，默认 `true`
  - `enableHookOrdering` (Boolean): 是否启用钩子排序，默认 `true`
  - `maxHookExecutionTime` (Number): 最大钩子执行时间（毫秒），默认 `5000`
  - `enableHookTimeout` (Boolean): 是否启用钩子超时，默认 `true`

### 示例

```javascript
const lifecycleManager = new EnhancedLifecycleManager({
  enableAsyncHooks: true,
  maxHookExecutionTime: 10000
});
```

## 方法

### registerHook

注册生命周期钩子。

```javascript
lifecycleManager.registerHook(phase, hookName, handler, options)
```

#### 参数

- `phase` (String): 生命周期阶段
  - `beforeInitialize`: 初始化前
  - `afterInitialize`: 初始化后
  - `beforeMount`: 挂载前
  - `afterMount`: 挂载后
  - `beforeUpdate`: 更新前
  - `afterUpdate`: 更新后
  - `beforeUnmount`: 卸载前
  - `afterUnmount`: 卸载后
  - `beforeDestroy`: 销毁前
  - `afterDestroy`: 销毁后
  - `onError`: 错误处理
  - `afterError`: 错误处理后

- `hookName` (String): 钩子名称
- `handler` (Function): 钩子处理函数
- `options` (Object): 钩子选项
  - `priority` (Number): 优先级，默认 `0`，数值越大优先级越高
  - `condition` (Function|Boolean): 执行条件
  - `async` (Boolean): 是否为异步钩子，默认 `false`
  - `timeout` (Number): 超时时间（毫秒）
  - `middleware` (Array): 中间件数组
  - `metadata` (Object): 元数据
  - `enabled` (Boolean): 是否启用，默认 `true`
  - `dependsOn` (String): 依赖的钩子名称

#### 返回值

- `EnhancedLifecycleManager`: 返回实例本身，支持链式调用

#### 示例

```javascript
lifecycleManager.registerHook('beforeMount', 'logMount', (context) => {
  console.log('组件即将挂载:', context);
}, {
  priority: 10,
  async: false
});
```

### registerAsyncHook

注册异步生命周期钩子。

```javascript
lifecycleManager.registerAsyncHook(phase, hookName, handler, options)
```

#### 参数

与 `registerHook` 相同，但 `async` 选项默认为 `true`。

#### 示例

```javascript
lifecycleManager.registerAsyncHook('afterMount', 'fetchData', async (context) => {
  const data = await fetch('/api/data');
  context.data = data;
}, {
  timeout: 10000
});
```

### registerConditionalHook

注册条件生命周期钩子。

```javascript
lifecycleManager.registerConditionalHook(phase, hookName, handler, condition, options)
```

#### 参数

- `phase` (String): 生命周期阶段
- `hookName` (String): 钩子名称
- `handler` (Function): 钩子处理函数
- `condition` (Function|Boolean): 执行条件
- `options` (Object): 钩子选项

#### 示例

```javascript
lifecycleManager.registerConditionalHook(
  'beforeUpdate',
  'validate',
  (context) => {
    return validate(context.data);
  },
  (context) => context.data !== null
);
```

### executeHook

执行生命周期钩子。

```javascript
await lifecycleManager.executeHook(phase, context, options)
```

#### 参数

- `phase` (String): 生命周期阶段
- `context` (Object): 执行上下文
- `options` (Object): 执行选项
  - `continueOnError` (Boolean): 出错后是否继续执行，默认 `true`
  - `throwOnError` (Boolean): 是否抛出错误，默认 `false`

#### 返回值

- `Promise<Object>`: 包含执行结果的 Promise
  - `hookResults` (Map): 钩子执行结果
  - `errors` (Array): 错误数组
  - `originalContext` (Object): 原始上下文

#### 示例

```javascript
const result = await lifecycleManager.executeHook('beforeMount', {
  component: myComponent,
  props: { value: 123 }
});

console.log(result.hookResults);
console.log(result.errors);
```

### addHookMiddleware

添加钩子中间件。

```javascript
lifecycleManager.addHookMiddleware(middleware)
```

#### 参数

- `middleware` (Function): 中间件函数
  - 接收参数: `(context, next)`
  - `context`: 执行上下文
  - `next`: 下一个中间件函数

#### 返回值

- `EnhancedLifecycleManager`: 返回实例本身，支持链式调用

#### 示例

```javascript
lifecycleManager.addHookMiddleware((context, next) => {
  console.log('Before hook execution:', context);
  return next().then(() => {
    console.log('After hook execution:', context);
  });
});
```

### setHookOrder

设置钩子执行顺序。

```javascript
lifecycleManager.setHookOrder(phase, hookNames, order)
```

#### 参数

- `phase` (String): 生命周期阶段
- `hookNames` (Array): 钩子名称数组
- `order` (String): 排序方式
  - `sequence`: 按数组顺序执行
  - `parallel`: 并行执行
  - `custom`: 自定义顺序

#### 示例

```javascript
lifecycleManager.setHookOrder('beforeMount', ['hook1', 'hook2', 'hook3'], 'sequence');
```

### removeHook

移除生命周期钩子。

```javascript
lifecycleManager.removeHook(phase, hookName)
```

#### 参数

- `phase` (String): 生命周期阶段
- `hookName` (String): 钩子名称

#### 返回值

- `EnhancedLifecycleManager`: 返回实例本身，支持链式调用

#### 示例

```javascript
lifecycleManager.removeHook('beforeMount', 'logMount');
```

### toggleHook

启用或禁用钩子。

```javascript
lifecycleManager.toggleHook(phase, hookName, enabled)
```

#### 参数

- `phase` (String): 生命周期阶段
- `hookName` (String): 钩子名称
- `enabled` (Boolean): 是否启用

#### 返回值

- `EnhancedLifecycleManager`: 返回实例本身，支持链式调用

#### 示例

```javascript
lifecycleManager.toggleHook('beforeMount', 'logMount', false);
```

### enableHook / disableHook

启用或禁用钩子（快捷方法）。

```javascript
lifecycleManager.enableHook(phase, hookName)
lifecycleManager.disableHook(phase, hookName)
```

#### 示例

```javascript
lifecycleManager.disableHook('beforeMount', 'logMount');
lifecycleManager.enableHook('beforeMount', 'logMount');
```

### getHookInfo

获取钩子信息。

```javascript
lifecycleManager.getHookInfo(phase, hookName)
```

#### 参数

- `phase` (String): 生命周期阶段
- `hookName` (String): 钩子名称（可选）

#### 返回值

- `Object|Array`: 钩子配置对象或钩子数组

#### 示例

```javascript
const hookInfo = lifecycleManager.getHookInfo('beforeMount', 'logMount');
console.log(hookInfo);
```

### getAllHooks

获取所有钩子。

```javascript
lifecycleManager.getAllHooks()
```

#### 返回值

- `Object`: 包含所有阶段钩子的对象

#### 示例

```javascript
const allHooks = lifecycleManager.getAllHooks();
console.log(allHooks);
```

### getHooksForPhase

获取特定阶段的钩子。

```javascript
lifecycleManager.getHooksForPhase(phase)
```

#### 参数

- `phase` (String): 生命周期阶段

#### 返回值

- `Map`: 钩子映射

#### 示例

```javascript
const hooks = lifecycleManager.getHooksForPhase('beforeMount');
console.log(hooks);
```

### getHookStats

获取钩子统计信息。

```javascript
lifecycleManager.getHookStats(phase)
```

#### 参数

- `phase` (String): 生命周期阶段

#### 返回值

- `Object`: 统计信息
  - `totalHooks` (Number): 总钩子数
  - `enabledHooks` (Number): 启用的钩子数
  - `disabledHooks` (Number): 禁用的钩子数
  - `asyncHooks` (Number): 异步钩子数
  - `syncHooks` (Number): 同步钩子数
  - `conditionalHooks` (Number): 条件钩子数

#### 示例

```javascript
const stats = lifecycleManager.getHookStats('beforeMount');
console.log(stats);
```

### clearHooks

清空钩子。

```javascript
lifecycleManager.clearHooks(phase)
```

#### 参数

- `phase` (String): 生命周期阶段（可选，不提供则清空所有）

#### 返回值

- `EnhancedLifecycleManager`: 返回实例本身，支持链式调用

#### 示例

```javascript
lifecycleManager.clearHooks('beforeMount');
lifecycleManager.clearHooks(); // 清空所有
```

### clearAllHooks

清空所有钩子（别名）。

```javascript
lifecycleManager.clearAllHooks()
```

### registerBatchHooks

批量注册钩子。

```javascript
lifecycleManager.registerBatchHooks(hooksConfig)
```

#### 参数

- `hooksConfig` (Array): 钩子配置数组

#### 示例

```javascript
lifecycleManager.registerBatchHooks([
  {
    phase: 'beforeMount',
    name: 'hook1',
    handler: (ctx) => console.log('Hook 1'),
    priority: 10
  },
  {
    phase: 'beforeMount',
    name: 'hook2',
    handler: (ctx) => console.log('Hook 2'),
    priority: 5
  }
]);
```

### cloneHookConfig

克隆钩子配置。

```javascript
lifecycleManager.cloneHookConfig(phase, hookName, newHookName)
```

#### 参数

- `phase` (String): 生命周期阶段
- `hookName` (String): 原钩子名称
- `newHookName` (String): 新钩子名称（可选）

#### 返回值

- `Object|null`: 克隆的钩子配置

#### 示例

```javascript
const clonedHook = lifecycleManager.cloneHookConfig('beforeMount', 'logMount', 'newLogMount');
```

### validateHookConfig

验证钩子配置。

```javascript
lifecycleManager.validateHookConfig(config)
```

#### 参数

- `config` (Object): 钩子配置

#### 返回值

- `Boolean`: 是否有效

#### 示例

```javascript
const isValid = lifecycleManager.validateHookConfig({
  handler: () => {},
  priority: 10
});
```

### pauseHooks / resumeHooks

暂停或恢复钩子执行。

```javascript
lifecycleManager.pauseHooks(phase)
lifecycleManager.resumeHooks(phase)
```

#### 参数

- `phase` (String): 生命周期阶段

#### 示例

```javascript
lifecycleManager.pauseHooks('beforeMount');
lifecycleManager.resumeHooks('beforeMount');
```

### setHookContext / getHookContext

设置或获取钩子上下文。

```javascript
lifecycleManager.setHookContext(phase, context)
lifecycleManager.getHookContext(phase)
```

#### 参数

- `phase` (String): 生命周期阶段
- `context` (Object): 上下文对象

#### 示例

```javascript
lifecycleManager.setHookContext('beforeMount', { userId: 123 });
const context = lifecycleManager.getHookContext('beforeMount');
```

### onHookEvent / triggerHookEvent

监听或触发钩子事件。

```javascript
lifecycleManager.onHookEvent(phase, hookName, event, handler)
lifecycleManager.triggerHookEvent(phase, hookName, event, data)
```

#### 参数

- `phase` (String): 生命周期阶段
- `hookName` (String): 钩子名称
- `event` (String): 事件名称
- `handler` (Function): 事件处理函数
- `data` (Any): 事件数据

#### 示例

```javascript
lifecycleManager.onHookEvent('beforeMount', 'logMount', 'beforeExecute', (data) => {
  console.log('Hook about to execute:', data);
});

lifecycleManager.triggerHookEvent('beforeMount', 'logMount', 'beforeExecute', { timestamp: Date.now() });
```

### createHookDecorator

创建钩子装饰器。

```javascript
lifecycleManager.createHookDecorator(phase, options)
```

#### 参数

- `phase` (String): 生命周期阶段
- `options` (Object): 装饰器选项

#### 返回值

- `Function`: 装饰器函数

#### 示例

```javascript
const mountDecorator = lifecycleManager.createHookDecorator('Mount');

class MyComponent {
  @mountDecorator
  mount() {
    console.log('Mounting component');
  }
}
```

### getLifecycleStats

获取生命周期统计信息。

```javascript
lifecycleManager.getLifecycleStats()
```

#### 返回值

- `Object`: 统计信息
  - `totalPhases` (Number): 总阶段数
  - `totalHooks` (Number): 总钩子数
  - `enabledHooks` (Number): 启用的钩子数
  - `disabledHooks` (Number): 禁用的钩子数
  - `asyncHooks` (Number): 异步钩子数
  - `syncHooks` (Number): 同步钩子数

#### 示例

```javascript
const stats = lifecycleManager.getLifecycleStats();
console.log(stats);
```

## 使用示例

### 基本使用

```javascript
const lifecycleManager = new EnhancedLifecycleManager();

// 注册钩子
lifecycleManager.registerHook('beforeMount', 'logMount', (context) => {
  console.log('组件即将挂载:', context.component);
});

// 执行钩子
await lifecycleManager.executeHook('beforeMount', {
  component: myComponent,
  props: { value: 123 }
});
```

### 使用中间件

```javascript
lifecycleManager.addHookMiddleware((context, next) => {
  console.log('Before:', context);
  return next().then(() => {
    console.log('After:', context);
  });
});
```

### 异步钩子

```javascript
lifecycleManager.registerAsyncHook('afterMount', 'fetchData', async (context) => {
  const data = await fetch('/api/data');
  context.data = data;
});
```

### 条件钩子

```javascript
lifecycleManager.registerConditionalHook(
  'beforeUpdate',
  'validate',
  (context) => {
    return validate(context.data);
  },
  (context) => context.data !== null
);
```

## 相关文档

- [SFC 组件管理系统指南](../guides/sfc-guide.md)
- [类型检查 API](typescript-type-manager.md)
- [组件缓存 API](component-cache.md)
