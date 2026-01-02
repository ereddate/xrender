# 高级插槽管理器 API

高级插槽管理器提供强大的插槽功能，支持动态插槽、条件插槽、作用域插槽和插槽缓存。

## 构造函数

```javascript
new AdvancedSlotManager()
```

### 示例

```javascript
import { AdvancedSlotManager } from './advanced-slot-manager';

const slotManager = new AdvancedSlotManager();
```

## 方法

### registerSlot

注册基础插槽。

```javascript
slotManager.registerSlot(name, config)
```

#### 参数

- `name` (String): 插槽名称
- `config` (Object): 配置对象
  - `props` (Object): 插槽属性，默认 {}
  - `events` (Object): 插槽事件，默认 {}
  - `conditional` (Function | Boolean): 条件函数或布尔值，默认 null
  - `fallback` (String | Function): 后备内容，默认 null
  - `cacheable` (Boolean): 是否可缓存，默认 true
  - `transition` (Object): 过渡动画配置，默认 null
  - `render` (Function): 渲染函数
  - `content` (Any): 插槽内容

#### 返回值

- (AdvancedSlotManager): 返回插槽管理器实例，支持链式调用

#### 示例

```javascript
slotManager.registerSlot('header', {
  props: { title: String },
  render: (props) => `<h1>${props.title}</h1>`
});
```

### registerDynamicSlot

注册动态插槽。

```javascript
slotManager.registerDynamicSlot(name, generator, options)
```

#### 参数

- `name` (String): 插槽名称
- `generator` (Function): 生成器函数
- `options` (Object): 选项，可选
  - `cacheable` (Boolean): 是否可缓存，默认 true
  - `debounce` (Number): 防抖延迟（毫秒），默认 0
  - `maxAge` (Number): 最大缓存时间（毫秒），默认 300000（5分钟）

#### 返回值

- (AdvancedSlotManager): 返回插槽管理器实例，支持链式调用

#### 示例

```javascript
slotManager.registerDynamicSlot('dynamic-content', (props) => {
  return `<div>动态内容: ${props.value}</div>`;
}, {
  cacheable: true,
  maxAge: 60000
});
```

### createScopedSlot

创建作用域插槽。

```javascript
slotManager.createScopedSlot(name, props, renderFn)
```

#### 参数

- `name` (String): 插槽名称
- `props` (Object): 插槽属性
- `renderFn` (Function): 渲染函数

#### 返回值

- (Object): 作用域插槽对象

#### 示例

```javascript
const scopedSlot = slotManager.createScopedSlot('item', {
  item: Object
}, (props) => {
  return `<div>${props.item.name}</div>`;
});
```

### createConditionalSlot

创建条件插槽。

```javascript
slotManager.createConditionalSlot(name, condition, trueSlot, falseSlot)
```

#### 参数

- `name` (String): 插槽名称
- `condition` (Function | Boolean | String): 条件
- `trueSlot` (Any): 条件为真时的插槽
- `falseSlot` (Any): 条件为假时的插槽，可选

#### 返回值

- (Object): 条件插槽对象

#### 示例

```javascript
slotManager.createConditionalSlot(
  'user-info',
  (context) => context.isLoggedIn,
  {
    render: (props) => `<div>欢迎, ${props.username}</div>`
  },
  {
    render: () => `<div>请登录</div>`
  }
);
```

### renderSlot

渲染插槽。

```javascript
slotManager.renderSlot(slotName, props, context)
```

#### 参数

- `slotName` (String): 插槽名称
- `props` (Object): 插槽属性，默认 {}
- `context` (Object): 上下文对象，默认 {}

#### 返回值

- (Any): 渲染结果

#### 示例

```javascript
const content = slotManager.renderSlot('header', {
  title: 'Hello World'
});
```

### renderSlots

渲染多个插槽。

```javascript
slotManager.renderSlots(slotNames, props, context)
```

#### 参数

