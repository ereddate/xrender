// 模板编译器 - 将 SFC 中的模板转换为 XRender 的渲染函数
export class TemplateCompiler {
  constructor(descriptor, options = {}) {
    this.descriptor = descriptor;
    this.options = {
      directiveTransforms: {
        'text': (node, dir) => {
          return `createElem('span', {}, [${dir.value}])`;
        },
        'show': (node, dir) => {
          return `{${dir.value} ? ${node} : null}`;
        }
      },
      ...options
    };
  }

  compile() {
    if (!this.descriptor.template) {
      return { render: null };
    }

    const compiledTemplate = this._compileTemplate(this.descriptor.template);
    return {
      render: new Function('createElem', 'state', 'actions', `
        return ${compiledTemplate};
      `)
    };
  }

  _compileTemplate(template) {
    // 简化的模板编译逻辑
    // 实际实现会更复杂，包括指令解析和转换
    
    // 创建一个解析器对象来跟踪当前解析的元素
    const Parser = {
      parseElement(tagName, attributes = {}, children = []) {
        return `createElem('${tagName}', ${JSON.stringify(attributes)}, [${children.join(', ')}])`;
      },
      
      parseAttributes(elementStr) {
        // 提取所有属性
        const attrMatches = elementStr.match(/([a-zA-Z:-]+)="([^"]*)"/g) || [];
        const attributes = {};
        
        attrMatches.forEach(attr => {
          const [name, value] = attr.split('=');
          const attrName = name.trim();
          const attrValue = value.replace(/^"|"$/g, '');
          
          // 处理事件监听器
          if (attrName.startsWith('@')) {
            const eventName = attrName.substring(1);
            attributes[`@${eventName}`] = new Function('e', attrValue).bind(this);
          }
          // 处理指令
          else if (attrName.startsWith('v-')) {
            const directive = attrName.substring(2);
            attributes[`_${directive}`] = attrValue;
          }
          // 其他普通属性
          else {
            attributes[attrName] = attrValue;
          }
        });
        
        return attributes;
      },
      
      parseChildren(content) {
        if (!content) return [];
        
        const children = [];
        
        // 处理插值表达式 {{ }}
        let processedContent = content.replace(/\{\{(.+?)\}\}/g, (match, expr) => {
          return `\${${expr.trim()}}`;
        });
        
        // 简单的子元素解析
        const elementRegex = /<([a-zA-Z0-9-]+)([^>]*)>([\s\S]*?)<\/\1>/g;
        let match;
        
        while ((match = elementRegex.exec(processedContent)) !== null) {
          const tagName = match[1];
          const attributes = this.parseAttributes(match[2]);
          const childrenContent = match[3];
          children.push(this.parseElement(tagName, attributes, this.parseChildren(childrenContent)));
        }
        
        // 处理文本内容
        if (processedContent && !elementRegex.test(processedContent)) {
          children.push(`\`${processedContent}\``);
        }
        
        return children;
      }
    };
    
    // 解析根元素
    const rootMatch = template.match(/<([a-zA-Z0-9-]+)([^>]*)>([\s\S]*?)<\/\1>/);
    
    if (rootMatch) {
      const tagName = rootMatch[1];
      const attributes = Parser.parseAttributes(rootMatch[2]);
      const children = Parser.parseChildren(rootMatch[3]);
      return Parser.parseElement(tagName, attributes, children);
    }
    
    // 如果解析失败，返回一个基本的容器元素
    console.warn('SFC 模板解析失败，使用默认容器');
    return `createElem('div', {}, [])`;
  }
}