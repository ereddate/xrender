import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";
import { xrenderSSGPlugin } from "./src/libs/ssg/vite-plugin.js";

export default defineConfig({
  resolve: {
    extensions: [".js", ".jsx"],
  },
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  plugins: [
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
    }),
    xrenderSSGPlugin({
      routes: [
        {
          path: '/',
          component: null,
          meta: {
            title: 'XRender - 静态站点生成示例',
            description: '使用XRender构建的高性能静态站点',
            keywords: 'xrender, ssg, static site generator',
            ogTitle: 'XRender SSG',
            ogDescription: '使用XRender构建的高性能静态站点'
          }
        },
        {
          path: '/about',
          component: null,
          meta: {
            title: '关于我们 - XRender',
            description: '了解更多关于XRender的信息',
            keywords: 'xrender, about',
            ogTitle: '关于 XRender',
            ogDescription: '了解更多关于XRender的信息'
          }
        }
      ],
      outDir: 'dist',
      templatePath: 'index.html',
      publicPath: '/',
      preloadData: true,
      concurrency: 5,
      minify: true
    })
  ],
});
