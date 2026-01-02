# 组件缓存管理器 API

组件缓存管理器提供高效的组件缓存和懒加载功能，支持 LRU 淘汰策略和自动清理。

## 构造函数

```javascript
new ComponentCacheManager(options)
```

### 参数

- `options` (Object): 配置选项
  - `maxCacheSize` (Number): 最大缓存数量，默认 100
  - `cacheTTL` (Number): 缓存过期时间（毫秒），默认 300000（5分钟）
  - `lazyLoadThreshold` (Number): 懒加载阈值，默认 0.1
  - `autoCleanup` (Boolean): 是否自动清理，默认 true
  - `enableMemoryOptimization` (Boolean): 是否启用内存优化，默认 true

### 示例

```javascript
const cacheManager = new ComponentCacheManager({
  maxCacheSize: 200,
  cacheTTL: 600000,
  autoCleanup: true
});
```

## 方法

### set

缓存组件。

```javascript
cacheManager.set(key, component, metadata)
```

#### 参数

- `key` (String): 缓存键
- `component` (Any): 组件对象
- `metadata` (Object): 元数据，可选

#### 返回值

- (Any): 缓存的组件

#### 示例

```javascript
cacheManager.set('my-component', myComponent, {
  version: '1.0.0',
  author: 'John Doe'
});
```

### get

获取缓存的组件。

```javascript
cacheManager.get(key, options)
```

#### 参数

- `key` (String): 缓存键
- `options` (Object): 选项，可选

#### 返回值

- (Any | null): 缓存的组件，如果不存在或已过期则返回 null

#### 示例

```javascript
const component = cacheManager.get('my-component');
if (component) {
  console.log('从缓存获取组件');
}
```

### getOrLoad

异步获取组件，如果缓存中不存在则加载。

```javascript
cacheManager.getOrLoad(key, loader, options)
```

#### 参数

- `key` (String): 缓存键
- `loader` (Function): 加载函数
- `options` (Object): 选项，可选
  - `retryAttempts` (Number): 重试次数，默认 0
  - `retryDelay` (Number): 重试延迟（毫秒），默认 1000
  - `metadata` (Object): 元数据

#### 返回值

- (Promise): 返回组件的 Promise

#### 示例

```javascript
const component = await cacheManager.getOrLoad(
  'my-component',
  () => import('./MyComponent'),
  {
    retryAttempts: 3,
    retryDelay: 2000
  }
);
```

### delete

删除缓存项。

```javascript
cacheManager.delete(key)
```

#### 参数

- `key` (String): 缓存键

#### 返回值

- (Boolean): 是否删除成功

#### 示例

```javascript
cacheManager.delete('my-component');
```

### clear

清空缓存。

```javascript
cacheManager.clear()
```

#### 示例

```javascript
cacheManager.clear();
```

### setupLazyLoading

设置懒加载。

```javascript
cacheManager.setupLazyLoading(elements, loader, options)
```

#### 参数

- `elements` (Array): DOM 元素数组
- `loader` (Function): 加载函数
- `options` (Object): 选项，可选
  - `rootMargin` (String): 根边距，默认 '50px'
  - `threshold` (Number): 阈值，默认 0.1

#### 示例

```javascript
const elements = document.querySelectorAll('[data-component-key]');
cacheManager.setupLazyLoading(elements, (key) => {
  return import(`./components/${key}.js`);
});
```

### preload

预加载组件。

```javascript
cacheManager.preload(key, loader, options)
```

#### 参数

- `key` (String): 组件键
- `loader` (Function): 加载函数
- `options` (Object): 选项，可选

#### 返回值

- (Promise): 返回预加载结果的 Promise

#### 示例

```javascript
const result = await cacheManager.preload('my-component', () => {
  return import('./MyComponent');
});
```

### register

注册组件。

```javascript
cacheManager.register(key, loader, options)
```

#### 参数

- `key` (String): 组件键
- `loader` (Function): 加载函数
- `options` (Object): 选项，可选
  - `lazy` (Boolean): 是否懒加载

#### 返回值

- (Promise): 返回注册结果的 Promise

#### 示例

```javascript
await cacheManager.register('my-component', () => {
  return import('./MyComponent');
}, { lazy: true });
```

### getMetadata

获取缓存项元数据。

```javascript
cacheManager.getMetadata(key)
```

#### 参数

- `key` (String): 缓存键

#### 返回值

- (Object | null): 元数据对象，如果不存在则返回 null

#### 示例

```javascript
const metadata = cacheManager.getMetadata('my-component');
console.log(metadata.version);
```

### getStats

获取缓存统计信息。

```javascript
cacheManager.getStats()
```

#### 返回值

- (Object): 统计信息对象
  - `hits` (Number): 缓存命中次数
  - `misses` (Number): 缓存未命中次数
  - `evictions` (Number): 淘汰次数
  - `loads` (Number): 加载次数
  - `errors` (Number): 错误次数
  - `cacheSize` (Number): 当前缓存大小
  - `maxCacheSize` (Number): 最大缓存大小
  - `loadingCount` (Number): 正在加载的数量
  - `totalSize` (Number): 总大小（字节）
  - `hitRate` (Number): 命中率
  - `oldestEntry` (Object): 最老的缓存项
  - `memoryUsage` (Number): 内存使用量（字节）

#### 示例

```javascript
const stats = cacheManager.getStats();
console.log(`命中率: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`缓存大小: ${stats.cacheSize}/${stats.maxCacheSize}`);
```

### destroy

销毁缓存管理器。

```javascript
cacheManager.destroy()
```

#### 示例

```javascript
cacheManager.destroy();
```

## 全局实例

```javascript
import { componentCacheManager } from './component-cache-manager';

// 使用全局实例
componentCacheManager.set('key', component);
const component = componentCacheManager.get('key');
```

## 便捷方法

### cacheComponent

缓存组件。

```javascript
import { cacheComponent } from './component-cache-manager';

cacheComponent(key, component, metadata);
```

### getCachedComponent

获取缓存的组件。

```javascript
import { getCachedComponent } from './component-cache-manager';

const component = getCachedComponent(key);
```

### loadComponent

加载组件。

```javascript
import { loadComponent } from './component-cache-manager';

const component = await loadComponent(key, loader, options);
```

### clearComponentCache

清空组件缓存。

```javascript
import { clearComponentCache } from './component-cache-manager';

clearComponentCache();
```

## 使用示例

### 基本使用

```javascript
import { ComponentCacheManager } from './component-cache-manager';

const cacheManager = new ComponentCacheManager();

// 缓存组件
cacheManager.set('my-component', myComponent);

// 获取组件
const component = cacheManager.get('my-component');
```

### 异步加载

```javascript
// 异步加载组件
const component = await cacheManager.getOrLoad(
  'my-component',
  () => import('./MyComponent')
);
```

### 懒加载

```javascript
// 设置懒加载
const elements = document.querySelectorAll('[data-component-key]');
cacheManager.setupLazyLoading(elements, (key) => {
  return import(`./components/${key}.js`);
});
```

### 预加载

```javascript
// 预加载组件
await cacheManager.preload('my-component', () => {
  return import('./MyComponent');
});
```

### 监控统计

```javascript
// 获取统计信息
const stats = cacheManager.getStats();
console.log(`命中率: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`缓存大小: ${stats.cacheSize}/${stats.maxCacheSize}`);
console.log(`内存使用: ${stats.memoryUsage} 字节`);
```
