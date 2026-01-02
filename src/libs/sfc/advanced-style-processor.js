// 高级样式处理器 - 支持CSS Modules和Scoped CSS
export class AdvancedStyleProcessor {
  constructor(options = {}) {
    this.styleCache = new Map(); // 样式缓存
    this.modulesMap = new Map(); // CSS Modules映射
    this.scopedStyles = new Map(); // Scoped样式
    this.injectedStyles = new Set(); // 已注入的样式
    this.options = {
      scopeIdPrefix: options.scopeIdPrefix || 'xrt-scope-',
      enableCSSModules: options.enableCSSModules !== false,
      enableScopedCSS: options.enableScopedCSS !== false,
      generateScopedId: options.generateScopedId || this._generateScopedId,
      hashFunction: options.hashFunction || this._simpleHash,
      minify: options.minify !== false,
      sourceMap: options.sourceMap || false,
      ...options
    };
    this.styleIdCounter = 0;
  }

  // 处理组件样式
  async processComponentStyles(component, options = {}) {
    if (!component || !component.styles || !Array.isArray(component.styles)) {
      return {
        css: '',
        cssModules: {}
      };
    }

    const scopeId = options.scopeId || component.name || `component-${this.styleIdCounter++}`;
    const processedStyles = [];
    const cssModules = {};

    for (const style of component.styles) {
      const styleBlock = {
        content: style.content || '',
        scoped: style.scoped || false,
        modules: style.modules || false,
        lang: style.lang || 'css',
        media: style.media || null,
        supports: style.supports || null
      };

      let processedContent = styleBlock.content;

      // 所有样式块都生成CSS模块
      const moduleResult = this._processCSSModules(processedContent, scopeId, options);
      processedContent = moduleResult.style;
      Object.assign(cssModules, moduleResult.modules);

      processedStyles.push(processedContent);
    }

    return {
      css: processedStyles.join('\n'),
      cssModules,
      scopeId
    };
  }

  // 处理SFC样式块
  processSFCStyles(styles, scopeId, options = {}) {
    const processedStyles = [];
    const styleModules = {};
    
    for (const styleBlock of styles) {
      const styleConfig = this._parseStyleBlock(styleBlock, options);
      
      let processedContent = styleConfig.content;
      
      if (styleConfig.modules) {
        // CSS Modules处理
        const moduleResult = this._processCSSModules(processedContent, scopeId, options);
        processedContent = moduleResult.style;
        Object.assign(styleModules, moduleResult.modules);
      } else if (styleConfig.scoped) {
        // Scoped CSS处理
        processedContent = this._processScopedCSS(processedContent, scopeId, options);
      } else {
        // 普通样式处理
        processedContent = this._processNormalCSS(processedContent, options);
      }
      
      // 重建样式标签，保留原始属性
      let styleTag = '<style';
      if (styleConfig.scoped) styleTag += ' scoped';
      if (styleConfig.modules) styleTag += ' module';
      if (styleConfig.lang !== 'css') styleTag += ` lang="${styleConfig.lang}"`;
      if (styleConfig.media) styleTag += ` media="${styleConfig.media}"`;
      if (styleConfig.supports) styleTag += ` supports="${styleConfig.supports}"`;
      styleTag += `>${processedContent}</style>`;
      
      processedStyles.push(styleTag);
      
      // 缓存处理结果
      const cacheKey = `${scopeId}_${this._simpleHash(styleBlock)}`;
      this.styleCache.set(cacheKey, processedContent);
    }
    
    return {
      styles: processedStyles,
      modules: styleModules,
      scopeId,
      sourceMap: options.sourceMap ? this._generateSourceMap(styles, scopeId) : undefined
    };
  }

  // 解析样式块
  _parseStyleBlock(styleBlock, options) {
    const styleConfig = {
      content: '',
      scoped: false,
      modules: false,
      lang: 'css',
      media: null,
      supports: null
    };

    // 处理对象形式的样式块
    if (typeof styleBlock === 'object' && styleBlock !== null) {
      styleConfig.content = styleBlock.content || '';
      styleConfig.scoped = styleBlock.scoped || false;
      styleConfig.modules = styleBlock.modules || false;
      styleConfig.lang = styleBlock.lang || 'css';
      styleConfig.media = styleBlock.media || null;
      styleConfig.supports = styleBlock.supports || null;
      return styleConfig;
    }

    // 处理字符串形式的样式块
    if (typeof styleBlock !== 'string') {
      return styleConfig;
    }

    // 解析属性
    if (styleBlock.includes('scoped')) {
      styleConfig.scoped = true;
    }
    
    if (styleBlock.includes('module')) {
      styleConfig.modules = true;
    }

    // 提取内容
    const contentMatch = styleBlock.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (contentMatch) {
      styleConfig.content = contentMatch[1].trim() || ' '; // 空内容用空格填充
    }

    // 提取属性
    const attrMatch = styleBlock.match(/<style([^>]*)>/i);
    if (attrMatch) {
      const attrs = attrMatch[1];
      
      // 提取lang
      const langMatch = attrs.match(/lang=["']([^"']+)["']/);
      if (langMatch) {
        styleConfig.lang = langMatch[1];
      }
      
      // 提取media
      const mediaMatch = attrs.match(/media=["']([^"']+)["']/);
      if (mediaMatch) {
        styleConfig.media = mediaMatch[1];
      }
      
      // 提取supports
      const supportsMatch = attrs.match(/supports=["']([^"']+)["']/);
      if (supportsMatch) {
        styleConfig.supports = supportsMatch[1];
      }
    }

    return styleConfig;
  }

