# XRender 静态站点生成 (SSG) 使用指南

XRender SSG 是一个强大的静态站点生成器，可以将 XRender 应用预渲染为静态 HTML 文件，从而显著提升 SEO 性能和首屏加载速度。

## 特性

- **SEO 优化**：生成完整的 HTML 页面，包含所有元数据和结构化数据
- **路由预渲染**：自动为所有路由生成静态 HTML 文件
- **元数据管理**：灵活的页面级元数据配置
- **结构化数据**：支持生成 Schema.org 结构化数据
- **零配置**：开箱即用，支持自定义配置
- **Vite 插件**：无缝集成到 Vite 构建流程
- **增量构建**：支持增量生成，提高构建效率

## 快速开始

### 1. 安装

```bash
npm install xrender
```

### 2. 配置 Vite

在 `vite.config.js` 中引入并配置 SSG 插件：

```javascript
import { defineConfig } from "vite";
import { xrenderSSGPlugin } from "./src/libs/ssg/vite-plugin.js";

export default defineConfig({
  plugins: [
    xrenderSSGPlugin({
      routes: [
        {
          path: '/',
          component: Home,
          meta: {
            title: '首页',
            description: '这是首页描述'
          }
        },
        {
          path: '/about',
          component: About,
          meta: {
            title: '关于我们',
            description: '关于我们页面'
          }
        }
      ],
      outDir: 'dist',
      templatePath: 'index.html'
    })
  ]
});
```

### 3. 构建

```bash
npm run build:ssg
```

构建完成后，静态 HTML 文件将生成在 `dist` 目录中。

## 配置选项

### 插件配置

```javascript
xrenderSSGPlugin({
  // 路由配置
  routes: [],

  // 输出目录
  outDir: 'dist',

  // HTML 模板路径
  templatePath: 'index.html',

  // 公共路径
  publicPath: '/',

  // 是否预加载数据
  preloadData: true,

  // 并发数
  concurrency: 5,

  // 是否压缩 HTML
  minify: false
})
```

### 路由配置

每个路由可以配置以下选项：

```javascript
{
  path: '/about',
  component: About,
  meta: {
    // 基础元数据
    title: '页面标题',
    description: '页面描述',
    keywords: '关键词1, 关键词2',
    author: '作者',
    robots: 'index, follow',

    // Open Graph
    ogTitle: 'OG 标题',
    ogDescription: 'OG 描述',
    ogImage: '/og-image.jpg',
    ogUrl: 'https://example.com/about',
    ogType: 'website',

    // Twitter Card
    twitterCard: 'summary_large_image',
    twitterTitle: 'Twitter 标题',
    twitterDescription: 'Twitter 描述',
    twitterImage: '/twitter-image.jpg',

    // 其他
    canonical: 'https://example.com/about',
    favicon: '/favicon.ico',
    themeColor: '#ffffff',

    // 自定义元数据
    customMeta: [
      { name: 'custom-name', content: 'custom-value' },
      { property: 'og:custom', content: 'custom-value' }
    ]
  }
}
```

## 高级用法

### 1. 使用 SSG 模块

```javascript
import { initSSG, StaticSiteGenerator, HTMLRenderer, MetaInjector } from 'xrender/ssg/latest/xrender-ssg.es.js';

// 初始化 SSG
const ssg = initSSG(XRender);

// 创建静态站点生成器
const generator = new StaticSiteGenerator({
  routes: [...],
  outDir: 'dist',
  htmlRenderer: new HTMLRenderer()
});

// 生成静态页面
await generator.generate();
await generator.writeToFile();
```

### 2. 路由数据预加载

```javascript
import { RoutePreloader } from 'xrender/ssg/latest/xrender-ssg.es.js';

const preloader = new RoutePreloader({
  routes: [...],
  preloadData: true
});

// 预加载路由数据
await preloader.preloadRoutes();
```

### 3. 自定义 HTML 渲染

```javascript
import { HTMLRenderer } from 'xrender/ssg/latest/xrender-ssg.es.js';

const renderer = new HTMLRenderer({
  templatePath: 'index.html',
  minify: true
});

// 自定义渲染逻辑
const html = await renderer.renderRoute(route);
```

