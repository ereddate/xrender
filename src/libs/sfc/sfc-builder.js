// SFC 组件构建器 - 将解析和编译的结果与 XRender 组件系统集成
import { SFCParser } from './sfc-parser.js';
import { TemplateCompiler } from './template-compiler.js';
import { StyleProcessor } from './style-processor.js';
import { XRender } from '../core.js';

// 检查是否已加载 XRender
const isXRenderLoaded = () => typeof window !== 'undefined' && window.XRender;

// 集成到 XRender 的 component 系统
function _registerWithXRender(name, config) {
  if (!isXRenderLoaded()) {
    console.warn('XRender 未加载，SFC 组件将不会注册到 XRender');
    return config;
  }
  
  // 如果已加载 XRender，则通过其 component 方法注册
  return XRender.component(name, config);
}

export class SFCBuilder {
  constructor(name, descriptor, options = {}) {
    this.name = name;
    this.descriptor = descriptor;
    this.options = {
      template: true,
      styles: true,
      adapter: isXRenderLoaded() ? XRender : null,
      ...options
    };
  }

  build() {
    const template = this.options.template ? 
      this._buildTemplate() : null;
    
    const styles = this.options.styles ? 
      this._buildStyles() : null;
    
    const script = this._buildScript(template, styles);
    
    // 评估并返回最终的组件配置
    return this._evaluateComponent(script);
  }

  _buildTemplate() {
    const compiler = new TemplateCompiler(this.descriptor, this.options);
    return compiler.compile();
  }

  _buildStyles() {
    const processor = new StyleProcessor(this.descriptor, this.options);
    return processor.process();
  }

  _buildScript(template, styles) {
    // 创建组件配置对象
    const componentConfig = {
      name: this.name,
      isSFC: true, // 标记为 SFC 组件
      sfcDescriptor: {
        name: this.descriptor.script?.name || this.name,
        template: this.descriptor.template,
        scopeId: this._generateScopeId()
      },
      render: template ? template.render : null,
      setup: this.descriptor.script ? this._createSetupFunction(this.descriptor.script) : null,
      styles: this.descriptor.styles
    };

    return componentConfig;
  }
  
  // 生成作用域 ID
  _generateScopeId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'xrt-';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  _createSetupFunction(script) {
    // 创建一个setup函数
    // 直接返回脚本中的 setup 函数
    if (script && script.setup) {
      try {
        // 创建一个包装函数，将 XRender 的 reactive、ref 等方法注入到作用域中
        return new Function('reactive', 'ref', 'computed', `
          const { reactive, ref, computed } = { reactive, ref, computed };
          ${script.setup}
        `);
      } catch (error) {
        console.error(`创建 SFC setup 函数失败:`, error);
        // 如果解析失败，返回一个默认的 setup 函数
        return function() {
          return {};
        };
      }
    }
    
    // 如果没有 setup 函数，返回一个空对象
    return function() {
      return {};
    };
  }

  _evaluateComponent(config) {
    // 使用 XRender 的 component 方法注册组件
    return _registerWithXRender(this.name, config);
  }
}

// 主要的 SFC 组件注册函数
export function registerSFC(name, source, options = {}) {
  const parser = new SFCParser(source, options);
  const descriptor = parser.parse();
  
  if (descriptor.errors.length) {
    throw new Error(`SFC 解析错误: ${descriptor.errors.join(', ')}`);
  }
  
  const builder = new SFCBuilder(name, descriptor, options);
  return builder.build();
}

// 便捷的加载函数，支持从 .xrt 文件加载
export function loadXRTFromFile(path, options = {}) {
  return fetch(path)
    .then(response => {
      if (!response.ok) {
        throw new Error(`无法加载 .xrt 文件: ${path}`);
      }
      return response.text();
    })
    .then(source => {
      const name = path.split('/').pop().replace('.xrt', '');
      return registerSFC(name, source, options);
    });
}