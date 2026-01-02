// 样式处理器 - 处理 SFC 中的样式，支持可选的样式作用域
export class StyleProcessor {
  constructor(descriptor, options = {}) {
    this.descriptor = descriptor;
    this.options = {
      scopeStyles: false,
      extractStyles: true,
      autoLoad: true,
      cssModules: false,
      ...options
    };
    this.preprocessors = {
      scss: this._compileSCSS.bind(this),
      sass: this._compileSCSS.bind(this),
      less: this._compileLess.bind(this),
      stylus: this._compileStylus.bind(this)
    };
  }

  process() {
    if (!this.descriptor.styles.length) {
      return null;
    }

    const processedStyles = [];
    const moduleMaps = [];

    for (const styleBlock of this.descriptor.styles) {
      let styleContent = styleBlock.content;
      const lang = styleBlock.lang || 'css';
      const scoped = styleBlock.scoped || this.options.scopeStyles;
      const module = styleBlock.module || this.options.cssModules;

      // 预处理样式（SCSS、Less 等）
      if (lang !== 'css' && this.preprocessors[lang]) {
        styleContent = this.preprocessors[lang](styleContent);
      }

      // 处理 CSS Modules
      if (module) {
        const moduleResult = this.processCSSModules(styleContent);
        if (moduleResult) {
          styleContent = moduleResult.styles;
          moduleMaps.push(moduleResult.moduleMap);
        }
      }

      // 处理作用域样式
      if (scoped) {
        const scopeId = this._generateScopeId();
        styleContent = this._transformRules(styleContent, scopeId);
      }

      processedStyles.push(styleContent);
    }

    // 自动注入样式
    if (this.options.extractStyles && this.options.autoLoad) {
      const styleId = this._injectStyles(processedStyles);
      return {
        styleId,
        moduleMap: moduleMaps.length > 0 ? Object.assign({}, ...moduleMaps) : null
      };
    }

    return processedStyles;
  }

  _compileSCSS(source) {
    try {
      if (typeof sass !== 'undefined' && sass.compile) {
        const result = sass.compile(source, {
          syntax: 'scss',
          sourceMap: false
        });
        return result.css;
      } else {
        console.warn('Sass compiler not available, using raw SCSS');
        return source;
      }
    } catch (error) {
      console.error('SCSS compilation error:', error);
      return source;
    }
  }

  _compileLess(source) {
    try {
      if (typeof less !== 'undefined' && less.render) {
        const result = less.render(source, {
          sync: true
        });
        return result.css;
      } else {
        console.warn('Less compiler not available, using raw Less');
        return source;
      }
    } catch (error) {
      console.error('Less compilation error:', error);
      return source;
    }
  }

  _compileStylus(source) {
    try {
      if (typeof stylus !== 'undefined' && stylus.render) {
        const result = stylus.render(source);
        return result;
      } else {
        console.warn('Stylus compiler not available, using raw Stylus');
        return source;
      }
    } catch (error) {
      console.error('Stylus compilation error:', error);
      return source;
    }
  }

  _scopeStyles(styles) {
    const scopeId = this._generateScopeId();
    const scopedStyles = styles.map(style => {
      const styleContent = typeof style === 'string' ? style : style.content;
      return this._transformRules(styleContent, scopeId);
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
    
    // 处理深度选择器 :deep() 和 ::v-deep
    processedStyle = processedStyle.replace(/:deep\(([^)]+)\)/g, (match, innerSelector) => {
      return `${scopeId} ${innerSelector}`;
    });
    
    processedStyle = processedStyle.replace(/::v-deep\s+([^{]+)/g, (match, selector) => {
      return `${scopeId} ${selector.trim()}`;
    });
    
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

  processCSSModules(style) {
    if (!this.options.cssModules) {
      return null;
    }

    const moduleMap = {};
    const regex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)\s*\{/g;
    let match;

    while ((match = regex.exec(style)) !== null) {
      const className = match[1];
      const moduleClassName = `${this._generateScopeId()}-${className}`;
      moduleMap[className] = moduleClassName;
    }

    // 替换样式中的类名
    let processedStyle = style;
    for (const [original, module] of Object.entries(moduleMap)) {
      const regex = new RegExp(`\\.${original}(?![a-zA-Z0-9_-])`, 'g');
      processedStyle = processedStyle.replace(regex, `.${module}`);
    }

    return {
      styles: processedStyle,
      moduleMap
    };
  }
}