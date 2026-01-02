import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdvancedStyleProcessor } from '../../src/libs/sfc/advanced-style-processor.js';

describe('高级样式处理器测试', () => {
  let styleProcessor;
  
  beforeEach(() => {
    styleProcessor = new AdvancedStyleProcessor({
      enableCSSModules: true,
      enableScopedCSS: true,
      minify: false
    });
  });
  
  afterEach(() => {
    styleProcessor.clearCache();
  });

  it('应该能够创建样式处理器实例', () => {
    expect(styleProcessor).toBeDefined();
    expect(styleProcessor.styleCache).toBeDefined();
    expect(styleProcessor.modulesMap).toBeDefined();
    expect(styleProcessor.scopedStyles).toBeDefined();
    expect(styleProcessor.injectedStyles).toBeDefined();
  });

  it('应该能够处理基本的SFC样式块', () => {
    const styles = [
      '<style>.container { padding: 20px; }</style>'
    ];
    const scopeId = 'test-scope-1';

    const result = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result).toHaveProperty('styles');
    expect(result).toHaveProperty('modules');
    expect(result).toHaveProperty('scopeId');
    expect(result.scopeId).toBe(scopeId);
  });

  it('应该能够处理Scoped CSS', () => {
    const styles = [
      '<style scoped>.component { color: red; } .nested { background: blue; }</style>'
    ];
    const scopeId = 'scoped-test';

    const result = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result.styles[0]).toContain(scopeId);
    expect(result.styles[0]).toContain('.component');
    expect(result.styles[0]).toContain('.nested');
  });

  it('应该能够处理CSS Modules', () => {
    const styles = [
      '<style module>.button { padding: 10px; } .primary { color: blue; }</style>'
    ];
    const scopeId = 'modules-test';

    const result = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result).toHaveProperty('modules');
    expect(result.modules).toHaveProperty('button');
    expect(result.modules).toHaveProperty('primary');
    expect(typeof result.modules.button).toBe('string');
  });

  it('应该能够处理多种样式的混合', () => {
    const styles = [
      '<style>.global { color: black; }</style>',
      '<style scoped>.scoped { font-size: 14px; }</style>',
      '<style module>.module { margin: 5px; }</style>'
    ];
    const scopeId = 'mixed-test';

    const result = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result.styles).toHaveLength(3);
    expect(result.modules).toHaveProperty('module');
    expect(result.styles[1]).toContain(scopeId); // scoped样式包含scopeId
  });

  it('应该能够生成唯一的Scope ID', () => {
    const id1 = styleProcessor._generateScopedId();
    const id2 = styleProcessor._generateScopedId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
    expect(id1).toContain(styleProcessor.options.scopeIdPrefix);
  });

  it('应该能够计算简单的哈希值', () => {
    const hash1 = styleProcessor._simpleHash('test-content');
    const hash2 = styleProcessor._simpleHash('test-content');
    const hash3 = styleProcessor._simpleHash('different-content');

    expect(hash1).toBe(hash2); // 相同内容产生相同哈希
    expect(hash1).not.toBe(hash3); // 不同内容产生不同哈希
    expect(typeof hash1).toBe('string');
  });

  it('应该能够处理样式中的媒体查询', () => {
    const styles = [
      '<style media="screen and (max-width: 768px)">.responsive { width: 100%; }</style>'
    ];
    const scopeId = 'media-test';

    const result = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result.styles[0]).toContain('media="screen and (max-width: 768px)"');
  });

  it('应该能够处理样式中的supports条件', () => {
    const styles = [
      '<style supports="(display: grid)">.grid { display: grid; }</style>'
    ];
    const scopeId = 'supports-test';

    const result = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result.styles[0]).toContain('supports="(display: grid)"');
  });

  it('应该能够处理不同语言的样式', () => {
    const styles = [
      '<style lang="scss">.test { & .nested { color: red; } }</style>'
    ];
    const scopeId = 'lang-test';

    const result = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result.styles[0]).toContain('.test');
    expect(result.styles[0]).toContain('.nested');
  });

  it('应该能够缓存处理过的样式', () => {
    const styles = ['<style>.cache-test { color: blue; }</style>'];
    const scopeId = 'cache-test';

    // 第一次处理
    const result1 = styleProcessor.processSFCStyles(styles, scopeId);
    
    // 第二次处理，应该使用缓存
    const result2 = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result1).toEqual(result2);
  });

  it('应该能够注入样式到DOM', () => {
    // 模拟DOM环境
    global.document = {
      head: {
        appendChild: vi.fn()
      },
      createElement: vi.fn().mockReturnValue({
        textContent: '',
        setAttribute: vi.fn(),
        appendChild: vi.fn()
      })
    };

    const styles = ['.inject-test { color: green; }'];
    
    // 直接注入样式
    styleProcessor.injectStyles(styles);
    
    // 验证样式被标记为已注入
    expect(styleProcessor.injectedStyles.size).toBeGreaterThan(0);
  });

  it('应该能够移除已注入的样式', () => {
    global.document = {
      head: {
        appendChild: vi.fn()
      },
      createElement: vi.fn().mockReturnValue({
        textContent: '',
        setAttribute: vi.fn(),
        appendChild: vi.fn(),
        remove: vi.fn()
      })
    };

    const styles = ['.remove-test { color: orange; }'];
    const scopeId = 'remove-test';

    // 先注入样式
    styleProcessor.injectStyles(styles);
    
    // 验证样式已注入
    expect(styleProcessor.injectedStyles.size).toBeGreaterThan(0);
    
    // 清除样式
    styleProcessor.removeInjectedStyles(scopeId);
    
    expect(styleProcessor.injectedStyles.has(scopeId)).toBe(false);
  });

  it('应该能够压缩样式', () => {
    const processor = new AdvancedStyleProcessor({ minify: true });
    const styles = ['<style>\n  .test  {  \n    color  :  red  ;  \n  }\n</style>'];
    const scopeId = 'minify-test';

    const result = processor.processSFCStyles(styles, scopeId);

    // 压缩后的样式不应该包含多余的空格和换行
    expect(result.styles[0]).not.toContain('\n  ');
    expect(result.styles[0]).toContain('.test');
  });

  it('应该能够生成源码映射', () => {
    const processor = new AdvancedStyleProcessor({ sourceMap: true });
    const styles = ['<style>.source-map { color: purple; }</style>'];
    const scopeId = 'sourcemap-test';

    const result = processor.processSFCStyles(styles, scopeId);

    expect(result).toHaveProperty('sourceMap');
  });

  it('应该能够处理复杂的CSS选择器', () => {
    const styles = [
      '<style scoped>.component > .child:hover + .sibling[data-active="true"] { color: cyan; }</style>'
    ];
    const scopeId = 'complex-selector';

    const result = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result.styles[0]).toContain(scopeId);
    expect(result.styles[0]).toContain('.component');
    expect(result.styles[0]).toContain('.child');
  });

  it('应该能够处理CSS变量', () => {
    const styles = [
      '<style scoped>.var-test { --primary-color: blue; color: var(--primary-color); }</style>'
    ];
    const scopeId = 'css-vars';

    const result = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result.styles[0]).toContain('--primary-color');
    expect(result.styles[0]).toContain('var(--primary-color)');
  });

  it('应该能够处理@keyframes动画', () => {
    const styles = [
      '<style scoped>@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }</style>'
    ];
    const scopeId = 'keyframes-test';

    const result = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result.styles[0]).toContain('@keyframes');
    expect(result.styles[0]).toContain('slideIn');
  });

  it('应该能够处理@import规则', () => {
    const styles = [
      '<style>@import url("https://example.com/style.css"); .import-test { color: magenta; }</style>'
    ];
    const scopeId = 'import-test';

    const result = styleProcessor.processSFCStyles(styles, scopeId);

    expect(result.styles[0]).toContain('@import');
    expect(result.styles[0]).toContain('https://example.com/style.css');
  });

  it('应该能够获取样式统计信息', () => {
    const styles = [
      '<style>.stats1 { color: red; }</style>',
      '<style scoped>.stats2 { color: blue; }</style>',
      '<style module>.stats3 { color: green; }</style>'
    ];
    const scopeId = 'stats-test';

    styleProcessor.processSFCStyles(styles, scopeId);

    const stats = styleProcessor.getStats();

    expect(stats).toHaveProperty('totalStyles');
    expect(stats).toHaveProperty('scopedStyles');
    expect(stats).toHaveProperty('moduleStyles');
    expect(stats).toHaveProperty('cacheSize');
    expect(stats.totalStyles).toBe(3);
  });

  it('应该能够清除缓存', () => {
    const styles = ['<style>.clear-cache { color: brown; }</style>'];
    const scopeId = 'clear-test';

    styleProcessor.processSFCStyles(styles, scopeId);
    expect(styleProcessor.styleCache.size).toBeGreaterThan(0);

    styleProcessor.clearCache();
    expect(styleProcessor.styleCache.size).toBe(0);
  });

  it('应该能够处理错误情况', () => {
    const invalidStyles = ['<invalid>malformed</invalid>'];

    expect(() => {
      styleProcessor.processSFCStyles(invalidStyles, 'error-test');
    }).not.toThrow(); // 应该优雅地处理错误
  });

  it('应该能够处理空的样式块', () => {
    const emptyStyles = ['<style></style>'];
    const scopeId = 'empty-test';

    const result = styleProcessor.processSFCStyles(emptyStyles, scopeId);

    expect(result.styles).toHaveLength(1);
    expect(result.styles[0]).toBeTruthy();
  });
});