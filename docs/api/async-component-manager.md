# 异步组件管理器 API

异步组件管理器负责管理异步组件的加载、缓存和状态，支持重试机制和预加载功能。

## 构造函数

```javascript
new AsyncComponentManager(componentCache)
```

### 参数

- `componentCache` (ComponentCacheManager): 外部组件缓存管理器，可选

### 示例

```javascript
import { AsyncComponentManager } from './async-component-manager';
import { componentCacheManager } from './component-cache-manager';

const asyncManager = new AsyncComponentManager(componentCacheManager);
```

## 方法

### register

注册异步组件。

```javascript
asyncManager.register(name, loader, options)
```

#### 参数

- `name` (String): 组件名称
- `loader` (Function): 加载函数
- `options` (Object): 选项，可选
  - `timeout` (Number): 加载超时时间（毫秒），默认 30000
  - `retryAttempts` (Number): 重试次数，默认 3
  - `cache` (Boolean): 是否缓存，默认 true
  - `preload` (Boolean): 是否预加载，默认 false
  - `loading` (Object): 加载时显示的组件
  - `error` (Object): 错误时显示的组件

#### 返回值

- (Promise): 返回异步组件的 Promise

#### 示例

```javascript
const asyncComponent = await asyncManager.register(
  'my-component',
  () => import('./MyComponent'),
  {
    timeout: 10000,
    retryAttempts: 3,
    cache: true,
    preload: false
  }
);
```

### import

动态导入组件。

```javascript
asyncManager.import(name, path, options)
```

#### 参数

- `name` (String): 组件名称
- `path` (String): 组件路径
- `options` (Object): 选项，可选

#### 返回值

- (Promise): 返回导入组件的 Promise

#### 示例

```javascript
const component = await asyncManager.import(
  'my-component',
  './components/MyComponent.js'
);
```

### getOrLoad

获取或加载组件。

```javascript
asyncManager.getOrLoad(name, loader, options)
```

#### 参数

- `name` (String): 组件名称
- `loader` (Function): 加载函数
- `options` (Object): 选项，可选
  - `cache` (Boolean): 是否缓存，默认 true
  - `retryAttempts` (Number): 重试次数
  - `timeout` (Number): 超时时间
  - `metadata` (Object): 元数据

#### 返回值

- (Promise): 返回组件的 Promise

#### 示例

```javascript
const component = await asyncManager.getOrLoad(
  'my-component',
  () => import('./MyComponent'),
  {
    cache: true,
    retryAttempts: 3,
    timeout: 10000
  }
);
```

### get

获取缓存的组件。

```javascript
asyncManager.get(name)
```

#### 参数

- `name` (String): 组件名称

#### 返回值

- (Any | undefined): 缓存的组件，如果不存在则返回 undefined

#### 示例

```javascript
const component = asyncManager.get('my-component');
if (component) {
  console.log('从缓存获取组件');
}
```

### preload

预加载组件。

```javascript
asyncManager.preload(name, loader, options)
```

#### 参数

- `name` (String): 组件名称
- `loader` (Function): 加载函数
- `options` (Object): 选项，可选

#### 返回值

- (Promise): 返回预加载结果的 Promise

#### 示例

```javascript
await asyncManager.preload('my-component', () => {
  return import('./MyComponent');
});
```

### preloadComponents

预加载多个组件。

```javascript
asyncManager.preloadComponents(components)
```

#### 参数

- `components` (Array): 组件数组
  - `name` (String): 组件名称
  - `loader` (Function): 加载函数
  - `options` (Object): 选项

#### 返回值

- (Promise): 返回所有预加载结果的 Promise

#### 示例

```javascript
await asyncManager.preloadComponents([
  {
    name: 'component-a',
    loader: () => import('./ComponentA'),
    options: { cache: true }
  },
  {
    name: 'component-b',
    loader: () => import('./ComponentB'),
    options: { cache: true }
  }
]);
```

### lazy

创建懒加载组件包装器。

```javascript
asyncManager.lazy(loader, options)
```

#### 参数

- `loader` (Function): 加载函数
- `options` (Object): 选项，可选
  - `name` (String): 组件名称，默认 'LazyComponent'

#### 返回值

- (Object): 懒加载组件对象

#### 示例

```javascript
const LazyComponent = asyncManager.lazy(
  () => import('./MyComponent'),
  { name: 'MyLazyComponent' }
);
```

### batchLoad

批量加载组件。

```javascript
asyncManager.batchLoad(names, loaders)
```

#### 参数

- `names` (Array): 组件名称数组
- `loaders` (Array): 加载函数数组

#### 返回值

- (Promise): 返回所有加载组件的 Promise

#### 示例

```javascript
const components = await asyncManager.batchLoad(
  ['component-a', 'component-b'],
  [
    () => import('./ComponentA'),
    () => import('./ComponentB')
  ]
);
```

### getLoadingState

获取组件加载状态。

```javascript
asyncManager.getLoadingState(name)
```

#### 参数

- `name` (String): 组件名称

#### 返回值

- (Object): 加载状态对象
  - `loading` (Boolean): 是否正在加载
  - `timestamp` (Number): 时间戳

#### 示例

