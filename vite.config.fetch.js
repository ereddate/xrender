import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const getVersion = () => {
  try {
    const versionsPath = path.resolve(__dirname, 'src/libs/versions.json');
    const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'));
    return versions.fetch.version;
  } catch (error) {
    console.warn('Failed to read version, using 0.0.0');
    return '0.0.0';
  }
};

const version = getVersion();

export default defineConfig({
  build: {
    lib: {
      entry: './src/libs/fetch/entry.js',
      name: 'XRenderFetch',
      fileName: (format) => `xrender-fetch-${version}.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        dir: `./dist/libs/fetch/${version}`,
        exports: 'named'
      },
      external: []
    },
    minify: 'terser',
    sourcemap: true
  }
});
