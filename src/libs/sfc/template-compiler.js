// 模板编译器 - 将 SFC 中的模板转换为 XRender 的渲染函数
export class TemplateCompiler {
  constructor(descriptor, options = {}) {
    this.descriptor = descriptor;
    this.scopeId = options.scopeId || this._generateScopeId();
    this.slotsMap = {}; // 存储插槽信息
    this.options = {
      directiveTransforms: {
        'text': (node, dir, context) => {
          return `createElem('span', {}, [${this._compileExpression(dir.value, context)}])`;
        },
        'html': (node, dir, context) => {
          return `{ ${this._compileExpression(dir.value, context)} }`;
        },
        'show': (node, dir, context) => {
          return `{${this._compileExpression(dir.value, context)} ? ${node} : null}`;
        },
        'if': (node, dir, context) => {
          // 将 v-if 转换为条件渲染
          const condition = this._compileExpression(dir.value, context);
          // 如果节点本身包含条件渲染，则直接返回节点
          if (node.includes('?')) {
            return `(${condition} ? (${node}) : null)`;
          }
          return `(${condition} ? (${node}) : null)`;
        },
        'else-if': (node, dir, context) => {
          // v-else-if 需要和前面的 v-if 结合处理
          // 这里简化处理，实际应该在前端进行更复杂的处理
          const condition = this._compileExpression(dir.value, context);
          return `(${condition} ? (${node}) : null)`;
        },
        'else': (node, dir, context) => {
          // v-else 是最后的备选项
          return `(${node})`;
        },
        'show': (node, dir, context) => {
          // v-show 指令：控制元素的显示/隐藏
          const condition = this._compileExpression(dir.value, context);
          // 直接返回修改后的节点，而不是三元表达式
          return `{ 
            const __element = ${node};
            __element.style = __element.style || {};
            __element.style.display = ${condition} ? __element.style.display || '' : 'none';
            return __element;
          }()`;
        },
        'for': (node, dir, context) => {
          const { value } = dir;
          // 简化的 v-for 解析，支持 "item in items" 格式
          const match = value.match(/^(.+?)\s+in\s+(.+?)(?:\s+key\s*=\s*["'](.+?)["'])?$/);
          if (!match) {
            console.warn('v-for 指令格式不正确:', value);
            return node;
          }
          
          const item = match[1].trim();
          const list = match[2].trim();
          const key = match[3];
          
          // 生成唯一键值
          const keyValue = key ? this._compileExpression(key, context) : `${this._compileExpression(list, context)}.length + Math.random()`;
          
          // 返回一个函数，该函数会创建多个元素
          return `(${this._compileExpression(list, context)} || []).map((${item}, index) => {
            const element = ${node};
            return Object.assign({}, element, { key: ${keyValue}, _index: index });
          })`;
        },
        'bind': (node, dir, context) => {
          const attrName = dir.arg;
          if (!attrName) {
            console.warn('v-bind 指令缺少属性名');
            return node;
          }
          
          // 根据属性名确定正确的处理方式
          if (attrName === 'class') {
            return `Object.assign({}, ${node}, { class: (${node}.class || '') + ' ' + ${this._compileExpression(dir.value, context)} })`;
          } else if (attrName.startsWith('on')) {
            // 事件绑定
            const eventName = attrName.toLowerCase().substring(2);
            return `Object.assign({}, ${node}, { '@${eventName}': ${this._compileExpression(dir.value, context)} })`;
          } else {
            // 普通属性绑定
            return `Object.assign({}, ${node}, { ${attrName}: ${this._compileExpression(dir.value, context)} })`;
          }
        },
        'model': (node, dir, context) => {
          // 改进的 v-model 实现，支持多种元素类型
          const value = dir.value;
          const modelExpr = this._compileExpression(value, context);
          
          // 根据节点类型生成不同的实现
          if (node.includes('input')) {
            // input 元素
            return `Object.assign({}, ${node}, {
              value: ${modelExpr},
              '@input': (e) => ${modelExpr} = e.target.value
            })`;
          } else if (node.includes('textarea')) {
            // textarea 元素
            return `Object.assign({}, ${node}, {
              value: ${modelExpr},
              '@input': (e) => ${modelExpr} = e.target.value
            })`;
          } else if (node.includes('select')) {
            // select 元素
            return `Object.assign({}, ${node}, {
              value: ${modelExpr},
              '@change': (e) => ${modelExpr} = e.target.value
            })`;
          } else {
            // 其他元素，尝试使用 contenteditable
            return `Object.assign({}, ${node}, {
              contentEditable: 'true',
              innerText: ${modelExpr},
              '@input': (e) => ${modelExpr} = e.target.innerText
            })`;
          }
        },
        // 插槽相关指令
        'slot': (node, dir, context) => {
          const slotName = dir.arg || 'default';
          
          // 如果已经在插槽映射表中记录了这个插槽
          if (!this.slotsMap[slotName]) {
            // 如果插槽未定义，则使用默认插槽内容
            return `(state.__slots && state.__slots['${slotName}']) ? state.__slots['${slotName}']() : ${node}`;
          } else {
            // 插槽已定义，优先使用插槽内容
            return `(state.__slots && state.__slots['${slotName}']) ? state.__slots['${slotName}']() : ${node}`;
          }
        },
        // 动态组件相关指令
        'component': (node, dir, context) => {
          const componentExpr = this._compileExpression(dir.value, context);
          return `(typeof ${componentExpr} === 'function' ? ${componentExpr}() : ${componentExpr})`;
        },
        // 异步组件支持
        'suspense': (node, dir, context) => {
          const fallback = dir.value || 'default';
          return `{
            const AsyncComponent = () => Promise.resolve(${node});
            return createElem('div', { class: 'suspense-container' }, [
              createElem('div', { class: 'suspense-fallback', style: 'display: none' }, [${fallback}]),
              createElem('div', { class: 'suspense-content' }, [AsyncComponent()])
            ]);
          }()`;
        },
        // 过渡动画支持
        'transition': (node, dir, context) => {
          const transitionName = dir.value || 'v';
          const transitionClasses = {
            enter: `${transitionName}-enter`,
            enterActive: `${transitionName}-enter-active`,
            leave: `${transitionName}-leave`,
            leaveActive: `${transitionName}-leave-active`
          };
          
          return `{
            const transitionProps = {
              name: '${transitionName}',
              duration: ${dir.modifiers?.duration || 300},
              mode: '${dir.modifiers?.mode || 'in-out'}',
              appear: ${dir.modifiers?.appear || false},
              classes: ${JSON.stringify(transitionClasses)}
            };
            return createElem('transition', transitionProps, [${node}]);
          }()`;
        },
        // 过渡组支持
        'transition-group': (node, dir, context) => {
          const groupName = dir.value || 'v';
          const tag = dir.modifiers?.tag || 'div';
          
          return `{
            const groupProps = {
              name: '${groupName}',
              tag: '${tag}',
              duration: ${dir.modifiers?.duration || 300},
              moveClass: '${groupName}-move'
            };
            return createElem('transition-group', groupProps, [${node}]);
          }()`;
        }
      },
      ...options
    };
  }

  compile() {
    if (!this.descriptor.template) {
      return { render: null };
    }

    // 获取模板内容（支持多种格式）
    let templateContent;
    if (typeof this.descriptor.template === 'string') {
      templateContent = this.descriptor.template;
    } else if (this.descriptor.template.content) {
      templateContent = this.descriptor.template.content;
    } else {
      templateContent = '';
    }

    // 预处理模板，处理多根元素
    const preprocessedTemplate = this._preprocessTemplate(templateContent);
    
    // 收集插槽信息
    this._collectSlots(preprocessedTemplate);
    
    // 编译模板
    const compiledTemplate = this._compileTemplate(preprocessedTemplate);
    
    return {
      render: new Function('createElem', 'state', 'actions', `
        // 添加作用域样式
        const scopeClass = '${this.scopeId}';
        const scopedAttrs = { class: scopeClass };
        
        // 定义处理插值表达式的函数
        const processExpressions = (text) => {
          return text.replace(/\{\{(.+?)\}\}/g, (match, expr) => {
            return '\${' + ${this._compileExpression('expr', { state: 'state', actions: 'actions' })} + '}';
          });
        };
        
        // 为所有元素添加作用域样式
        const addScopeStyles = (element) => {
          if (typeof element === 'object' && element !== null) {
            // 添加作用域类名
            if (element.class) {
              element.class = element.class + ' ' + scopeClass;
            } else {
              element.class = scopeClass;
            }
            
            // 递归处理子元素
            if (element.children && Array.isArray(element.children)) {
              element.children = element.children.map(addScopeStyles);
            }
          }
          return element;
        };
        
        const result = ${compiledTemplate};
        return addScopeStyles(result);
      `),
      slots: this.slotsMap
    };
  }

  _collectSlots(template) {
    // 使用正则表达式提取插槽信息
    const slotRegex = /<slot[^>]*name=["']([^"']*)["'][^>]*>/g;
    let match;
    
    while ((match = slotRegex.exec(template)) !== null) {
      const slotName = match[1] || 'default';
      this.slotsMap[slotName] = {
        name: slotName,
        hasDefault: match[0].includes('/>') || match[0].includes('</slot>')
      };
    }
    
    // 处理默认插槽（没有name属性的slot）
    if (!this.slotsMap['default']) {
      this.slotsMap['default'] = {
        name: 'default',
        hasDefault: template.includes('<slot>')
      };
    }
  }
  
  _preprocessTemplate(template) {
    // 处理多个根元素的情况
    const hasSingleRoot = /^<[^>]+>/.test(template.trim());
    
    if (!hasSingleRoot) {
      // 如果有多个根元素，用一个div包装它们
      return `<div>${template}</div>`;
    }
    
    return template;
  }

  _compileTemplate(template) {
    // 递归解析HTML元素
    const root = this._parseHtml(template);
    
    // 递归编译AST
    return this._compileNode(root);
  }

  _parseHtml(html) {
    // 使用改进的递归下降解析器
    const root = { type: 'root', children: [] };
    const stack = [root];
    
    let i = 0;
    
    while (i < html.length) {
      // 查找下一个标签
      const tagStart = html.indexOf('<', i);
      
      if (tagStart === -1) {
        // 没有更多标签，添加剩余文本
        const text = html.slice(i).trim();
        if (text) {
          stack[stack.length - 1].children.push({
            type: 'text',
            content: text
          });
        }
        break;
      }
      
      // 添加标签前的文本
      if (tagStart > i) {
        const text = html.slice(i, tagStart).trim();
        if (text) {
          stack[stack.length - 1].children.push({
            type: 'text',
            content: text
          });
        }
      }
      
      // 查找标签结束
      const tagEnd = html.indexOf('>', tagStart + 1);
      if (tagEnd === -1) break;
      
      const tagContent = html.slice(tagStart, tagEnd + 1);
      i = tagEnd + 1;
      
      // 检查是否是注释
      if (tagContent.startsWith('<!--')) {
        const commentEnd = html.indexOf('-->', i);
        if (commentEnd !== -1) {
          i = commentEnd + 3;
        }
        continue;
      }
      
      // 检查是否是关闭标签
      if (tagContent.startsWith('</')) {
        const tagName = tagContent.match(/<\/([a-zA-Z][a-zA-Z0-9]*)/);
        if (tagName) {
          // 弹出栈，直到找到匹配的标签
          while (stack.length > 1) {
            const closed = stack.pop();
            if (closed.tagName === tagName[1]) {
              break;
            }
          }
        }
        continue;
      }
      
      // 解析开始标签
      const tagName = tagContent.match(/<([a-zA-Z][a-zA-Z0-9]*)/);
      if (tagName) {
        const element = {
          type: 'element',
          tagName: tagName[1],
          attributes: this._parseAttributes(tagContent),
          children: []
        };
        
        const isSelfClosing = tagContent.endsWith('/>');
        
        // 添加到当前父元素
        stack[stack.length - 1].children.push(element);
        
        // 如果不是自闭合标签，推入栈
        if (!isSelfClosing) {
          stack.push(element);
        }
      }
    }
    
    return root;
  }

  _parseAttributes(tagStr) {
    const attributes = {};
    
    // 提取所有属性
    const attrMatches = tagStr.match(/([a-zA-Z:-]+)="([^"]*)"/g) || [];
    
    attrMatches.forEach(attr => {
      const [name, value] = attr.split('=');
      const attrName = name.trim();
      const attrValue = value.replace(/^"|"$/g, '');
      
      // 处理事件监听器
      if (attrName.startsWith('@')) {
        const eventName = attrName.substring(1);
        attributes[`@${eventName}`] = new Function('e', 'state', 'actions', attrValue).bind(this);
      }
      // 处理指令
      else if (attrName.startsWith('v-')) {
        const parts = attrName.split(':'); // 处理 v-bind:xxx 或 v-model:xxx
        const directive = parts[0].substring(2); // 移除 "v-"
        const arg = parts[1]; // 获取指令参数 (如果有)
        
        attributes[`_${directive}`] = {
          value: attrValue,
          arg: arg
        };
      }
      // 处理作用域样式类
      else if (attrName === 'class') {
        attributes[attrName] = `${attrValue} ${this.scopeId}`;
      }
      // 其他普通属性
      else {
        attributes[attrName] = attrValue;
      }
    });
    
    return attributes;
  }

  _compileNode(node) {
    if (!node) return 'null';
    
    if (node.type === 'text') {
      // 处理文本内容中的插值表达式
      return `\`${node.content.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\``;
    }
    
    if (node.type === 'root') {
      // 根节点：返回所有子元素
      const children = node.children.map(child => this._compileNode(child)).filter(child => child !== 'null');
      return `[${children.join(', ')}]`;
    }
    
    if (node.type === 'element') {
      // 编译属性
      const attributes = this._compileAttributes(node.attributes);
      
      // 编译子元素
      const children = node.children.map(child => this._compileNode(child)).filter(child => child !== 'null');
      
      // 处理插槽标签
      if (node.tagName === 'slot') {
        const slotName = attributes.name || 'default';
        return `(state.__slots && state.__slots['${slotName}']) ? state.__slots['${slotName}']() : createElem('div', { class: '${this.scopeId}-slot-default' }, [])`;
      }
      
      // 处理动态组件
      if (attributes._component) {
        const componentExpr = attributes._component;
        // 使用组件表达式渲染动态组件
        return `{ 
          const Component = (typeof ${componentExpr} === 'function' ? ${componentExpr}() : ${componentExpr});
          return Component ? Component({ ${Object.keys(attributes).filter(k => !k.startsWith('_')).map(k => `${k}: ${JSON.stringify(attributes[k])}`).join(', ')} }, [${children.join(', ')}]) : createElem('div', {}, []);
        }()`;
      }
      
      // 创建元素
      return `createElem('${node.tagName}', ${JSON.stringify(attributes)}, [${children.join(', ')}])`;
    }
    
    return 'null';
  }

  _compileAttributes(attributes) {
    const compiled = {};
    let hasConditionalRendering = false;
    
    for (const key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        const value = attributes[key];
        
        // 处理指令
        if (key.startsWith('_')) {
          const directive = key.substring(1);
          const transform = this.options.directiveTransforms[directive];
          
          if (transform) {
              const directiveObj = value;
              const tagName = this._extractTagName(attributes);
              const nodeForDirective = this._createNodeFromAttributes(tagName, attributes);
              const compiledDirective = transform(
                nodeForDirective, 
                directiveObj, 
                { state: 'state', actions: 'actions' }
              );
              
              // 将编译后的指令添加到属性中
              if (directive === 'if' || directive === 'else-if') {
                // 条件渲染指令
                hasConditionalRendering = true;
                compiled[`__v-${directive}`] = compiledDirective;
              } else {
                compiled[key] = compiledDirective;
              }
            } else {
              console.warn(`未支持的指令: v-${directive}`);
            }
        }
        // 处理事件监听器
        else if (key.startsWith('@')) {
          compiled[key] = value;
        }
        // 处理普通属性
        else {
          compiled[key] = value;
        }
      }
    }
    
    // 如果有条件渲染，添加特殊标记
    if (hasConditionalRendering) {
      compiled['__has-conditional'] = true;
    }
    
    return compiled;
  }

  _extractTagName(attributes) {
    // 这里应该从实际元素中提取标签名
    // 简化处理，返回通用标签名
    return 'div';
  }

  _createNodeFromAttributes(tagName, attributes) {
    // 从属性中创建简单的节点字符串
    const attrs = JSON.stringify(attributes);
    return `createElem('${tagName}', ${attrs}, [])`;
  }

  _compileExpression(expr, context) {
    // 处理插值表达式中的属性访问
    // 将简单的属性访问转换为从state或actions中获取
    const cleanExpr = expr.trim();
    
    // 优先处理点号访问 (user.name, state.count)
    let processedExpr = cleanExpr.replace(/(\w+)\.(\w+)/g, (match, obj, prop) => {
      // 如果已经包含 state. 或 actions. 则保持不变
      if (obj === 'state' || obj === 'actions') {
        return match;
      }
      // 否则假设是 state 的属性
      return `${obj}.${prop}`;
    });
    
    // 处理数组访问 (items[0])
    processedExpr = processedExpr.replace(/(\w+)\[([^\]]+)\]/g, (match, arr, index) => {
      // 如果已经包含 state. 则保持不变
      if (arr === 'state' || arr === 'actions') {
        return match;
      }
      // 否则假设是 state 的属性
      return `${arr}[${index}]`;
    });
    
    // 处理模板修饰符 (如 .trim, .prevent 等)
    processedExpr = processedExpr.replace(/\.(\w+)(?=\s|$)/g, (match, modifier) => {
      // 只处理特定的修饰符
      const knownModifiers = ['trim', 'number', 'debounce', 'lazy', 'capitalize', 'uppercase', 'lowercase'];
      if (knownModifiers.includes(modifier)) {
        // 根据修饰符添加相应的处理逻辑
        return match; // 保持原样，在运行时处理
      }
      return match;
    });
    
    // 过滤JavaScript关键字和已处理的属性
    const keywords = ['true', 'false', 'null', 'undefined', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'try', 'catch', 'finally', 'return', 'break', 'continue', 'new', 'function', 'var', 'let', 'const'];
    const processedVars = new Set();
    
    // 提取所有未处理的变量名
    const varMatches = processedExpr.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];
    const vars = [...new Set(varMatches)];
    
