import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";
import fs from 'fs';
import path from 'path';
import babel from '@rollup/plugin-babel';

const getVersion = () => {
  try {
    const versionsPath = path.resolve(__dirname, 'src/libs/versions.json');
    const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'));
    return versions.xrender.version;
  } catch (error) {
    console.warn('Failed to read version, using 0.0.0');
    return '0.0.0';
  }
};

const version = getVersion();

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
      input: {
        'xrender-sfc': "./src/libs/sfc/index.js",
      },
      output: {
        entryFileNames: `xrender-sfc-${version}.[format].js`,
        chunkFileNames: `xrender-sfc-${version}.[name].js`,
        assetFileNames: `xrender-sfc-${version}.[ext]`,
        dir: `./dist/libs/sfc/${version}`,
        format: "es",
        globals: {
          // 声明需要外部化的全局变量
          './core.js': 'XRender'
        },
      },
      plugins: [
        babel({
          babelHelpers: 'bundled',
          exclude: 'node_modules/**',
          extensions: ['.js', '.jsx']
        })
      ]
    },
    // 确保SFC模块依赖于XRender核心库
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  plugins: [
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
    }),
  ],
});