- `slotNames` (Array): 插槽名称数组
- `props` (Object): 插槽属性，默认 {}
- `context` (Object): 上下文对象，默认 {}

#### 返回值

- (Array): 所有渲染结果的数组

#### 示例

```javascript
const results = slotManager.renderSlots(
  ['header', 'footer'],
  { title: 'Hello' }
);
```

### getSlot

获取插槽配置。

```javascript
slotManager.getSlot(slotName)
```

#### 参数

- `slotName` (String): 插槽名称

#### 返回值

- (Object | null): 插槽配置对象，如果不存在则返回 null

#### 示例

```javascript
const slot = slotManager.getSlot('header');
if (slot) {
  console.log(slot.props);
}
```

### getSlotInfo

获取插槽信息。

```javascript
slotManager.getSlotInfo(slotName)
```

#### 参数

- `slotName` (String): 插槽名称

#### 返回值

- (Object): 插槽信息对象
  - `exists` (Boolean): 插槽是否存在
  - `isDynamic` (Boolean): 是否为动态插槽
  - `isConditional` (Boolean): 是否为条件插槽
  - `isScoped` (Boolean): 是否为作用域插槽
  - `hasTransition` (Boolean): 是否有过渡动画
  - `eventCount` (Number): 事件数量

#### 示例

```javascript
const info = slotManager.getSlotInfo('header');
console.log('插槽类型:', info.isDynamic ? '动态' : '静态');
```

### setSlotProps

设置插槽属性。

```javascript
slotManager.setSlotProps(slotName, props)
```

#### 参数

- `slotName` (String): 插槽名称
- `props` (Object): 属性对象

#### 返回值

- (Boolean): 是否设置成功

#### 示例

```javascript
slotManager.setSlotProps('header', {
  title: 'New Title'
});
```

### getSlotProps

获取插槽属性。

```javascript
slotManager.getSlotProps(slotName)
```

#### 参数

- `slotName` (String): 插槽名称

#### 返回值

- (Object): 插槽属性对象

#### 示例

```javascript
const props = slotManager.getSlotProps('header');
console.log(props.title);
```

### onSlotEvent

监听插槽事件。

```javascript
slotManager.onSlotEvent(slotName, eventName, handler)
```

#### 参数

- `slotName` (String): 插槽名称
- `eventName` (String): 事件名称
- `handler` (Function): 事件处理函数

#### 示例

```javascript
slotManager.onSlotEvent('header', 'stateChange', (data) => {
  console.log('插槽状态变化:', data);
});
```

### emitSlotEvent

触发插槽事件。

```javascript
slotManager.emitSlotEvent(slotName, eventName, data)
```

#### 参数

- `slotName` (String): 插槽名称
- `eventName` (String): 事件名称
- `data` (Any): 事件数据

#### 示例

```javascript
slotManager.emitSlotEvent('header', 'stateChange', {
  type: 'rendered',
  props: { title: 'Hello' }
});
```

### triggerSlotEvent

触发插槽事件（别名）。

```javascript
slotManager.triggerSlotEvent(slotName, eventName, data)
```

#### 参数

- `slotName` (String): 插槽名称
- `eventName` (String): 事件名称
- `data` (Any): 事件数据

#### 示例

```javascript
slotManager.triggerSlotEvent('header', 'stateChange', {
  type: 'rendered'
});
```

### onSlotStateChange

监听插槽状态变化。

```javascript
slotManager.onSlotStateChange(slotName, handler)
```

#### 参数

- `slotName` (String): 插槽名称
- `handler` (Function): 状态变化处理函数

#### 示例

```javascript
slotManager.onSlotStateChange('header', (data) => {
  console.log('插槽状态:', data);
});
```

### addSlotTransition

添加插槽过渡动画。

```javascript
slotManager.addSlotTransition(slotName, transitionConfig)
```

#### 参数

- `slotName` (String): 插槽名称
- `transitionConfig` (Object): 过渡动画配置
  - `enterClass` (String): 进入动画类名，默认 'slot-enter'
  - `leaveClass` (String): 离开动画类名，默认 'slot-leave'
  - `duration` (Number): 动画持续时间（毫秒），默认 300