### 4. 元数据注入

```javascript
import { MetaInjector } from 'xrender/ssg/latest/xrender-ssg.es.js';

const injector = new MetaInjector();

// 注入元数据
const metaHTML = injector.injectMeta(meta, routePath);

// 生成结构化数据
const structuredData = injector.generateStructuredData({
  '@type': 'Organization',
  name: 'My Company'
});

const breadcrumb = injector.generateBreadcrumbList([
  { name: 'Home', url: '/' },
  { name: 'About', url: '/about' }
]);
```

## 组件数据预加载

### 使用 asyncData

```javascript
const About = $.component('About', {
  async asyncData() {
    const response = await fetch('/api/about');
    return await response.json();
  },

  data() {
    return {
      info: this.$ssrData || {}
    };
  },

  render(createElem) {
    return createElem('div', {}, this.data.info.title);
  }
});
```

### 使用 created 钩子

```javascript
const About = $.component('About', {
  data() {
    return {
      info: {}
    };
  },

  async created() {
    const response = await fetch('/api/about');
    this.data.info = await response.json();
  },

  render(createElem) {
    return createElem('div', {}, this.data.info.title);
  }
});
```

## 结构化数据

### 组织信息

```javascript
const meta = {
  structuredData: {
    enabled: true,
    organization: {
      name: 'My Company',
      url: 'https://example.com',
      logo: 'https://example.com/logo.png',
      description: 'Company description',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-234-567-8900',
        contactType: 'customer service'
      }
    }
  }
};
```

### 文章信息

```javascript
const meta = {
  structuredData: {
    enabled: true,
    article: {
      headline: 'Article Title',
      image: 'https://example.com/article.jpg',
      author: {
        '@type': 'Person',
        name: 'Author Name'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Publisher Name',
        logo: {
          '@type': 'ImageObject',
          url: 'https://example.com/logo.png'
        }
      },
      datePublished: '2024-01-01',
      dateModified: '2024-01-02',
      description: 'Article description'
    }
  }
};
```

## 部署

### 静态托管服务

生成的静态文件可以部署到任何静态托管服务：

- **Vercel**: 直接上传 `dist` 目录
- **Netlify**: 直接上传 `dist` 目录
- **GitHub Pages**: 将 `dist` 目录内容推送到 `gh-pages` 分支
- **AWS S3**: 上传到 S3 存储桶并配置静态网站托管

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name example.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

## 最佳实践

### 1. 路由组织

```javascript
const routes = [
  {
    path: '/',
    component: Home,
    meta: { title: '首页' }
  },
  {
    path: '/about',
    component: About,
    meta: { title: '关于我们' }
  },
  {
    path: '/blog',
    component: BlogList,
    meta: { title: '博客' }
  },
  {
    path: '/blog/:id',
    component: BlogPost,
    meta: { title: '博客详情' }
  }
];
```

### 2. 动态路由处理

```javascript
const blogRoutes = await fetch('/api/blogs').then(res => res.json());

const routes = [
  ...blogRoutes.map(blog => ({
    path: `/blog/${blog.id}`,
    component: BlogPost,
    meta: {
      title: blog.title,
      description: blog.excerpt
    }
  }))
];
```

### 3. 图片优化

```javascript
const meta = {
  ogImage: '/og-image-1200x630.jpg',
  twitterImage: '/twitter-image-1200x600.jpg'
};
```

### 4. 性能优化

```javascript
xrenderSSGPlugin({
  routes,
  outDir: 'dist',
  minify: true,
  preloadData: true,
  concurrency: 10
});
```

## 故障排除

### 问题：构建失败

**解决方案**：检查路由配置是否正确，确保所有组件都能正常导入。

### 问题：元数据未生效

**解决方案**：确认 `meta` 对象格式正确，检查模板中是否有 `</head>` 标签。

### 问题：动态路由未生成

**解决方案**：确保动态路由在构建时已解析，使用异步方式获取路由列表。

## 示例项目

完整示例项目请参考 `examples/ssg-demo` 目录。

## API 文档

详细的 API 文档请参考 [API 文档](../api/ssg.md)。

## 贡献

欢迎贡献代码和改进建议！

## 许可证

MIT License
