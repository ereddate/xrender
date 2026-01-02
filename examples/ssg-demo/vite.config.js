import { defineConfig } from "vite";
import { xrenderSSGPlugin } from "../../src/libs/ssg/vite-plugin.js";
import { ssgConfig } from "./ssg.config.js";

export default defineConfig({
  root: '.',
  resolve: {
    extensions: [".js", ".jsx"],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
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
    xrenderSSGPlugin(ssgConfig)
  ],
});