#### 示例

```javascript
slotManager.addSlotTransition('header', {
  enterClass: 'fade-in',
  leaveClass: 'fade-out',
  duration: 500
});
```

### validateSlotConfig

验证插槽配置。

```javascript
slotManager.validateSlotConfig(config)
```

#### 参数

- `config` (Object): 插槽配置对象

#### 返回值

- (Boolean): 配置是否有效

#### 示例

```javascript
const isValid = slotManager.validateSlotConfig({
  props: { title: String },
  render: (props) => `<h1>${props.title}</h1>`
});
console.log('配置有效:', isValid);
```

### clearCache

清除插槽缓存。

```javascript
slotManager.clearCache(slotName)
```

#### 参数

- `slotName` (String): 插槽名称，可选。如果不提供，则清除所有缓存

#### 示例

```javascript
// 清除特定插槽的缓存
slotManager.clearCache('header');

// 清除所有缓存
slotManager.clearCache();
```

### getAllSlotNames

获取所有插槽名称。

```javascript
slotManager.getAllSlotNames()
```

#### 返回值

- (Array): 插槽名称数组

#### 示例

```javascript
const names = slotManager.getAllSlotNames();
console.log('所有插槽:', names);
```

### getAllSlots

获取所有插槽的详细信息。

```javascript
slotManager.getAllSlots()
```

#### 返回值

- (Object): 插槽分类对象
  - `base` (Array): 基础插槽名称数组
  - `dynamic` (Array): 动态插槽名称数组
  - `conditional` (Array): 条件插槽名称数组
  - `scoped` (Array): 作用域插槽名称数组

#### 示例

```javascript
const slots = slotManager.getAllSlots();
console.log('基础插槽:', slots.base);
console.log('动态插槽:', slots.dynamic);
console.log('条件插槽:', slots.conditional);
console.log('作用域插槽:', slots.scoped);
```

### getRenderStats

获取渲染统计信息。

```javascript
slotManager.getRenderStats()
```

#### 返回值

- (Object): 统计信息对象
  - `totalRenders` (Number): 总渲染次数
  - `cacheHits` (Number): 缓存命中次数
  - `cacheMisses` (Number): 缓存未命中次数
  - `averageRenderTime` (Number): 平均渲染时间（毫秒）
  - `memoryUsage` (Number): 内存使用量（字节）

#### 示例

```javascript
const stats = slotManager.getRenderStats();
console.log(`总渲染次数: ${stats.totalRenders}`);
console.log(`缓存命中率: ${(stats.cacheHits / stats.totalRenders * 100).toFixed(2)}%`);
console.log(`平均渲染时间: ${stats.averageRenderTime}ms`);
```

### getStats

获取统计信息。

```javascript
slotManager.getStats()
```

#### 返回值

- (Object): 统计信息对象
  - `totalSlots` (Number): 总插槽数
  - `dynamicSlots` (Number): 动态插槽数
  - `conditionalSlots` (Number): 条件插槽数
  - `scopedSlots` (Number): 作用域插槽数
  - `cacheSize` (Number): 缓存大小
  - `cacheHitRate` (Number): 缓存命中率
  - `memoryUsage` (Number): 内存使用量（字节）

#### 示例

```javascript
const stats = slotManager.getStats();
console.log(`总插槽数: ${stats.totalSlots}`);
console.log(`动态插槽数: ${stats.dynamicSlots}`);
console.log(`条件插槽数: ${stats.conditionalSlots}`);
console.log(`作用域插槽数: ${stats.scopedSlots}`);
```

### destroy

销毁插槽管理器。

```javascript
slotManager.destroy()
```

#### 示例

```javascript
slotManager.destroy();
```

## 全局实例

```javascript
import { advancedSlotManager } from './advanced-slot-manager';

// 使用全局实例
advancedSlotManager.registerSlot('header', {
  render: (props) => `<h1>${props.title}</h1>`
});
```

