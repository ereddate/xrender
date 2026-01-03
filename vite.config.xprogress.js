import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";
import fs from 'fs';
import path from 'path';
import babel from '@rollup/plugin-babel';

const getVersion = () => {
  try {
    const versionsPath = path.resolve(__dirname, 'src/libs/versions.json');
    const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'));
    return versions.xprogress.version;
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
        xprogress: "./src/libs/xprogress/entry.js",
      },
      output: {
        entryFileNames: `xprogress-${version}.[format].js`,
        chunkFileNames: `xprogress-${version}.[name].js`,
        assetFileNames: `xprogress-${version}.[ext]`,
        dir: `./dist/libs/xprogress/${version}`,
        format: "es",
        globals: {
          intl: "Intl",
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
  },
  plugins: [
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
    }),
  ],
});