```javascript
const state = asyncManager.getLoadingState('my-component');
if (state.loading) {
  console.log('组件正在加载中...');
}
```

### getErrorState

获取组件错误状态。

```javascript
asyncManager.getErrorState(name)
```

#### 参数

- `name` (String): 组件名称

#### 返回值

- (Object): 错误状态对象
  - `error` (Error | null): 错误对象
  - `timestamp` (Number): 时间戳

#### 示例

```javascript
const state = asyncManager.getErrorState('my-component');
if (state.error) {
  console.error('组件加载失败:', state.error);
}
```

### getMetadata

获取组件元数据。

```javascript
asyncManager.getMetadata(name)
```

#### 参数

- `name` (String): 组件名称

#### 返回值

- (Any | undefined): 元数据对象，如果不存在则返回 undefined

#### 示例

```javascript
const metadata = asyncManager.getMetadata('my-component');
console.log(metadata);
```

### has

检查组件是否存在。

```javascript
asyncManager.has(name)
```

#### 参数

- `name` (String): 组件名称

#### 返回值

- (Boolean): 组件是否存在

#### 示例

```javascript
if (asyncManager.has('my-component')) {
  console.log('组件已缓存');
}
```

### clearCache

清除缓存。

```javascript
asyncManager.clearCache()
```

#### 示例

```javascript
asyncManager.clearCache();
```

### clear

清除所有缓存和状态。

```javascript
asyncManager.clear()
```

#### 示例

```javascript
asyncManager.clear();
```

### getCacheStats

获取缓存统计信息。

```javascript
asyncManager.getCacheStats()
```

#### 返回值

- (Object): 统计信息对象
  - `cacheSize` (Number): 缓存大小
  - `loadingCount` (Number): 正在加载的数量
  - `errorCount` (Number): 错误数量
  - `preloadQueueSize` (Number): 预加载队列大小

#### 示例

```javascript
const stats = asyncManager.getCacheStats();
console.log(`缓存大小: ${stats.cacheSize}`);
console.log(`正在加载: ${stats.loadingCount}`);
```

### getStats

获取统计信息。

```javascript
asyncManager.getStats()
```

#### 返回值

- (Object): 统计信息对象
  - `totalComponents` (Number): 总组件数
  - `cacheSize` (Number): 缓存大小
  - `errors` (Number): 错误数

#### 示例

```javascript
const stats = asyncManager.getStats();
console.log(`总组件数: ${stats.totalComponents}`);
console.log(`错误数: ${stats.errors}`);
```

## 全局实例

```javascript
import { asyncComponentManager } from './async-component-manager';

// 使用全局实例
const component = await asyncComponentManager.register(
  'my-component',
  () => import('./MyComponent')
);
```

## 便捷方法

### AsyncComponent

注册异步组件。

```javascript
import { AsyncComponent } from './async-component-manager';

const component = await AsyncComponent(name, loader, options);
```

### LazyComponent

创建懒加载组件。

```javascript
import { LazyComponent } from './async-component-manager';

const lazyComponent = LazyComponent(loader, options);
```

### ImportComponent

动态导入组件。

```javascript
import { ImportComponent } from './async-component-manager';

const component = await ImportComponent(name, path, options);
```

## 使用示例

### 基本使用

```javascript
import { AsyncComponentManager } from './async-component-manager';

const asyncManager = new AsyncComponentManager();

// 注册异步组件
const asyncComponent = await asyncManager.register(
  'my-component',
  () => import('./MyComponent')
);
```

### 带重试机制的加载

```javascript
const component = await asyncManager.register(
  'my-component',
  () => import('./MyComponent'),
  {
    timeout: 10000,
    retryAttempts: 3
  }
);
```

### 预加载组件

```javascript
// 预加载单个组件
await asyncManager.preload('my-component', () => {
  return import('./MyComponent');
});

// 预加载多个组件
await asyncManager.preloadComponents([
  { name: 'component-a', loader: () => import('./ComponentA') },
  { name: 'component-b', loader: () => import('./ComponentB') }
]);
```

### 懒加载组件

```javascript
const LazyComponent = asyncManager.lazy(
  () => import('./MyComponent'),
  { name: 'MyLazyComponent' }
);

// 使用懒加载组件
// 当需要时才加载
```

### 监控加载状态

```javascript
// 获取加载状态
const loadingState = asyncManager.getLoadingState('my-component');
console.log('是否正在加载:', loadingState.loading);

// 获取错误状态
const errorState = asyncManager.getErrorState('my-component');
if (errorState.error) {
  console.error('加载失败:', errorState.error);
}
```

### 批量加载

```javascript
const components = await asyncManager.batchLoad(
  ['component-a', 'component-b'],
  [
    () => import('./ComponentA'),
    () => import('./ComponentB')
  ]
);
```

### 统计信息

```javascript
// 获取缓存统计
const cacheStats = asyncManager.getCacheStats();
console.log(`缓存大小: ${cacheStats.cacheSize}`);
console.log(`正在加载: ${cacheStats.loadingCount}`);
console.log(`错误数: ${cacheStats.errorCount}`);

// 获取总体统计
const stats = asyncManager.getStats();
console.log(`总组件数: ${stats.totalComponents}`);
console.log(`错误数: ${stats.errors}`);
```
