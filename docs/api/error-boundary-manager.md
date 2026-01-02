# ErrorBoundaryManager API 文档

错误边界管理器，提供优雅的错误处理和恢复机制。

## 概述

`ErrorBoundaryManager` 是一个强大的错误处理系统，用于捕获和处理组件渲染错误、运行时错误和异步错误。它提供了错误边界、回退组件、错误日志和恢复机制等功能。

## 构造函数

```javascript
new ErrorBoundaryManager(options)
```

### 参数

- `options` (Object) - 配置选项
  - `enableErrorBoundary` (Boolean) - 是否启用错误边界，默认 `true`
  - `enableErrorLogging` (Boolean) - 是否启用错误日志，默认 `true`
  - `enableErrorRecovery` (Boolean) - 是否启用错误恢复，默认 `true`
  - `maxErrorLogSize` (Number) - 最大错误日志数量，默认 `100`
  - `errorReportingEndpoint` (String) - 错误报告端点 URL，默认 `null`

### 示例

```javascript
const errorManager = new ErrorBoundaryManager({
  enableErrorBoundary: true,
  enableErrorLogging: true,
  enableErrorRecovery: true,
  maxErrorLogSize: 200,
  errorReportingEndpoint: 'https://api.example.com/errors'
});
```

## 方法

### createErrorBoundary

创建错误边界组件。

```javascript
createErrorBoundary(name, config)
```

#### 参数

- `name` (String) - 错误边界名称
- `config` (Object) - 配置选项
  - `fallback` (Function) - 回退组件渲染函数
  - `onError` (Function) - 错误处理回调
  - `onRecover` (Function) - 恢复回调
  - `retryAttempts` (Number) - 重试次数，默认 `3`
  - `retryDelay` (Number) - 重试延迟（毫秒），默认 `1000`
  - `enableRecovery` (Boolean) - 是否启用恢复，默认 `true`

#### 返回值

返回错误边界组件对象。

#### 示例

```javascript
const boundary = errorManager.createErrorBoundary('myBoundary', {
  fallback: ({ error, retryCount, retryAttempts, retry }) => ({
    render(createElem) {
      return createElem('div', { class: 'error-fallback' }, [
        createElem('h3', {}, ['组件加载失败']),
        createElem('p', {}, [error.message]),
        retryCount < retryAttempts && createElem('button', {
          '@click': retry
        }, [`重试 (${retryCount + 1}/${retryAttempts})`])
      ]);
    }
  }),
  retryAttempts: 5,
  retryDelay: 2000
});
```

### registerErrorHandler

注册错误处理器。

```javascript
registerErrorHandler(errorType, handler)
```

#### 参数

- `errorType` (String) - 错误类型标识
- `handler` (Function) - 错误处理函数

#### 示例

```javascript
errorManager.registerErrorHandler('network', (error, errorInfo) => {
  console.error('网络错误:', error);
  showErrorToast('网络连接失败，请检查网络设置');
});
```

### handleError

处理错误。

```javascript
handleError(errorType, error, errorInfo)
```

#### 参数

- `errorType` (String) - 错误类型
- `error` (Error) - 错误对象
- `errorInfo` (Object) - 错误信息（可选）

#### 示例

```javascript
try {
  await fetchData();
} catch (error) {
  errorManager.handleError('network', error, { component: 'DataLoader' });
}
```

### wrapComponent

包装组件以添加错误边界。

```javascript
wrapComponent(component, errorBoundaryName)
```

#### 参数

- `component` (Object) - 组件对象
- `errorBoundaryName` (String) - 错误边界名称

#### 返回值

返回包装后的组件。

#### 示例

```javascript
const MyComponent = {
  name: 'MyComponent',
  render(createElem) {
    return createElem('div', {}, ['Hello']);
  }
};

const wrappedComponent = errorManager.wrapComponent(MyComponent, 'myBoundary');
```

### initGlobalErrorHandling

初始化全局错误处理。

```javascript
initGlobalErrorHandling()
```

#### 示例

