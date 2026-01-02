# ComponentPerformanceMonitor API 文档

组件性能监控器，提供全面的性能跟踪、分析和优化建议。

## 概述

`ComponentPerformanceMonitor` 是一个强大的性能监控系统，用于跟踪组件的渲染性能、内存使用情况，并提供优化建议。它支持实时监控、性能报告生成和内存泄漏检测等功能。

## 构造函数

```javascript
new ComponentPerformanceMonitor(options)
```

### 参数

- `options` (Object) - 配置选项
  - `enableMemoryTracking` (Boolean) - 是否启用内存跟踪，默认 `true`
  - `enableRenderTracking` (Boolean) - 是否启用渲染跟踪，默认 `true`
  - `enablePerformanceAPI` (Boolean) - 是否启用 Performance API，默认 `false`
  - `maxHistorySize` (Number) - 最大历史记录数量，默认 `100`
  - `monitoringInterval` (Number) - 监控间隔（毫秒），默认 `1000`
  - `memoryThreshold` (Number) - 内存阈值（字节），默认 `50 * 1024 * 1024` (50MB)
  - `slowRenderThreshold` (Number) - 慢渲染阈值（毫秒），默认 `16`

### 示例

```javascript
const monitor = new ComponentPerformanceMonitor({
  enableMemoryTracking: true,
  enableRenderTracking: true,
  enablePerformanceAPI: true,
  maxHistorySize: 200,
  monitoringInterval: 2000,
  memoryThreshold: 100 * 1024 * 1024, // 100MB
  slowRenderThreshold: 16
});
```

## 方法

### startMonitoring

开始监控。

```javascript
startMonitoring()
```

#### 示例

```javascript
monitor.startMonitoring();
```

### stopMonitoring

停止监控。

```javascript
stopMonitoring()
```

#### 示例

```javascript
monitor.stopMonitoring();
```

### recordRender

记录组件渲染。

```javascript
recordRender(componentName, renderData)
```

#### 参数

- `componentName` (String) - 组件名称
- `renderData` (Object) - 渲染数据
  - `duration` (Number) - 渲染持续时间（毫秒）
  - `type` (String) - 渲染类型（mount/update）
  - `props` (Object) - 组件属性
  - `state` (Object) - 组件状态

#### 示例

```javascript
const startTime = performance.now();
component.render();
const duration = performance.now() - startTime;

monitor.recordRender('MyComponent', {
  duration,
  type: 'update',
  props: component.props,
  state: component.state
});
```

### recordMount

记录组件挂载。

```javascript
recordMount(componentName, mountData)
```

#### 参数

- `componentName` (String) - 组件名称
- `mountData` (Object) - 挂载数据
  - `duration` (Number) - 挂载持续时间（毫秒）

#### 示例

```javascript
const startTime = performance.now();
component.mount();
const duration = performance.now() - startTime;

monitor.recordMount('MyComponent', { duration });
```

### recordUnmount

记录组件卸载。

```javascript
recordUnmount(componentName, unmountData)
```

#### 参数

- `componentName` (String) - 组件名称
- `unmountData` (Object) - 卸载数据
  - `duration` (Number) - 卸载持续时间（毫秒）

#### 示例

```javascript
const startTime = performance.now();
component.unmount();
const duration = performance.now() - startTime;

monitor.recordUnmount('MyComponent', { duration });
```

### recordMemoryUsage

记录内存使用情况。

```javascript
recordMemoryUsage(componentName, memoryData)
```

#### 参数

- `componentName` (String) - 组件名称
- `memoryData` (Object) - 内存数据
  - `used` (Number) - 已使用内存（字节）

#### 示例

```javascript
if (performance.memory) {
  monitor.recordMemoryUsage('MyComponent', {
    used: performance.memory.usedJSHeapSize
  });
}
```

### recordCustomEvent

记录自定义事件。

```javascript
recordCustomEvent(componentName, eventData)
```

#### 参数

- `componentName` (String) - 组件名称
- `eventData` (Object) - 事件数据
  - `type` (String) - 事件类型
  - `duration` (Number) - 持续时间（毫秒）
  - `metadata` (Object) - 元数据

#### 示例

```javascript
monitor.recordCustomEvent('MyComponent', {
  type: 'data-fetch',
  duration: 150,
  metadata: { endpoint: '/api/data' }
});
```

### getSystemMetrics

获取系统性能指标。

```javascript
getSystemMetrics()
```

#### 返回值

返回系统性能指标对象，包含：
- `memory` (Object) - 内存信息
  - `usedJSHeapSize` (Number) - 已使用的 JS 堆大小
  - `totalJSHeapSize` (Number) - 总 JS 堆大小
  - `jsHeapSizeLimit` (Number) - JS 堆大小限制
