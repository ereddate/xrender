import { StaticSiteGenerator } from './static-site-generator.js';
import { RoutePreloader } from './route-preloader.js';
import { HTMLRenderer } from './html-renderer.js';
import { MetaInjector } from './meta-injector.js';

export { StaticSiteGenerator, RoutePreloader, HTMLRenderer, MetaInjector };

export function initSSG(XRender) {
  XRender.SSG = {
    StaticSiteGenerator,
    RoutePreloader,
    HTMLRenderer,
    MetaInjector
  };
  
  return XRender.SSG;
}

export default initSSG;
