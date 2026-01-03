import XRender from './core.js';
import customDirectives from './customDirectives.js';

// 按需引入功能模块
// 当需要使用SFC功能时，可以按以下方式引入：
// import { initSFC } from './sfc/entry.js';
// initSFC(XRender);

// 当需要使用XProgress功能时，可以按以下方式引入：
// import { xProgressPlugin } from './xprogress/entry.js';
// XRender.use(xProgressPlugin, { trickleSpeed: 200 });

export { XRender, customDirectives };
export default XRender;