- `timing` (Object) - 时间信息
  - `domComplete` (Number) - DOM 完成时间
  - `domInteractive` (Number) - DOM 交互时间
  - `loadEventEnd` (Number) - 加载事件结束时间
  - `navigationStart` (Number) - 导航开始时间
- `navigation` (Object) - 导航信息
  - `type` (Number) - 导航类型
  - `redirectCount` (Number) - 重定向次数

#### 示例

```javascript
const systemMetrics = monitor.getSystemMetrics();
console.log('系统指标:', systemMetrics);
```

### getComponentMetrics

获取组件性能数据。

```javascript
getComponentMetrics(componentName)
```

#### 参数

- `componentName` (String) - 组件名称

#### 返回值

返回组件性能指标对象，包含：
- `renderCount` (Number) - 渲染次数
- `totalRenderTime` (Number) - 总渲染时间
- `averageRenderTime` (Number) - 平均渲染时间
- `minRenderTime` (Number) - 最小渲染时间
- `maxRenderTime` (Number) - 最大渲染时间
- `lastRenderTime` (Number) - 最后渲染时间
- `mountCount` (Number) - 挂载次数
- `totalMountTime` (Number) - 总挂载时间
- `unmountCount` (Number) - 卸载次数
- `totalUnmountTime` (Number) - 总卸载时间
- `peakMemory` (Number) - 峰值内存
- `memoryUsage` (Array) - 内存使用历史
- `performance` (Object) - 性能指标
  - `slowRenderCount` (Number) - 慢渲染次数
  - `memoryLeakRisk` (Boolean) - 内存泄漏风险
  - `optimizationScore` (Number) - 优化分数

#### 示例

```javascript
const metrics = monitor.getComponentMetrics('MyComponent');
console.log('组件指标:', metrics);
```

### resetComponentMetrics

重置组件指标。

```javascript
resetComponentMetrics(componentName)
```

#### 参数

- `componentName` (String) - 组件名称

#### 示例

```javascript
monitor.resetComponentMetrics('MyComponent');
```

### compareComponents

比较两个组件的性能。

```javascript
compareComponents(componentA, componentB)
```

#### 参数

- `componentA` (String) - 组件 A 名称
- `componentB` (String) - 组件 B 名称

#### 返回值

返回比较结果对象，包含两个组件的指标和对比信息。

#### 示例

```javascript
const comparison = monitor.compareComponents('ComponentA', 'ComponentB');
console.log('组件比较:', comparison);
```

### getAllMetrics

获取所有组件指标。

```javascript
getAllMetrics()
```

#### 返回值

返回所有组件的指标对象。

#### 示例

```javascript
const allMetrics = monitor.getAllMetrics();
console.log('所有组件指标:', allMetrics);
```

### getOptimizationSuggestions

获取优化建议。

```javascript
getOptimizationSuggestions(componentName)
```

#### 参数

- `componentName` (String) - 组件名称（可选）

#### 返回值

返回优化建议数组。如果指定组件名称，则返回该组件的建议；否则返回所有建议。

#### 示例

```javascript
// 获取特定组件的建议
const suggestions = monitor.getOptimizationSuggestions('MyComponent');
console.log('优化建议:', suggestions);

// 获取所有建议
const allSuggestions = monitor.getOptimizationSuggestions();
console.log('所有优化建议:', allSuggestions);
```

### getPerformanceReport

获取性能报告。

```javascript
getPerformanceReport()
```

#### 返回值

返回性能报告对象，包含：
- `overview` (Object) - 概览信息
  - `totalComponents` (Number) - 总组件数
  - `totalRenders` (Number) - 总渲染次数
  - `averageRenderTime` (Number) - 平均渲染时间
  - `memoryUsage` (Number) - 内存使用量
  - `slowRenderCount` (Number) - 慢渲染次数
- `components` (Object) - 各组件指标
- `memory` (Object) - 内存分析
- `suggestions` (Array) - 优化建议

#### 示例

```javascript
const report = monitor.getPerformanceReport();
console.log('性能报告:', report);
```

### generatePerformanceReport

生成性能报告（公共方法）。

```javascript
generatePerformanceReport()
```

#### 返回值

返回详细的性能报告对象。

#### 示例

```javascript
const report = monitor.generatePerformanceReport();
console.log('性能报告:', report);
```

### reset

重置所有指标。

```javascript
reset()
```

#### 示例

```javascript
monitor.reset();
```

### exportData

导出监控数据。

```javascript
exportData()
```

#### 返回值

返回导出的数据对象，包含：
- `metrics` (Object) - 指标数据
- `renderHistory` (Object) - 渲染历史
- `memorySnapshots` (Array) - 内存快照
- `optimizationSuggestions` (Object) - 优化建议
- `exportTime` (String) - 导出时间

