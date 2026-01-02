# XRender SSG 示例项目

这是一个使用 XRender SSG 构建的静态站点示例，展示了如何使用 XRender 的静态站点生成功能。

## 项目结构

```
ssg-demo/
├── index.html              # HTML 模板
├── ssg.config.js          # SSG 配置
├── components/            # 页面组件
│   ├── index.js
│   ├── home.js
│   ├── about.js
│   ├── features.js
│   └── contact.js
└── README.md             # 本文件
```

## 快速开始

### 1. 安装依赖

```bash
cd examples/ssg-demo
npm install
```

### 2. 配置 SSG

编辑 `ssg.config.js` 文件，配置路由和元数据：

```javascript
export const ssgRoutes = [
  {
    path: '/',
    component: Home,
    meta: {
      title: '首页',
      description: '页面描述',
      keywords: '关键词'
    }
  }
];
```

### 3. 构建静态站点

```bash
npm run build:ssg
```

### 4. 预览生成的站点

```bash
npm run preview
```

## 功能特性

本示例展示了以下功能：

- ✅ 多页面静态站点生成
- ✅ 页面级元数据配置
- ✅ SEO 优化（meta 标签、Open Graph、Twitter Card）
- ✅ 响应式设计
- ✅ 组件化开发
- ✅ 表单处理
- ✅ 样式管理

## 页面说明

### 首页 (/)
展示项目的主要特性和优势，包含功能卡片和导航。

### 关于我们 (/about)
介绍项目的使命、愿景和价值观。

### 功能特性 (/features)
详细展示 XRender SSG 的所有功能特性。

### 联系我们 (/contact)
提供联系方式和消息表单。

## 自定义配置

### 修改元数据

在 `ssg.config.js` 中修改每个路由的 `meta` 配置：

```javascript
{
  path: '/about',
  component: About,
  meta: {
    title: '关于我们',
    description: '页面描述',
    keywords: '关键词',
    ogTitle: 'OG 标题',
    ogDescription: 'OG 描述',
    twitterCard: 'summary_large_image'
  }
}
```

### 添加新页面

1. 在 `components/` 目录下创建新组件
2. 在 `components/index.js` 中导出
3. 在 `ssg.config.js` 中添加路由配置

### 修改样式

在 `index.html` 中的 `<style>` 标签中修改全局样式，或在组件中添加内联样式。

## 部署

生成的静态文件位于 `dist/` 目录，可以部署到任何静态托管服务：

- Vercel
- Netlify
- GitHub Pages
- AWS S3
- 阿里云 OSS
- 腾讯云 COS

### Vercel 部署

```bash
npm install -g vercel
vercel
```

### Netlify 部署

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages 部署

```bash
git subtree push --prefix dist origin gh-pages
```

## 性能优化

本示例已启用以下优化：

- ✅ HTML 压缩
- ✅ 资源压缩
- ✅ 代码分割
- ✅ 懒加载

## 故障排除

### 构建失败

确保所有组件都能正确导入，检查 `ssg.config.js` 配置是否正确。

### 样式未生效

检查 `index.html` 中的样式是否正确，确保组件中的内联样式语法正确。

### 路由未生成

确认路由配置中的 `path` 和 `component` 都已正确设置。

## 更多资源

- [XRender SSG 使用指南](../../docs/guides/ssg-guide.md)
- [XRender 官方文档](../../README.md)
- [API 文档](../../docs/api/)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
