import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";

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
      algorithm: "gzip", // 使用 gzip 压缩
      ext: ".gz", // 生成 .gz 文件
    }),
  ],
});
