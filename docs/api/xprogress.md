# XProgress API 文档

## 概述

XProgress 是一个类似 nprogress 的轻量级进度条组件，用于在页面加载、AJAX 请求等场景中显示进度。它支持插件化集成，可以轻松集成到 XRender 应用中。

## 导出内容

### 核心类

#### `XProgress`

XProgress 核心类，提供完整的进度条功能。

**示例:**

```javascript
import { XProgress } from 'xrender/xprogress/entry.js';

const progress = new XProgress({
  minimum: 0.08,
  trickleSpeed: 200,
  showSpinner: true
});

progress.start();
progress.set(0.5);
progress.done();
```

### 插件

#### `xProgressPlugin`

XProgress 插件，用于将 XProgress 集成到 XRender 应用中。

**示例:**

```javascript
import XRender from 'xrender';
import { xProgressPlugin } from 'xrender/xprogress/entry.js';

XRender.use(xProgressPlugin, {
  minimum: 0.08,
  trickleSpeed: 200,
  showSpinner: true
});
```

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `minimum` | Number | 0.08 | 进度条最小值（0-1） |
| `easing` | String | 'linear' | CSS 过渡效果 |
| `speed` | Number | 200 | 动画速度（毫秒） |
| `trickle` | Boolean | true | 是否启用自动增长 |
| `trickleSpeed` | Number | 200 | 自动增长速度（毫秒） |
| `showSpinner` | Boolean | true | 是否显示加载动画 |
| `barSelector` | String | '[role="bar"]' | 进度条选择器 |
| `parent` | String | 'body' | 父容器选择器 |
| `template` | String | - | 自定义 HTML 模板 |

## API 方法

### 实例方法

#### `configure(options)`
更新配置选项。

**参数:**
- `options` (Object): 配置选项

**示例:**

```javascript
progress.configure({
  minimum: 0.1,
  speed: 300
});
```

#### `set(n)`
设置进度值（0-1）。

**参数:**
- `n` (Number): 进度值（0-1）

**示例:**

```javascript
progress.set(0.5); // 设置为 50%
```

#### `start()`
开始显示进度条。

**示例:**

```javascript
progress.start();
```

#### `done(force)`
完成进度条并移除。

**参数:**
- `force` (Boolean): 是否强制完成（可选）

**示例:**

```javascript
progress.done(); // 正常完成
progress.done(true); // 强制完成
```

#### `inc(amount)`
增加进度值。

**参数:**
- `amount` (Number): 增加的值（可选，默认为随机值）

**示例:**

```javascript
progress.inc(0.1); // 增加 10%
progress.inc(); // 自动增加随机值
```

#### `remove()`
移除进度条。

**示例:**

```javascript
progress.remove();
```

#### `isStarted()`
检查进度条是否已启动。

**返回值:** (Boolean) 是否已启动

**示例:**

```javascript
if (progress.isStarted()) {
  console.log('进度条正在运行');
}
```

#### `reset()`
重置进度条状态。

**示例:**

```javascript
progress.reset();
```

### 静态方法

#### `XProgress.create(options)`
创建 XProgress 实例的静态方法。

**参数:**
- `options` (Object): 配置选项

**返回值:** (XProgress) XProgress 实例

**示例:**

```javascript
const progress = XProgress.create({
  minimum: 0.08,
  trickleSpeed: 200
});
```

### 插件方法

安装插件后，可以通过 `XRender.progress` 访问以下方法：

```javascript
XRender.progress.start();
XRender.progress.set(0.5);
XRender.progress.inc(0.1);
XRender.progress.done();
XRender.progress.remove();
XRender.progress.configure({ minimum: 0.1 });
XRender.progress.isStarted();
XRender.progress.reset();
```

## 完整示例

### 1. 基本使用

```javascript
import { XProgress } from 'xrender/xprogress/entry.js';

const progress = new XProgress({
  minimum: 0.08,
  trickleSpeed: 200,
  showSpinner: true
});

progress.start();
setTimeout(() => progress.set(0.5), 1000);
setTimeout(() => progress.done(), 2000);
```

### 2. 使用插件

