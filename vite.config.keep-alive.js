import { defineConfig } from "vite";
import { versionPlugin } from "./vite.plugins.js";

export default defineConfig({
  resolve: {
    extensions: [".js", ".jsx"],
  },
  build: {
    lib: {
      entry: "src/libs/keep-alive.js",
      name: "XRenderKeepAlive",
      fileName: (format) => `xrender-keep-alive.${format}.js`,
      formats: ["es", "umd"]
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  plugins: [
    versionPlugin("keep-alive")
  ],
});