```javascript
errorManager.initGlobalErrorHandling();
```

### registerGlobalErrorHandler

注册全局错误处理器。

```javascript
registerGlobalErrorHandler(handler)
```

#### 参数

- `handler` (Function) - 全局错误处理函数

#### 示例

```javascript
errorManager.registerGlobalErrorHandler((error, context) => {
  console.error('全局错误:', error, context);
  sendErrorToServer(error, context);
});
```

### getErrorLog

获取错误日志。

```javascript
getErrorLog()
```

#### 返回值

返回错误日志数组。

#### 示例

```javascript
const errors = errorManager.getErrorLog();
console.log('错误日志:', errors);
```

### clearErrorLog

清除错误日志。

```javascript
clearErrorLog()
```

#### 示例

```javascript
errorManager.clearErrorLog();
```

### getErrorStats

获取错误统计信息。

```javascript
getErrorStats()
```

#### 返回值

返回错误统计对象，包含：
- `totalErrors` (Number) - 总错误数
- `errorLogSize` (Number) - 错误日志大小
- `boundariesCount` (Number) - 错误边界数量
- `recentErrors` (Number) - 最近一小时错误数
- `errorTypes` (Object) - 错误类型统计
- `mostCommonError` (String) - 最常见错误类型
- `errorRate` (Number) - 错误率

#### 示例

```javascript
const stats = errorManager.getErrorStats();
console.log('错误统计:', stats);
```

### handleBatchErrors

批量处理错误。

```javascript
handleBatchErrors(errorType, errors)
```

#### 参数

- `errorType` (String) - 错误类型
- `errors` (Array) - 错误数组

#### 示例

```javascript
const errors = [
  new Error('Error 1'),
  new Error('Error 2')
];
errorManager.handleBatchErrors('validation', errors);
```

### hasBoundary

检查错误边界是否存在。

```javascript
hasBoundary(name)
```

#### 参数

- `name` (String) - 错误边界名称

#### 返回值

返回布尔值，表示错误边界是否存在。

#### 示例

```javascript
if (errorManager.hasBoundary('myBoundary')) {
  console.log('错误边界已存在');
}
```

### deleteBoundary

删除错误边界。

```javascript
deleteBoundary(name)
```

#### 参数

- `name` (String) - 错误边界名称

#### 返回值

返回布尔值，表示是否成功删除。

#### 示例

```javascript
errorManager.deleteBoundary('myBoundary');
```

### getAllBoundaries

获取所有错误边界列表。

```javascript
getAllBoundaries()
```

#### 返回值

返回错误边界名称数组。

#### 示例

```javascript
const boundaries = errorManager.getAllBoundaries();
console.log('所有错误边界:', boundaries);
```

### handleAsyncError

处理异步错误。

```javascript
handleAsyncError(boundaryName, error, errorInfo)
```

#### 参数

- `boundaryName` (String) - 错误边界名称
- `error` (Error) - 错误对象
- `errorInfo` (Object) - 错误信息

#### 示例

```javascript
try {
  await asyncOperation();
} catch (error) {
  errorManager.handleAsyncError('myBoundary', error, { operation: 'asyncOperation' });
}
```

### destroy

销毁错误边界管理器。

```javascript
destroy()
```

#### 示例

```javascript
errorManager.destroy();
```

## 便捷方法

### createErrorBoundary

创建错误边界的便捷方法。

```javascript
import { createErrorBoundary } from './error-boundary-manager.js';

const boundary = createErrorBoundary('myBoundary', config);
```

### wrapWithErrorBoundary

包装组件的便捷方法。

```javascript
import { wrapWithErrorBoundary } from './error-boundary-manager.js';

const wrapped = wrapWithErrorBoundary(component, 'myBoundary');
```

### registerErrorHandler

注册错误处理器的便捷方法。

```javascript
import { registerErrorHandler } from './error-boundary-manager.js';

registerErrorHandler((error, context) => {
  console.error('错误:', error, context);
});
```

### getErrorLog

获取错误日志的便捷方法。

