import { MetaInjector } from './meta-injector.js';

export class HTMLRenderer {
  constructor(options = {}) {
    this.options = {
      templatePath: 'index.html',
      publicPath: '/',
      minify: false,
      ...options
    };
    this.template = null;
    this.metaInjector = new MetaInjector();
  }

  async loadTemplate() {
    const fs = await import('fs');
    const path = await import('path');
    
    const templatePath = this.options.templatePath;
    
    try {
      this.template = fs.readFileSync(templatePath, 'utf-8');
      return this.template;
    } catch (error) {
      console.error(`Error loading template from ${templatePath}:`, error);
      throw error;
    }
  }

  async renderRoute(route) {
    if (!this.template) {
      await this.loadTemplate();
    }
    
    const { path, component, meta = {} } = route;
    
    const appHTML = await this.renderComponent(component, route);
    const metaHTML = this.metaInjector.injectMeta(meta, path);
    
    const fullHTML = this.template
      .replace('</head>', `${metaHTML}\n</head>`)
      .replace('<div id="app"></div>', `<div id="app">${appHTML}</div>`)
      .replace(/<title>.*?<\/title>/, `<title>${meta.title || 'XRender App'}</title>`);
    
    return fullHTML;
  }

  async renderComponent(component, route) {
    if (!component) {
      return '<div>Component not found</div>';
    }
    
    try {
      const instance = this.createComponentInstance(component, route);
      const html = await this.renderToHTML(instance);
      return html;
    } catch (error) {
      console.error(`Error rendering component for route ${route.path}:`, error);
      return `<div>Error rendering component: ${error.message}</div>`;
    }
  }

  createComponentInstance(component, route) {
    const mockXRender = {
      component: (name, options) => ({
        name,
        options,
        constructor: component.constructor
      })
    };
    
    const instance = Object.create(component.options || {});
    
    if (component.options?.data) {
      instance.data = component.options.data;
    }
    
    if (component.options?.methods) {
      instance.methods = component.options.methods;
    }
    
    if (component.options?.computed) {
      instance.computed = component.options.computed;
    }
    
    instance._route = route;
    instance._isServer = true;
    
    return instance;
  }

  async renderToHTML(instance) {
    if (!instance.options?.render) {
      return '<div>No render method</div>';
    }
    
    const createElem = (tagName, attributes = {}, ...children) => {
      return this.createElement(tagName, attributes, children);
    };
    
    try {
      const vnode = instance.options.render.call(instance, createElem);
      return this.vnodeToHTML(vnode);
    } catch (error) {
      console.error('Error in render method:', error);
      return `<div>Render error: ${error.message}</div>`;
    }
  }

  createElement(tagName, attributes = {}, children = []) {
    return {
      tag: tagName,
      attrs: attributes,
      children: Array.isArray(children) ? children.flat() : [children]
    };
  }

  vnodeToHTML(vnode) {
    if (!vnode) {
      return '';
    }
    
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return String(vnode);
    }
    
    if (vnode.nodeType === Node.TEXT_NODE) {
      return vnode.textContent || '';
    }
    
    if (vnode.tagName) {
      return this.elementToHTML(vnode);
    }
    
    if (vnode.tag) {
      return this.vnodeToHTML(this.vnodeToElement(vnode));
    }
    
    return '';
  }

  vnodeToElement(vnode) {
    const { tag, attrs, children } = vnode;
    
    if (typeof tag === 'function') {
      return tag();
    }
    
    const element = document.createElement(tag);
    
    if (attrs) {
      Object.entries(attrs).forEach(([key, value]) => {
        this.setAttribute(element, key, value);
      });
    }
    
    if (children && children.length > 0) {
      children.forEach(child => {
        const childElement = this.vnodeToHTML(child);
        if (childElement) {
          element.innerHTML += childElement;
        }
      });
    }
    
    return element;
  }

  elementToHTML(element) {
    if (!element) {
      return '';
    }
    
    const tagName = element.tagName?.toLowerCase() || 'div';
    const attributes = this.getAttributes(element);
    const innerHTML = element.innerHTML || '';
    
    if (tagName === 'img' || tagName === 'br' || tagName === 'hr' || tagName === 'input') {
      return `<${tagName}${attributes}>`;
    }
    
    return `<${tagName}${attributes}>${innerHTML}</${tagName}>`;
  }

  getAttributes(element) {
    const attrs = [];
    
    if (!element.attributes) {
      return '';
    }
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attrs.push(`${attr.name}="${attr.value}"`);
    }
    
    return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  }

  setAttribute(element, key, value) {
    if (key.startsWith('@')) {
      return;
    }
    
    if (key === 'v-if' || key === 'v-else' || key === 'v-for') {
      return;
    }
    
    if (key.startsWith(':') || key.startsWith('v-bind:')) {
      const attrName = key.replace(/^(v-bind:)?:/, '');
      element.setAttribute(attrName, value);
      return;
    }
    
    if (key === 'class' || key === 'className') {
      element.className = value;
      return;
    }
    
    if (key === 'style') {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([styleKey, styleValue]) => {
          element.style[styleKey] = styleValue;
        });
      } else {
        element.setAttribute('style', value);
      }
      return;
    }
    
    element.setAttribute(key, value);
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  setTemplate(template) {
    this.template = template;
  }
}
