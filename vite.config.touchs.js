import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import babel from '@rollup/plugin-babel';

const getVersion = () => {
  try {
    const versionsPath = path.resolve(__dirname, 'src/libs/versions.json');
    const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'));
    return versions.touchs.version;
  } catch (error) {
    console.warn('Failed to read version, using 0.0.0');
    return '0.0.0';
  }
};

const version = getVersion();

export default defineConfig({
  build: {
    lib: {
      entry: './src/libs/touchs/entry.js',
      name: 'XRenderTouchs',
      fileName: (format) => `xrender-touchs-${version}.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        dir: `./dist/libs/touchs/${version}`,
        exports: 'named'
      },
      external: [],
      plugins: [
        babel({
          babelHelpers: 'bundled',
          exclude: 'node_modules/**',
          extensions: ['.js', '.jsx']
        })
      ]
    },
    minify: 'terser',
    sourcemap: true
  }
});
