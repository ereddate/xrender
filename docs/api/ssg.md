# XRender SSG API 文档

## 概述

XRender SSG 提供了完整的静态站点生成 API，包括插件、核心类和工具函数。

## 插件 API

### xrenderSSGPlugin(options)

主要的 Vite 插件，用于在构建过程中生成静态 HTML 文件。

#### 参数

- `options` (Object): 配置选项
  - `routes` (Array): 路由配置数组
  - `outDir` (String): 输出目录，默认 `'dist'`
  - `templatePath` (String): HTML 模板路径，默认 `'index.html'`
  - `publicPath` (String): 公共路径，默认 `'/'`
  - `preloadData` (Boolean): 是否预加载数据，默认 `true`
  - `concurrency` (Number): 并发数，默认 `5`
  - `minify` (Boolean): 是否压缩 HTML，默认 `false`

#### 返回值

返回 Vite 插件对象。

#### 示例

```javascript
import { xrenderSSGPlugin } from 'xrender/libs/ssg/vite-plugin.js';

export default defineConfig({
  plugins: [
    xrenderSSGPlugin({
      routes: [...],
      outDir: 'dist'
    })
  ]
});
```

### xrenderSSGCompiler(options)

编译器插件，用于处理构建后的 bundle。

#### 参数

- `options` (Object): 配置选项

#### 返回值

返回 Vite 插件对象。

#### 示例

```javascript
import { xrenderSSGCompiler } from 'xrender/libs/ssg/vite-plugin.js';

export default defineConfig({
  plugins: [
    xrenderSSGCompiler()
  ]
});
```

### xrenderSSGMiddleware(options)

开发服务器中间件，用于在开发环境中提供静态文件服务。

#### 参数

- `options` (Object): 配置选项

#### 返回值

返回 Vite 插件对象。

#### 示例

```javascript
import { xrenderSSGMiddleware } from 'xrender/libs/ssg/vite-plugin.js';

export default defineConfig({
  plugins: [
    xrenderSSGMiddleware()
  ]
});
```

## 核心类 API

### StaticSiteGenerator

静态站点生成器核心类。

#### 构造函数

```javascript
new StaticSiteGenerator(options)
```

#### 参数

- `options` (Object): 配置选项
  - `routes` (Array): 路由配置数组
  - `outDir` (String): 输出目录
  - `templatePath` (String): HTML 模板路径
  - `publicPath` (String): 公共路径
  - `htmlRenderer` (HTMLRenderer): HTML 渲染器实例

#### 方法

##### generate(routes?)

生成静态页面。

**参数:**
- `routes` (Array, 可选): 要生成的路由数组，默认使用配置中的路由

**返回值:** `Promise<Map>` - 返回生成的页面映射

**示例:**

```javascript
const generator = new StaticSiteGenerator({
  routes: [...],
  outDir: 'dist'
});

await generator.generate();
```

##### generateRoute(route)

生成单个路由的静态页面。

**参数:**
- `route` (Object): 路由配置对象

**返回值:** `Promise<String>` - 返回生成的 HTML 字符串

**示例:**

```javascript
const html = await generator.generateRoute({
  path: '/',
  component: Home,
  meta: { title: '首页' }
});
```

##### writeToFile()

将生成的页面写入文件系统。

**返回值:** `Promise<void>`

**示例:**

```javascript
await generator.generate();
await generator.writeToFile();
```

##### getGeneratedPages()

获取已生成的页面。

**返回值:** `Map` - 页面映射

**示例:**

```javascript
const pages = generator.getGeneratedPages();
console.log(pages.size);
```

##### clearCache()

清除缓存。

**返回值:** `void`

**示例:**

```javascript
generator.clearCache();
```

##### setOptions(options)

更新配置选项。

**参数:**
- `options` (Object): 新的配置选项

**返回值:** `void`

**示例:**

```javascript
generator.setOptions({
  outDir: 'build',
  minify: true
});
```

### RoutePreloader

路由预加载器，用于预加载路由数据。

#### 构造函数

```javascript
new RoutePreloader(options)
```

#### 参数

