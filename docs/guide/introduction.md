---
title: XRender 简介
description: 了解 XRender 框架的基本概念和特性
---

# XRender 简介

XRender 是一个轻量级的前端框架，专注于组件化开发和数据驱动视图渲染。它提供了类似 Vue 的语法和功能，支持数据绑定、指令、生命周期钩子等特性。

## 核心特性

- **轻量级**：核心库体积小，性能优异
- **组件化**：支持创建和复用组件
- **响应式**：强大的响应式系统，支持数据监听和计算属性
- **指令系统**：提供丰富的指令，如 `v-if`、`v-for`、`v-show`、`v-memo` 等
- **生命周期**：完整的生命周期钩子
- **插件系统**：支持通过插件扩展功能
- **SSR/SSG**：支持服务器端渲染和静态站点生成

## 设计理念

XRender 的设计理念是简单、高效、可扩展。它借鉴了 Vue 的优秀设计，同时保持了自己的特色：

1. **简单易用**：API 设计简洁，学习曲线平缓
2. **高性能**：优化的渲染机制，确保流畅的用户体验
3. **模块化**：核心框架与功能模块完全解耦，支持按需引入
4. **可扩展**：强大的插件系统，满足各种定制需求

## 适用场景

XRender 适用于以下场景：

- 中小型 Web 应用
- 单页应用（SPA）
- 需要良好 SEO 的静态站点
- 组件库开发
- 快速原型开发

## 快速体验

```javascript
import 'xrender';

const App = $.component('App', {
  data() {
    return {
      message: 'Hello, XRender!'
    };
  },
  render(createElem) {
    return createElem('div', {}, this.data.message);
  }
});

$.createApp({ App }).$mount('#app');
```

## 下一步

- [快速开始](/guide/quick-start) - 快速上手 XRender
- [安装指南](/guide/installation) - 详细的安装说明
- [核心概念](/guide/components) - 了解组件、响应式等核心概念