  // 处理带媒体查询的样式
  _processMediaQueryStyle(content, media) {
    return `@media ${media} { ${content} }`;
  }

  // 处理带supports条件的样式
  _processSupportsStyle(content, supports) {
    return `@supports ${supports} { ${content} }`;
  }

  // 处理CSS Modules
  _processCSSModules(content, scopeId, options = {}) {
    const moduleName = `${scopeId}_${this.styleIdCounter++}`;
    const classMap = {};
    const exportObject = {};
    
    // 解析CSS并生成类名映射，但不修改CSS内容
    content.replace(/\.([a-zA-Z_][a-zA-Z0-9_-]*)\s*{/g, (match, className) => {
      const hashedName = this._hashClassName(className, moduleName);
      classMap[className] = hashedName;
      exportObject[className] = hashedName;
      return match; // 保持原始CSS不变
    });

    // 生成样式对象
    const styleObject = this._generateStyleObject(classMap, exportObject);
    
    // 存储模块映射
    this.modulesMap.set(moduleName, {
      classes: classMap,
      export: exportObject,
      style: content
    });

    return {
      style: content,
      modules: styleObject
    };
  }

  // 处理Scoped CSS
  _processScopedCSS(content, scopeId, options = {}) {
    const scopedId = options.generateScopedId ? 
      options.generateScopedId(scopeId) : 
      this._generateScopedId(scopeId);

    // 为选择器添加作用域
    const processedContent = this._scopeCSSRules(content, scopedId);
    
    // 存储Scoped样式
    this.scopedStyles.set(scopedId, {
      content: processedContent,
      scopeId,
      timestamp: Date.now()
    });

    return processedContent;
  }

  // 处理普通CSS
  _processNormalCSS(content, options = {}) {
    if (options.minify !== false) {
      return this._minifyCSS(content);
    }
    return content;
  }

  // 作用域化CSS规则
  _scopeCSSRules(css, scopeId) {
    let processed = css;

    // 处理选择器
    processed = processed.replace(/([^{}]+)\s*{/g, (match, selectors) => {
      const scopedSelectors = selectors.split(',').map(selector => {
        selector = selector.trim();
        
        // 跳过已经作用域化的选择器
        if (selector.includes(`[data-${scopeId}]`)) {
          return selector;
        }

        // 处理伪类
        if (selector.includes(':')) {
          const [baseSelector, pseudoClass] = selector.split(':');
          return `[data-${scopeId}] ${baseSelector.trim()}:${pseudoClass}`;
        }
        
        // 处理通用选择器
        if (selector === '*') {
          return `[data-${scopeId}] *`;
        }
        
        // 处理组合选择器
        if (selector.includes(' ')) {
          return `[data-${scopeId}] ${selector}`;
        }
        
        // 添加作用域属性
        if (selector.startsWith('.')) {
          return `[data-${scopeId}] ${selector}`;
        } else if (selector.startsWith('#')) {
          return `[data-${scopeId}] ${selector}`;
        } else if (selector.match(/^[a-zA-Z]/)) {
          return `[data-${scopeId}] ${selector}`;
        }
        
        return `[data-${scopeId}] ${selector}`;
      });
      
      return scopedSelectors.join(', ') + ' {';
    });

    return processed;
  }

  // 生成类名哈希
  _hashClassName(className, moduleName) {
    const input = `${className}_${moduleName}`;
    return `${moduleName}_${this._hashString(input)}`;
  }

  // 生成作用域ID
  _generateScopedId(scopeId) {
    if (!scopeId) {
      scopeId = this._simpleHash(Date.now().toString() + Math.random().toString());
    }
    return `${this.options.scopeIdPrefix}${scopeId}`;
  }

  // 简单哈希函数
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  // 兼容方法
  _hashString(str) {
    return this._simpleHash(str);
  }

  // 生成样式对象
  _generateStyleObject(classMap, exportObject) {
    const styleObject = {};
    
    for (const [originalName, hashedName] of Object.entries(classMap)) {
      styleObject[originalName] = hashedName;
    }
    
    // 添加__esModule标记
    Object.defineProperty(styleObject, '__esModule', {
      value: true
    });
    
    // 添加默认导出
    Object.defineProperty(styleObject, 'default', {
      get: () => exportObject
    });
    
    return styleObject;
  }

  // 注入样式到DOM
  injectStyles(styles, options = {}) {
    const injectedElements = [];
    
    for (const style of styles) {
      const styleId = this._generateStyleId(style);
      
      if (this.injectedStyles.has(styleId)) {
        continue; // 避免重复注入
      }
      
      let styleContent = style;
      
      // 处理媒体查询
      if (options.media) {
        styleContent = `@media ${options.media} { ${styleContent} }`;
      }
      
      // 处理supports条件
      if (options.supports) {
        styleContent = `@supports ${options.supports} { ${styleContent} }`;
      }
      
      const styleElement = document.createElement('style');
      styleElement.setAttribute('data-xrt-style', styleId);
      styleElement.textContent = styleContent;
      
      document.head.appendChild(styleElement);
      this.injectedStyles.add(styleId);
      injectedElements.push(styleElement);
    }
    
    return injectedElements;
  }

  // 生成样式ID
  _generateStyleId(style) {
    return this._hashString(style);
  }

  // 生成源码映射
  _generateSourceMap(styles, scopeId) {
    const sourceMap = {
      version: 3,
      sources: [`${scopeId}.css`],
      names: [],
      mappings: '',
      file: `${scopeId}.css`
    };
    
    // 简化的源码映射生成
    let line = 0;
    let column = 0;
    const mappings = [];
    
    for (const style of styles) {
      const contentMatch = style.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      if (contentMatch) {
        const content = contentMatch[1];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) {
            line++;
            column = 0;
          }
          mappings.push(`${line},${column}`);
          column += lines[i].length;
        }
      }
    }
    
    sourceMap.mappings = mappings.join(';');
    return sourceMap;
  }