    // 过滤关键字和已处理的属性
    const nonKeywords = vars.filter(v => {
      // 如果是关键字，忽略
      if (keywords.includes(v)) return false;
      
      // 如果已经包含点号（说明是属性访问），忽略
      if (processedExpr.includes(`${v}.`)) return false;
      
      // 如果在数组访问中，忽略
      if (processedExpr.includes(`${v}[`)) return false;
      
      return true;
    });
    
    // 为每个未处理的变量添加前缀
    nonKeywords.forEach(v => {
      const regex = new RegExp(`\\b${v}\\b`, 'g');
      processedExpr = processedExpr.replace(regex, `state.${v}`);
    });
    
    // 处理带修饰符的属性访问
    processedExpr = processedExpr.replace(/state\.(\w+)\.(\w+)(?:\.(\w+))?/g, (match, obj, prop, subProp) => {
      // 构建完整的属性访问路径
      let fullPath = `state.${obj}.${prop}`;
      if (subProp) fullPath += `.${subProp}`;
      
      // 应用修饰符处理（仅示例）
      if (processedExpr.includes('.trim')) {
        return `${fullPath}.trim()`;
      } else if (processedExpr.includes('.number')) {
        return `parseFloat(${fullPath})`;
      } else if (processedExpr.includes('.capitalize')) {
        return `${fullPath}.charAt(0).toUpperCase() + ${fullPath}.slice(1)`;
      } else if (processedExpr.includes('.uppercase')) {
        return `${fullPath}.toUpperCase()`;
      } else if (processedExpr.includes('.lowercase')) {
        return `${fullPath}.toLowerCase()`;
      }
      
      return fullPath;
    });
    
    return processedExpr;
  }

  _generateScopeId() {
    return `xrender-scope-${Math.random().toString(36).substring(2, 9)}`;
  }
}