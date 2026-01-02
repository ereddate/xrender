# XRender 样式库

XRender 样式库是一套为 XRenderSS 样式工具 框架设计的 SC集，提供常用的变量、混合宏和组件样式，帮助开发者快速构建美观的界面。

## 目录结构

```
styles/
├── _variables.scss     # 变量定义
├── _mixins.scss        # 混合宏
├── _base.scss          # 基础样式
├── _components.scss    # 组件样式
├── _utilities.scss     # 实用工具类
├── transition.scss     # 过渡效果
├── index.scss          # 主入口文件
└── README.md           # 说明文档
```

## 使用方法

### 在项目中引入

```scss
// 导入全部样式
@import "@/libs/styles/index";

// 或者只导入需要的部分
@import "@/libs/styles/variables";
@import "@/libs/styles/mixins";
@import "@/libs/styles/base";
@import "@/libs/styles/components";
@import "@/libs/styles/utilities";
```

### 使用变量

```scss
// 使用颜色变量
.my-component {
  color: $primary-color;
  background-color: $light-color;
}

// 使用间距变量
.my-container {
  padding: $spacing-lg;
  margin-bottom: $spacing-xl;
}

// 使用字体大小变量
.my-title {
  font-size: $font-size-xl;
}
```

### 使用混合宏

```scss
// 使用媒体查询混合宏
.my-responsive-element {
  @include media-breakpoint-up(md) {
    display: block;
  }
  
  @include media-breakpoint-down(sm) {
    display: none;
  }
}

// 使用文本省略混合宏
.my-text {
  @include text-truncate;
}

// 使用按钮样式混合宏
.my-button {
  @include button-variant($white, $primary-color, $primary-color);
}
```

### 使用组件样式

```html
<!-- 按钮 -->
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-secondary">次要按钮</button>

<!-- 卡片 -->
<div class="card">
  <div class="card-header">
    <h3>卡片标题</h3>
  </div>
  <div class="card-body">
    <p>卡片内容</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">操作</button>
  </div>
</div>

<!-- 表格 -->
<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>#</th>
      <th>姓名</th>
      <th>年龄</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>张三</td>
      <td>25</td>
    </tr>
    <tr>
      <td>2</td>
      <td>李四</td>
      <td>30</td>
    </tr>
  </tbody>
</table>
```

### 使用实用工具类

```html
<!-- 间距 -->
<div class="mt-3 mb-4 p-2">有间距的元素</div>

<!-- 文本 -->
<div class="text-center text-primary">居中的蓝色文本</div>

<!-- 布局 -->
<div class="d-flex justify-content-between align-items-center">
  <div>左侧内容</div>
  <div>右侧内容</div>
</div>

<!-- 尺寸 -->
<div class="w-50 h-25">宽度50%，高度25%</div>
```

## 样式特性

- 变量化：所有常用值都定义为变量，方便统一修改
- 模块化：样式按功能分离，便于维护
- 响应式：提供多种断点的响应式样式
- 可扩展：使用 SCSS 混合宏，可轻松扩展样式
- 轻量级：仅包含常用样式，保持轻量特性

## 兼容性

XRender 样式库支持现代浏览器，包括：
- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 更新日志

### v1.0.0
- 初始版本
- 添加变量、混合宏、基础样式和组件样式