```javascript
import { getErrorLog } from './error-boundary-manager.js';

const errors = getErrorLog();
```

### triggerError

手动触发错误的便捷方法（用于测试）。

```javascript
import { triggerError } from './error-boundary-manager.js';

triggerError(new Error('测试错误'), { component: 'TestComponent' });
```

## 使用示例

### 基本使用

```javascript
import { ErrorBoundaryManager } from './error-boundary-manager.js';

const errorManager = new ErrorBoundaryManager();

// 创建错误边界
const boundary = errorManager.createErrorBoundary('appBoundary', {
  fallback: ({ error, retry }) => ({
    render(createElem) {
      return createElem('div', { class: 'error-fallback' }, [
        createElem('h2', {}, ['应用出错']),
        createElem('p', {}, [error.message]),
        createElem('button', { '@click': retry }, ['重试'])
      ]);
    }
  })
});

// 包装组件
const AppComponent = errorManager.wrapComponent({
  name: 'AppComponent',
  render(createElem) {
    return createElem('div', {}, ['Hello World']);
  }
}, 'appBoundary');
```

### 全局错误处理

```javascript
import { ErrorBoundaryManager } from './error-boundary-manager.js';

const errorManager = new ErrorBoundaryManager({
  errorReportingEndpoint: 'https://api.example.com/errors'
});

// 初始化全局错误处理
errorManager.initGlobalErrorHandling();

// 注册全局错误处理器
errorManager.registerGlobalErrorHandler((error, context) => {
  console.error('捕获到全局错误:', error, context);
  
  // 发送到错误监控服务
  if (context.type === 'unhandledrejection') {
    trackError('promise_rejection', error);
  } else if (context.type === 'runtime') {
    trackError('runtime_error', error);
  }
});
```

### 错误恢复

```javascript
const boundary = errorManager.createErrorBoundary('retryBoundary', {
  fallback: ({ error, retryCount, retryAttempts, retry }) => ({
    render(createElem) {
      return createElem('div', { class: 'retry-fallback' }, [
        createElem('h3', {}, ['加载失败']),
        createElem('p', {}, [error.message]),
        retryCount < retryAttempts ? createElem('button', {
          '@click': retry,
          class: 'retry-button'
        }, [`重试 (${retryCount + 1}/${retryAttempts})`]) : createElem('p', {}, ['重试次数已用尽'])
      ]);
    }
  }),
  retryAttempts: 3,
  retryDelay: 1000,
  enableRecovery: true
});
```

### 错误统计

```javascript
// 获取错误统计
const stats = errorManager.getErrorStats();
console.log('总错误数:', stats.totalErrors);
console.log('最近一小时错误数:', stats.recentErrors);
console.log('错误类型分布:', stats.errorTypes);
console.log('最常见错误:', stats.mostCommonError);
console.log('错误率:', stats.errorRate);

// 导出错误日志
const errorLog = errorManager.exportErrorLog();
console.log('错误日志:', errorLog);
```

## 最佳实践

1. **为关键组件创建错误边界**：为应用中的关键组件创建错误边界，防止整个应用崩溃。

2. **提供友好的回退 UI**：为错误边界提供清晰、友好的回退界面，提升用户体验。

3. **记录错误信息**：启用错误日志记录，并配置错误报告端点，便于后续分析和修复。

4. **合理设置重试策略**：根据组件特性设置合适的重试次数和延迟时间。

5. **分类处理错误**：使用不同的错误类型和处理器来分类处理不同类型的错误。

6. **定期清理日志**：定期清理错误日志，避免内存占用过大。

7. **监控错误率**：定期检查错误统计信息，及时发现和解决问题。

## 注意事项

- 错误边界只能捕获组件树中的错误，不能捕获事件处理器、异步代码等错误。
- 全局错误处理会捕获所有未处理的错误，包括 Promise 拒绝和运行时错误。
- 错误日志大小有限制，超过限制后会自动删除最早的记录。
- 错误报告端点需要支持 CORS，否则可能导致报告发送失败。