```javascript
import XRender from 'xrender';
import { xProgressPlugin } from 'xrender/xprogress/entry.js';

XRender.use(xProgressPlugin, {
  minimum: 0.08,
  trickleSpeed: 200,
  showSpinner: true
});

XRender.progress.start();
XRender.progress.set(0.5);
XRender.progress.done();
```

### 3. 页面加载进度

```javascript
import { XProgress } from 'xrender/xprogress/entry.js';

const progress = new XProgress();

window.addEventListener('load', () => {
  progress.done();
});

progress.start();
```

### 4. AJAX 请求进度

```javascript
import { XProgress } from 'xrender/xprogress/entry.js';

const progress = new XProgress();

async function fetchData() {
  progress.start();
  
  try {
    const response = await fetch('/api/data');
    progress.set(0.5);
    
    const data = await response.json();
    progress.set(0.8);
    
    return data;
  } finally {
    progress.done();
  }
}
```

### 5. 路由切换进度（使用插件）

```javascript
import XRender from 'xrender';
import { xProgressPlugin } from 'xrender/xprogress/entry.js';

XRender.use(xProgressPlugin);

XRender.beforeEach((to, from, next) => {
  XRender.progress.start();
  next();
});

XRender.afterEach(() => {
  XRender.progress.done();
});
```

### 6. 文件上传进度

```javascript
import { XProgress } from 'xrender/xprogress/entry.js';

const progress = new XProgress();

function uploadFile(file) {
  progress.start();
  
  const xhr = new XMLHttpRequest();
  
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = e.loaded / e.total;
      progress.set(percent);
    }
  };
  
  xhr.onload = () => {
    progress.done();
  };
  
  xhr.onerror = () => {
    progress.remove();
  };
  
  xhr.open('POST', '/upload');
  xhr.send(file);
}
```

### 7. 结合 Fetch 拦截器

```javascript
import XRender from 'xrender';
import { xProgressPlugin } from 'xrender/xprogress/entry.js';

XRender.use(xProgressPlugin);

const originalFetch = window.fetch;
window.fetch = function(...args) {
  XRender.progress.start();
  
  return originalFetch.apply(this, args)
    .finally(() => {
      XRender.progress.done();
    });
};
```

## 样式定制

### 基础样式

```scss
// 自定义颜色
.xprogress-bar {
  background-color: #ff0000;
}

// 自定义高度
.xprogress {
  height: 5px;
}
```

### 预设样式类

- `.xprogress-striped` - 条纹效果
- `.xprogress-animated` - 脉冲动画
- `.xprogress-bottom` - 底部显示
- `.xprogress-vertical` - 垂直显示
- `.xprogress-vertical-right` - 右侧垂直显示
- `.xprogress-no-spinner` - 隐藏加载动画
- `.xprogress-thick` - 加粗进度条
- `.xprogress-thin` - 细进度条

### 自定义样式

```javascript
const progress = new XProgress({
  template: `
    <div class="xprogress xprogress-custom">
      <div class="xprogress-bar" role="bar"></div>
      <div class="xprogress-spinner">
        <div class="xprogress-spinner-icon"></div>
      </div>
    </div>
  `
});
```

## 插件系统优势

使用插件模式的优势：

1. **按需加载** - 只在需要时才加载 XProgress
2. **解耦合** - 不污染核心代码
3. **可配置** - 安装时可以传入配置选项
4. **全局访问** - 通过 `XRender.progress` 全局访问
5. **统一管理** - 与其他插件（如 Store、Router）使用相同的模式

## 注意事项

1. **自动增长**：默认启用 `trickle`，进度条会自动增长以保持视觉连续性。
2. **最小值**：`minimum` 选项确保进度条不会完全消失，提供更好的用户体验。
3. **清理**：记得在操作完成后调用 `done()` 或 `remove()` 清理进度条。
4. **性能**：在频繁操作中复用同一个进度条实例，避免创建多个实例。
5. **插件安装**：插件只需安装一次，后续可以直接使用全局方法。

## 浏览器兼容性

- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- IE11: ⚠️ 需要添加 polyfill

## 相关文档

- [快速开始指南](../guides/getting-started.md)
- [最佳实践](../guides/best-practices.md)
- [架构设计文档](../architecture.md)