#### 示例

```javascript
const data = monitor.exportData();
console.log('导出数据:', data);
```

### exportPerformanceData

导出性能数据。

```javascript
exportPerformanceData()
```

#### 返回值

返回性能数据对象。

#### 示例

```javascript
const perfData = monitor.exportPerformanceData();
console.log('性能数据:', perfData);
```

### importPerformanceData

导入性能数据。

```javascript
importPerformanceData(data)
```

#### 参数

- `data` (Object) - 要导入的数据对象

#### 示例

```javascript
const data = {
  metrics: { /* ... */ },
  history: { /* ... */ }
};
monitor.importPerformanceData(data);
```

## 使用示例

### 基本使用

```javascript
import { ComponentPerformanceMonitor } from './performance-monitor.js';

const monitor = new ComponentPerformanceMonitor({
  enableMemoryTracking: true,
  enableRenderTracking: true,
  slowRenderThreshold: 16
});

// 开始监控
monitor.startMonitoring();

// 记录渲染
const startTime = performance.now();
component.render();
const duration = performance.now() - startTime;

monitor.recordRender('MyComponent', {
  duration,
  type: 'update',
  props: component.props,
  state: component.state
});

// 获取组件指标
const metrics = monitor.getComponentMetrics('MyComponent');
console.log('平均渲染时间:', metrics.averageRenderTime);
console.log('渲染次数:', metrics.renderCount);
```

### 性能报告

```javascript
// 生成性能报告
const report = monitor.generatePerformanceReport();

console.log('概览:', report.overview);
console.log('组件性能:', report.components);
console.log('内存分析:', report.memory);
console.log('优化建议:', report.suggestions);

// 检查优化建议
const suggestions = monitor.getOptimizationSuggestions();
if (suggestions.length > 0) {
  console.warn('发现性能问题:');
  suggestions.forEach(suggestion => {
    console.warn('- ' + suggestion);
  });
}
```

### 内存监控

```javascript
const monitor = new ComponentPerformanceMonitor({
  enableMemoryTracking: true,
  memoryThreshold: 100 * 1024 * 1024 // 100MB
});

monitor.startMonitoring();

// 定期记录内存使用
setInterval(() => {
  if (performance.memory) {
    monitor.recordMemoryUsage('MyComponent', {
      used: performance.memory.usedJSHeapSize
    });
  }
}, 5000);

// 检查内存泄漏风险
const metrics = monitor.getComponentMetrics('MyComponent');
if (metrics.performance.memoryLeakRisk) {
  console.warn('组件可能存在内存泄漏');
}
```

### 组件比较

```javascript
// 比较两个组件的性能
const comparison = monitor.compareComponents('ComponentA', 'ComponentB');

console.log('组件 A 平均渲染时间:', comparison.a.averageRenderTime);
console.log('组件 B 平均渲染时间:', comparison.b.averageRenderTime);
console.log('更快的组件:', comparison.comparison.faster);
console.log('性能差异:', comparison.comparison.difference + 'ms');
```

### 数据导出和导入

```javascript
// 导出数据
const data = monitor.exportData();
const jsonData = JSON.stringify(data, null, 2);

// 保存到文件
const blob = new Blob([jsonData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'performance-data.json';
a.click();

// 导入数据
fetch('performance-data.json')
  .then(response => response.json())
  .then(data => {
    monitor.importPerformanceData(data);
  });
```

## 最佳实践

1. **合理配置监控选项**：根据应用需求启用或禁用特定的监控功能，避免性能开销。

2. **定期检查性能报告**：定期生成和查看性能报告，及时发现性能问题。

3. **关注慢渲染**：重点关注平均渲染时间超过 16ms 的组件，这些组件可能影响用户体验。

4. **监控内存使用**：定期检查内存使用情况，及时发现内存泄漏风险。

5. **优化高频率渲染组件**：对于渲染频率高的组件，考虑使用虚拟化、缓存等技术进行优化。

6. **设置合理的阈值**：根据应用特性设置合理的性能阈值，避免过多的误报。

7. **定期清理历史数据**：定期清理历史数据，避免内存占用过大。

8. **结合其他工具**：结合 Chrome DevTools、Lighthouse 等工具进行全面的性能分析。

## 注意事项

- 性能监控本身会带来一定的性能开销，在生产环境中应谨慎使用。
- Performance Memory API 不是标准 API，只在部分浏览器中可用。
- 内存监控功能依赖于 `performance.memory` API，在不支持的浏览器中无法使用。
- 历史数据大小有限制，超过限制后会自动删除最早的记录。
- 优化分数是基于多个因素计算的，仅供参考，实际优化需要结合具体场景。
- 导入数据时，确保数据格式正确，否则可能导致监控器异常。