- `options` (Object): 配置选项
  - `routes` (Array): 路由配置数组
  - `preloadData` (Boolean): 是否预加载数据，默认 `true`
  - `concurrency` (Number): 并发数，默认 `5`

#### 方法

##### preloadRoutes(routes?)

预加载路由数据。

**参数:**
- `routes` (Array, 可选): 要预加载的路由数组

**返回值:** `Promise<Map>` - 返回加载的路由数据映射

**示例:**

```javascript
const preloader = new RoutePreloader({
  routes: [...],
  preloadData: true
});

await preloader.preloadRoutes();
```

##### preloadRoute(route)

预加载单个路由的数据。

**参数:**
- `route` (Object): 路由配置对象

**返回值:** `Promise<Object>` - 返回路由数据

**示例:**

```javascript
const routeData = await preloader.preloadRoute({
  path: '/about',
  component: About
});
```

##### getRouteData(path)

获取指定路径的路由数据。

**参数:**
- `path` (String): 路由路径

**返回值:** `Object|undefined` - 路由数据对象

**示例:**

```javascript
const data = preloader.getRouteData('/about');
console.log(data);
```

##### getAllRouteData()

获取所有路由数据。

**返回值:** `Map` - 路由数据映射

**示例:**

```javascript
const allData = preloader.getAllRouteData();
```

##### clearCache()

清除缓存。

**返回值:** `void`

**示例:**

```javascript
preloader.clearCache();
```

### HTMLRenderer

HTML 渲染器，用于将组件渲染为 HTML 字符串。

#### 构造函数

```javascript
new HTMLRenderer(options)
```

#### 参数

- `options` (Object): 配置选项
  - `templatePath` (String): HTML 模板路径
  - `publicPath` (String): 公共路径，默认 `'/'`
  - `minify` (Boolean): 是否压缩 HTML，默认 `false`

#### 方法

##### loadTemplate()

加载 HTML 模板。

**返回值:** `Promise<String>` - 返回模板字符串

**示例:**

```javascript
const template = await renderer.loadTemplate();
```

##### renderRoute(route)

渲染路由为完整的 HTML。

**参数:**
- `route` (Object): 路由配置对象

**返回值:** `Promise<String>` - 返回完整的 HTML 字符串

**示例:**

```javascript
const html = await renderer.renderRoute({
  path: '/',
  component: Home,
  meta: { title: '首页' }
});
```

##### renderComponent(component, route)

渲染组件为 HTML。

**参数:**
- `component` (Object): 组件对象
- `route` (Object): 路由配置对象

**返回值:** `Promise<String>` - 返回组件 HTML 字符串

**示例:**

```javascript
const componentHTML = await renderer.renderComponent(Home, route);
```

##### setTemplate(template)

设置 HTML 模板。

**参数:**
- `template` (String): HTML 模板字符串

**返回值:** `void`

**示例:**

```javascript
renderer.setTemplate('<html><head></head><body><div id="app"></div></body></html>');
```

##### setOptions(options)

更新配置选项。

**参数:**
- `options` (Object): 新的配置选项

**返回值:** `void`

**示例:**

```javascript
renderer.setOptions({
  minify: true,
  publicPath: '/app'
});
```

### MetaInjector

元数据注入器，用于生成 SEO 元数据。

#### 构造函数

```javascript
new MetaInjector(options)
```

#### 参数

- `options` (Object): 配置选项
  - `defaultMeta` (Object): 默认元数据配置

#### 方法

##### injectMeta(meta, routePath?)

注入元数据。

**参数:**
- `meta` (Object): 元数据对象
- `routePath` (String, 可选): 路由路径

**返回值:** `String` - 返回元数据 HTML 字符串

**示例:**

```javascript
const injector = new MetaInjector();

const metaHTML = injector.injectMeta({
  title: '首页',
  description: '这是首页描述'
}, '/');
```

##### generateStructuredData(data, type?)

生成结构化数据。

**参数:**
- `data` (Object): 结构化数据对象
- `type` (String, 可选): 数据类型，默认 `'WebPage'`

**返回值:** `String` - 返回结构化数据 JSON-LD 字符串

**示例:**

