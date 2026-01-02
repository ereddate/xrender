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
    // 更强大的CSS选择器转换，支持复杂的选择器
    let processedStyle = style;
    
    // 处理媒体查询
    processedStyle = processedStyle.replace(/@media\s+([^{]+)\s*{/g, (match, condition) => {
      return `@media ${condition} {\n  .${scopeId}`;
    });
    
    // 处理普通选择器
    processedStyle = processedStyle.replace(/([^{}]+)\s*{/g, (match, selectors) => {
      // 分割选择器并逐个处理
      const selectorList = selectors.split(',').map(selector => {
        selector = selector.trim();
        if (!selector) return '';
        
        // 处理组合选择器（如 :hover, :focus, ::before 等）
        const pseudoMatch = selector.match(/^(.+?)([:]{1,2}[a-zA-Z-]+)$/);
        if (pseudoMatch) {
          const [_, baseSelector, pseudo] = pseudoMatch;
          // 确保基础选择器已经有作用域
          if (!baseSelector.includes(`.${scopeId}`)) {
            return `.${scopeId} ${baseSelector}${pseudo}`;
          }
          return selector; // 已经有了作用域
        }
        
        // 处理子选择器（如 >, +, ~）
        const combinatorMatch = selector.match(/^(.+?)\s*([>+~])\s*(.+)$/);
        if (combinatorMatch) {
          const [_, left, combinator, right] = combinatorMatch;
          
          // 为左侧添加作用域
          const leftScoped = left.includes(`.${scopeId}`) ? left : `.${scopeId} ${left}`;
          
          // 为右侧也添加作用域（如果是通用选择器或标签选择器）
          let rightScoped = right;
          if (right.match(/^[a-zA-Z]+|\*/)) {
            rightScoped = right.includes(`.${scopeId}`) ? right : `.${scopeId} ${right}`;
          }
          
          return `${leftScoped} ${combinator} ${rightScoped}`;
        }
        
        // 处理后代选择器
        if (!selector.includes(`.${scopeId}`)) {
          return `.${scopeId} ${selector}`;
        }
        
        return selector;
      }).filter(s => s);
      
      return `${selectorList.join(', ')} {`;
    });
    
    // 处理闭合大括号（为媒体查询）
    processedStyle = processedStyle.replace(/}\s*}/g, '}\n}');
    
    return processedStyle;
  }
}