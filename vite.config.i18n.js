import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import babel from '@rollup/plugin-babel';

const getVersion = () => {
  try {
    const versionsPath = path.resolve(__dirname, 'src/libs/versions.json');
    const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'));
    return versions.i18n.version;
  } catch (error) {
    console.warn('Failed to read version, using 0.0.0');
    return '0.0.0';
  }
};

const version = getVersion();

export default defineConfig({
  build: {
    lib: {
      entry: './src/libs/i18n/entry.js',
      name: 'XRenderI18n',
      fileName: (format) => `xrender-i18n-${version}.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        dir: `./dist/libs/i18n/${version}`,
        exports: 'named',
        globals: {
          'intl-messageformat': 'IntlMessageFormat'
        }
      },
      external: ['intl-messageformat'],
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
