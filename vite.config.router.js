import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const getVersion = () => {
  try {
    const versionsPath = path.resolve(__dirname, 'src/libs/versions.json');
    const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'));
    return versions.router.version;
  } catch (error) {
    console.warn('Failed to read version, using 0.0.0');
    return '0.0.0';
  }
};

const version = getVersion();

export default defineConfig({
  build: {
    lib: {
      entry: './src/libs/router/entry.js',
      name: 'XRenderRouter',
      fileName: (format) => `xrender-router-${version}.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        dir: `./dist/libs/router/${version}`,
        exports: 'named'
      },
      external: []
    },
    minify: 'terser',
    sourcemap: true
  }
});
