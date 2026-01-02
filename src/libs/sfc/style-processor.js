// 样式处理器 - 处理 SFC 中的样式，支持可选的样式作用域
export class StyleProcessor {
  constructor(descriptor, options = {}) {
    this.descriptor = descriptor;
    this.options = {
      scopeStyles: false,
      extractStyles: true,
      autoLoad: true,
      ...options
    };
  }

  process() {
    if (!this.descriptor.styles.length) {
      return null;
    }

    let processedStyles = this.descriptor.styles;
    
    if (this.options.scopeStyles) {
      processedStyles = this._scopeStyles(processedStyles);
    }

    if (this.options.extractStyles && this.options.autoLoad) {
      return this._injectStyles(processedStyles);
    }

    return processedStyles;
  }

  _scopeStyles(styles) {
    const scopeId = this._generateScopeId();
    const scopedStyles = styles.map(style => {
      return this._transformRules(style, scopeId);
    });
    return scopedStyles;
  }

  _injectStyles(styles) {
    const styleId = `xrender-style-${Date.now()}`;
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles.join('\n');
    document.head.appendChild(styleElement);
    return styleId;
  }

  _generateScopeId() {
    return `xrender-scope-${Math.random().toString(36).substring(2, 9)}`;
  }

  _transformRules(style, scopeId) {
    // 简化处理：添加作用域选择器
    return style.replace(/([^{}]+){/g, (match, selectors) => {
      const scopedSelectors = selectors.split(',').map(selector => 
        `.${scopeId} ${selector.trim()}`
      ).join(', ');
      return `${scopedSelectors}{`;
    });
  }
}