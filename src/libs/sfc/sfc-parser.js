// SFC 解析器 - 解析 .xrt 文件
export class SFCParser {
  constructor(source, options = {}) {
    this.source = source;
    this.options = {
      extractStyles: true,
      scopeStyles: false,
      ...options
    };
    this.template = '';
    this.script = '';
    this.styles = [];
    this.errors = [];
    this.name = ''; // 组件名称
  }

  parse() {
    this._parseBlocks();
    this._validateBlocks();
    return this._createDescriptor();
  }

  _parseBlocks() {
    // 提取模板块
    const templateMatch = this.source.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
    if (templateMatch) {
      this.template = templateMatch[1].trim();
    }

    // 提取脚本块
    const scriptMatch = this.source.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (scriptMatch) {
      this.script = scriptMatch[1].trim();
    }

    // 提取样式块，支持 lang 属性
    const styleRegex = /<style([^>]*)>([\s\S]*?)<\/style>/gi;
    let styleMatch;
    while ((styleMatch = styleRegex.exec(this.source)) !== null) {
      const attributes = styleMatch[1];
      const content = styleMatch[2].trim();
      
      // 解析 lang 属性
      const langMatch = attributes.match(/lang\s*=\s*['"]([^'"]+)['"]/i);
      const lang = langMatch ? langMatch[1].toLowerCase() : 'css';
      
      // 解析 scoped 属性
      const scoped = /scoped/i.test(attributes);
      
      // 解析 module 属性
      const moduleMatch = attributes.match(/module\s*(?:=\s*['"]([^'"]+)['"])?/i);
      const module = moduleMatch ? (moduleMatch[1] || true) : false;
      
      this.styles.push({
        content,
        lang,
        scoped,
        module
      });
    }
  }

  _validateBlocks() {
    // 验证模板
    if (this.template && !this._isValidTemplate(this.template)) {
      this.errors.push('Invalid template syntax');
    }

    // 验证脚本
    if (this.script && !this._isValidScript(this.script)) {
      this.errors.push('Invalid script syntax');
    }
  }

  _isValidTemplate(template) {
    // 简化的模板验证
    // 实际实现会更复杂
    return template.includes('<') && template.includes('>');
  }

  _isValidScript(script) {
    // 简化的脚本验证
    // 实际实现会更复杂
    return script.includes('state') || script.includes('actions');
  }

  _createDescriptor() {
    return {
      template: this.template,
      script: this._parseScript(),
      styles: this.styles,
      errors: this.errors,
      name: this.name
    };
  }

  _parseScript() {
    if (!this.script) {
      return null;
    }

    // 解析脚本内容，提取 setup 函数和其他配置
    // 这是一个简化版本，实际实现会更复杂
    const setupMatch = this.script.match(/setup\s*\(\s*\)\s*{([\s\S]*?)}/);
    const nameMatch = this.script.match(/name\s*:\s*['"]([^'"]+)['"]/);
    
    // 解析 setup 函数内容
    let setupContent = null;
    if (setupMatch) {
      setupContent = setupMatch[1].trim();
      
      // 提取 ref 和 reactive 的使用
      const refMatches = [...setupContent.matchAll(/(\w+)\s*=\s*ref\s*\(([^)]+)\)/g)];
      const reactiveMatches = [...setupContent.matchAll(/(\w+)\s*=\s*reactive\s*\(([^)]+)\)/g)];
      
      // 提取方法定义
      const methodMatches = [...setupContent.matchAll(/const\s+(\w+)\s*=\s*\(\s*\)\s*=>\s*{([\s\S]*?)}/g)];
      
      // 提取返回对象
      const returnMatch = setupContent.match(/return\s*{([\s\S]*?)}/);
      
      // 构建 state 和 actions
      const state = {};
      const actions = {};
      
      // 处理 ref 和 reactive
      refMatches.forEach(match => {
        const [full, name, value] = match;
        state[name] = { type: 'ref', value: value.trim() };
      });
      
      reactiveMatches.forEach(match => {
        const [full, name, value] = match;
        try {
          // 尝试解析对象字面量
          const parsed = JSON.parse(value);
          state[name] = { type: 'reactive', value: parsed };
        } catch (e) {
          state[name] = { type: 'reactive', value: value };
        }
      });
      
      // 处理方法
      methodMatches.forEach(match => {
        const [full, name, implementation] = match;
        actions[name] = implementation.trim();
      });
      
      // 处理返回值
      if (returnMatch) {
        const returnContent = returnMatch[1];
        const returnItems = returnContent.split(',').map(item => item.trim());
        
        returnItems.forEach(item => {
          const [name, alias] = item.split(':').map(s => s && s.trim());
          if (alias) {
            // 重命名的情况
            if (state[alias]) {
              state[name] = state[alias];
            } else if (actions[alias]) {
              actions[name] = actions[alias];
            }
          }
        });
      }
      
      return {
        name: nameMatch ? nameMatch[1] : '',
        setup: setupContent,
        state,
        actions
      };
    }
    
    // 如果没有找到 setup 函数，尝试使用其他解析方式
    return {
      name: nameMatch ? nameMatch[1] : '',
      setup: setupContent,
      state: {},
      actions: {}
    };
  }

  _parseState(stateStr) {
    try {
      // 尝试直接解析 JSON
      return JSON.parse(stateStr);
    } catch (e) {
      // 如果解析失败，尝试更简单的解析
      const state = {};
      const keyValuePairs = stateStr.split(',');
      keyValuePairs.forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          // 尝试解析不同类型的值
          if (value.startsWith('[') && value.endsWith(']')) {
            state[key] = JSON.parse(value);
          } else if (value.startsWith('{') && value.endsWith('}')) {
            state[key] = JSON.parse(value);
          } else if (value.startsWith('"') || value.startsWith("'")) {
            state[key] = value.slice(1, -1);
          } else if (value === 'true' || value === 'false') {
            state[key] = value === 'true';
          } else if (!isNaN(value)) {
            state[key] = Number(value);
          } else {
            state[key] = value;
          }
        }
      });
      return state;
    }
  }

  _parseActions(actionsStr) {
    // 解析 actions 对象字符串
    // 这是一个简化版本，实际实现会更复杂
    const actions = {};
    const actionMatches = actionsStr.matchAll(/(\w+)\s*\(\s*\)\s*{([\s\S]*?)}/g);
    
    for (const match of actionMatches) {
      const actionName = match[1];
      const actionBody = match[2].trim();
      actions[actionName] = actionBody;
    }
    
    return actions;
  }
}