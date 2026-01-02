// SFC 模块入口文件
import { SFCParser } from './sfc-parser.js';
import { TemplateCompiler } from './template-compiler.js';
import { StyleProcessor } from './style-processor.js';
import { SFCBuilder, registerSFC, loadXRTFromFile } from './sfc-builder.js';
import { XRender } from '../core.js';

// 独立的 SFC 解析和编译函数
export function parseSFC(source, options = {}) {
  const parser = new SFCParser(source, options);
  return parser.parse();
}

export function compileSFC(source, options = {}) {
  const descriptor = parseSFC(source, options);
  
  const compiler = new TemplateCompiler(descriptor, options);
  const compiled = compiler.compile();
  
  return {
    descriptor,
    ...compiled
  };
}

// 将 SFC 功能集成到 XRender 中
export function initSFC(XRender) {
  if (!XRender) {
    console.error('XRender 未加载，无法初始化 SFC 功能');
    return;
  }

  // 添加 SFC 相关的全局方法
  XRender.sfc = {
    parse: parseSFC,
    compile: compileSFC,
    register: registerSFC,
    loadFromFile: loadXRTFromFile
  };

  // 添加全局组件加载方法
  XRender.loadXRT = loadXRTFromFile;
  XRender.registerXRT = registerSFC;

  console.log('XRender SFC 功能已初始化');
}