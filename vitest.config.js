import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 使用jsdom作为测试环境
    environment: 'jsdom',
    // 测试文件匹配模式
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // 排除目录
    exclude: ['node_modules', 'dist', 'examples'],
    // 启用覆盖率报告
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', 'examples', 'tests', 'vitest.config.js'],
    },
    // 测试超时时间
    timeout: 5000,
    // 并发测试数量
    concurrency: 4,
  },
});