## 便捷方法

### registerSlot

注册插槽。

```javascript
import { registerSlot } from './advanced-slot-manager';

registerSlot(name, config);
```

### registerDynamicSlot

注册动态插槽。

```javascript
import { registerDynamicSlot } from './advanced-slot-manager';

registerDynamicSlot(name, generator, options);
```

### renderSlot

渲染插槽。

```javascript
import { renderSlot } from './advanced-slot-manager';

const content = renderSlot(name, props, context);
```

### createScopedSlot

创建作用域插槽。

```javascript
import { createScopedSlot } from './advanced-slot-manager';

const scopedSlot = createScopedSlot(name, props, renderFn);
```

### createConditionalSlot

创建条件插槽。

```javascript
import { createConditionalSlot } from './advanced-slot-manager';

const conditionalSlot = createConditionalSlot(name, condition, trueSlot, falseSlot);
```

## 使用示例

### 基础插槽

```javascript
import { AdvancedSlotManager } from './advanced-slot-manager';

const slotManager = new AdvancedSlotManager();

// 注册基础插槽
slotManager.registerSlot('header', {
  props: { title: String },
  render: (props) => `<h1>${props.title}</h1>`
});

// 渲染插槽
const content = slotManager.renderSlot('header', {
  title: 'Hello World'
});
```

### 动态插槽

```javascript
// 注册动态插槽
slotManager.registerDynamicSlot('dynamic-content', (props) => {
  return `<div>动态内容: ${props.value}</div>`;
}, {
  cacheable: true,
  maxAge: 60000
});

// 渲染动态插槽
const content = slotManager.renderSlot('dynamic-content', {
  value: 'Hello'
});
```

### 作用域插槽

```javascript
// 创建作用域插槽
const scopedSlot = slotManager.createScopedSlot('item', {
  item: Object
}, (props) => {
  return `<div>${props.item.name}</div>`;
});

// 渲染作用域插槽
const content = slotManager.renderSlot('item', {
  item: { name: 'Item 1' }
});
```

### 条件插槽

```javascript
// 创建条件插槽
slotManager.createConditionalSlot(
  'user-info',
  (context) => context.isLoggedIn,
  {
    render: (props) => `<div>欢迎, ${props.username}</div>`
  },
  {
    render: () => `<div>请登录</div>`
  }
);

// 渲染条件插槽
const content = slotManager.renderSlot('user-info', {}, {
  isLoggedIn: true,
  username: 'John'
});
```

### 插槽事件

```javascript
// 监听插槽事件
slotManager.onSlotEvent('header', 'stateChange', (data) => {
  console.log('插槽状态变化:', data);
});

// 触发插槽事件
slotManager.emitSlotEvent('header', 'stateChange', {
  type: 'rendered',
  props: { title: 'Hello' }
});
```

### 插槽过渡动画

```javascript
// 添加过渡动画
slotManager.addSlotTransition('header', {
  enterClass: 'fade-in',
  leaveClass: 'fade-out',
  duration: 500
});
```

### 批量渲染

```javascript
// 渲染多个插槽
const results = slotManager.renderSlots(
  ['header', 'footer', 'sidebar'],
  { title: 'Hello' }
);
```

### 统计信息

```javascript
// 获取渲染统计
const renderStats = slotManager.getRenderStats();
console.log(`总渲染次数: ${renderStats.totalRenders}`);
console.log(`缓存命中率: ${(renderStats.cacheHits / renderStats.totalRenders * 100).toFixed(2)}%`);

// 获取总体统计
const stats = slotManager.getStats();
console.log(`总插槽数: ${stats.totalSlots}`);
console.log(`动态插槽数: ${stats.dynamicSlots}`);
```

### 清除缓存

```javascript
// 清除特定插槽的缓存
slotManager.clearCache('header');

// 清除所有缓存
slotManager.clearCache();
```