```javascript
const structuredData = injector.generateStructuredData({
  '@type': 'Organization',
  name: 'My Company'
}, 'Organization');
```

##### generateBreadcrumbList(items)

生成面包屑导航结构化数据。

**参数:**
- `items` (Array): 面包屑项目数组

**返回值:** `String` - 返回结构化数据 JSON-LD 字符串

**示例:**

```javascript
const breadcrumb = injector.generateBreadcrumbList([
  { name: 'Home', url: '/' },
  { name: 'About', url: '/about' }
]);
```

##### generateOrganizationData(organization)

生成组织信息结构化数据。

**参数:**
- `organization` (Object): 组织信息对象

**返回值:** `String` - 返回结构化数据 JSON-LD 字符串

**示例:**

```javascript
const orgData = injector.generateOrganizationData({
  name: 'My Company',
  url: 'https://example.com',
  logo: 'https://example.com/logo.png'
});
```

##### generateArticleData(article)

生成文章信息结构化数据。

**参数:**
- `article` (Object): 文章信息对象

**返回值:** `String` - 返回结构化数据 JSON-LD 字符串

**示例:**

```javascript
const articleData = injector.generateArticleData({
  headline: 'Article Title',
  image: 'https://example.com/article.jpg',
  author: { '@type': 'Person', name: 'Author' },
  datePublished: '2024-01-01'
});
```

##### setDefaultMeta(meta)

设置默认元数据。

**参数:**
- `meta` (Object): 默认元数据对象

**返回值:** `void`

**示例:**

```javascript
injector.setDefaultMeta({
  title: 'Default Title',
  description: 'Default Description'
});
```

## 工具函数 API

### initSSG(XRender)

初始化 SSG 功能。

**参数:**
- `XRender` (Object): XRender 实例

**返回值:** `Object` - 返回 SSG 模块对象

**示例:**

```javascript
import { initSSG } from 'xrender/libs/ssg/index.js';

const ssg = initSSG(XRender);
```

## 类型定义

### RouteConfig

路由配置对象类型。

```typescript
interface RouteConfig {
  path: string;           // 路由路径
  component: Component;    // 组件对象
  meta?: MetaConfig;      // 元数据配置
}
```

### MetaConfig

元数据配置对象类型。

```typescript
interface MetaConfig {
  title?: string;                    // 页面标题
  description?: string;              // 页面描述
  keywords?: string;                  // 关键词
  author?: string;                    // 作者
  robots?: string;                   // 爬虫指令
  ogTitle?: string;                   // OG 标题
  ogDescription?: string;             // OG 描述
  ogImage?: string;                  // OG 图片
  ogUrl?: string;                    // OG URL
  ogType?: string;                   // OG 类型
  twitterCard?: string;              // Twitter Card 类型
  twitterTitle?: string;              // Twitter 标题
  twitterDescription?: string;        // Twitter 描述
  twitterImage?: string;             // Twitter 图片
  canonical?: string;                // 规范链接
  favicon?: string;                  // 网站图标
  manifest?: string;                 // PWA manifest
  themeColor?: string;               // 主题颜色
  customMeta?: CustomMeta[];         // 自定义元数据
}
```

### CustomMeta

自定义元数据对象类型。

```typescript
interface CustomMeta {
  name?: string;          // meta name
  property?: string;      // meta property
  httpEquiv?: string;     // meta http-equiv
  content: string;        // meta content
}
```

## 错误处理

所有异步方法都可能抛出错误，建议使用 try-catch 进行错误处理。

```javascript
try {
  await generator.generate();
} catch (error) {
  console.error('生成失败:', error);
}
```

## 最佳实践

1. **并发控制**: 根据服务器性能调整 `concurrency` 参数
2. **缓存管理**: 定期调用 `clearCache()` 清除缓存
3. **错误处理**: 始终使用 try-catch 处理异步操作
4. **元数据优化**: 为每个路由配置合适的元数据
5. **性能优化**: 启用 `minify` 选项减小文件体积

## 相关文档

- [SSG 使用指南](../guides/ssg-guide.md)
- [XRender 主文档](../../README.md)
