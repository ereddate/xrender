import { Home, About, Features, Contact } from './components';
import { xrenderSSGPlugin } from '../../src/libs/ssg/vite-plugin.js';

export const ssgRoutes = [
  {
    path: '/',
    component: Home,
    meta: {
      title: '首页 - XRender SSG 示例',
      description: 'XRender SSG 是一个强大的静态站点生成器，可以将 XRender 应用预渲染为静态 HTML 文件，从而显著提升 SEO 性能和首屏加载速度。',
      keywords: 'xrender, ssg, 静态站点生成, seo, 性能优化',
      author: 'XRender Team',
      robots: 'index, follow',
      ogTitle: '首页 - XRender SSG',
      ogDescription: '使用 XRender 构建的高性能静态站点',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: '首页 - XRender SSG',
      twitterDescription: '使用 XRender 构建的高性能静态站点'
    }
  },
  {
    path: '/about',
    component: About,
    meta: {
      title: '关于我们 - XRender SSG',
      description: '了解更多关于 XRender SSG 的信息，我们的使命和愿景。',
      keywords: 'xrender, 关于我们, 团队, 使命',
      ogTitle: '关于我们 - XRender SSG',
      ogDescription: '了解更多关于 XRender SSG 的信息'
    }
  },
  {
    path: '/features',
    component: Features,
    meta: {
      title: '功能特性 - XRender SSG',
      description: '探索 XRender SSG 的强大功能，包括 SEO 优化、路由预渲染、元数据管理等。',
      keywords: 'xrender, 功能特性, seo, 预渲染',
      ogTitle: '功能特性 - XRender SSG',
      ogDescription: '探索 XRender SSG 的强大功能'
    }
  },
  {
    path: '/contact',
    component: Contact,
    meta: {
      title: '联系我们 - XRender SSG',
      description: '有任何问题或建议？请联系我们。',
      keywords: 'xrender, 联系我们, 支持, 反馈',
      ogTitle: '联系我们 - XRender SSG',
      ogDescription: '有任何问题或建议？请联系我们'
    }
  }
];

export const ssgConfig = {
  routes: ssgRoutes,
  outDir: 'dist',
  templatePath: 'index.html',
  publicPath: '/',
  preloadData: true,
  concurrency: 5,
  minify: true
};
