import XRender from './core.js';
import customDirectives from './customDirectives.js';
import { initSFC } from './sfc/index.js';

// 初始化 SFC 功能
initSFC(XRender);

export { XRender, customDirectives, initSFC };
export default XRender;