  // 移除样式
  removeStyles(styleId) {
    const styleElement = document.querySelector(`[data-xrt-style="${styleId}"]`);
    if (styleElement) {
      styleElement.remove();
      this.injectedStyles.delete(styleId);
    }
  }

  // 移除已注入的样式
  removeInjectedStyles(scopeId) {
    // 移除所有与该scope相关的样式
    const stylesToRemove = [];
    for (const styleId of this.injectedStyles) {
      if (styleId.includes(scopeId)) {
        stylesToRemove.push(styleId);
      }
    }
    
    for (const styleId of stylesToRemove) {
      this.removeStyles(styleId);
    }
  }

  // CSS压缩
  _minifyCSS(css) {
    return css
      // 移除注释
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // 移除多余空白
      .replace(/\s+/g, ' ')
      // 移除开头结尾空白
      .trim()
      // 压缩选择器之间的空白
      .replace(/\s*,\s*/g, ',')
      // 压缩属性之间的空白
      .replace(/;\s*/g, ';')
      // 压缩花括号周围的空白
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      // 压缩冒号后的空白
      .replace(/:\s+/g, ':');
  }

  // 获取CSS Modules
  getCSSModules(moduleName) {
    return this.modulesMap.get(moduleName);
  }

  // 获取Scoped样式
  getScopedStyles(scopeId) {
    return this.scopedStyles.get(scopeId);
  }

  // 清除缓存
  clearCache() {
    this.styleCache.clear();
    this.modulesMap.clear();
    this.scopedStyles.clear();
  }

  // 获取统计信息
  getStats() {
    return {
      totalStyles: this.styleCache.size,
      scopedStyles: this.scopedStyles.size,
      moduleStyles: this.modulesMap.size,
      cacheSize: this.styleCache.size,
      memoryUsage: this._estimateMemoryUsage()
    };
  }

  // 估算内存使用
  _estimateMemoryUsage() {
    let size = 0;
    
    // 估算各个数据结构的内存使用
    for (const style of this.styleCache.values()) {
      size += style.length;
    }
    
    for (const module of this.modulesMap.values()) {
      size += JSON.stringify(module).length;
    }
    
    for (const scoped of this.scopedStyles.values()) {
      size += scoped.content.length;
    }
    
    return size;
  }

  // 销毁
  destroy() {
    // 移除所有注入的样式
    for (const styleId of this.injectedStyles) {
      this.removeStyles(styleId);
    }
    
    this.clearCache();
  }
}

// 全局样式处理器实例
export const advancedStyleProcessor = new AdvancedStyleProcessor();

// 便捷方法
export const processStyles = (styles, scopeId, options) => 
  advancedStyleProcessor.processSFCStyles(styles, scopeId, options);

export const injectStyles = (styles, options) => 
  advancedStyleProcessor.injectStyles(styles, options);

export const getCSSModules = (moduleName) => 
  advancedStyleProcessor.getCSSModules(moduleName);

export const getScopedStyles = (scopeId) => 
  advancedStyleProcessor.getScopedStyles(scopeId);