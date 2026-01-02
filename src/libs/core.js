import customDirectives from "./customDirectives.js";
import { setCurrentInstance, getCurrentInstance, getGlobalWatchEffects } from "./reactivity.js";
const doc = window.document;
const createTextNode = function (text) {
  const textNode = doc.createTextNode(text);
  return textNode;
};
const createElement = function (tagName) {
  const elem = doc.createElement(tagName);
  return elem;
};
const on = function (elem, eventName, handler, namespace) {
  if (!elem._eventDelegation) {
    elem._eventDelegation = {};
    elem.addEventListener(eventName, function (e) {
      const handlers = elem._eventDelegation[eventName];
      if (handlers) {
        handlers.forEach((h) => {
          if (!namespace || h.namespace === namespace) {
            h.handler(e);
          }
        });
      }
    });
  }

  if (!elem._eventDelegation[eventName]) {
    elem._eventDelegation[eventName] = [];
  }
  elem._eventDelegation[eventName].push({ handler, namespace });
};
const off = function (elem, eventName, namespace) {
  if (elem._eventDelegation && elem._eventDelegation[eventName]) {
    if (namespace) {
      elem._eventDelegation[eventName] = elem._eventDelegation[
        eventName
      ].filter((h) => h.namespace !== namespace);
    } else {
      delete elem._eventDelegation[eventName];
    }
  }
};
const isExpression = function (str) {
  // 判断是否是表达式
  return (
    typeof str === "string" &&
    (str.includes("{{") || str.includes("$t(") || str.includes("("))
  );
};
const isComponent = function (component) {
  const isComponent = component instanceof Component;
  return isComponent;
};
const elemChildren = function (elem, children) {
  const that = this;
  const fragment = doc.createDocumentFragment(); // 创建 DocumentFragment
  const append = function (child) {
    if (Array.isArray(child)) {
      child.forEach(append);
      return;
    } else fragment.appendChild(child);
  };
  children.length > 0 &&
    children.forEach((child) => {
      if (typeof child === "string") {
        if (child.includes("{{")) {
          const interpolatedText = child.replace(/\{\{(.+?)\}\}/g, (_, key) => {
            return that.data[key.trim()] ?? "";
          });
          append(createTextNode(interpolatedText));
          return;
        }
        if (child.startsWith("$t(")) {
          const key = child.slice(3, -1).replace(/'/g, "");
          child = that.$i18n?.t(key) || key;
        }
        append(createTextNode(child));
      } else if (isComponent(child)) {
        const component = new child.constructor(
          child.name,
          {
            ...child.options,
            props: child.props,
          },
          XRender
        ).init();
        if (typeof component.el === "string") {
          const template = createElement("template");
          template.innerHTML = component.el;
          append(template.content);
        } else {
          append(component.el);
        }
      } else if (child && child.tagName && child.tagName === "TEMPLATE") {
        const templateChildren = Array.from(child.childNodes);
        elemChildren.call(that, fragment, templateChildren);
      } else {
        child && append(child);
      }
    });
  elem.appendChild(fragment); // 将 DocumentFragment 追加到元素中
};
const findCommon = function (target, slotName) {
  const common = [];
  const targetChildren = Array.from(target.childNodes).filter(
    (node) => node.nodeType === Node.COMMENT_NODE
  );
  Array.from(targetChildren).forEach((node) => {
    if (node.textContent === slotName) {
      common.push(node);
    } else {
      common.push(...findCommon(node, slotName));
    }
  });
  return common;
};
const elemAttrs = function (elem, attributes) {
  const that = this;
  const append = function (el) {
    elem.appendChild(el);
  };
  Object.entries(attributes).forEach(([key, value]) => {
    // 处理自定义指令
    if (key.startsWith("v-") && XRender.directives[key.slice(2)]) {
      const directive = XRender.directives[key.slice(2)];
      directive.bind?.(elem, value, that); // 确保 that 是正确的 vm 实例
    }
    if (key === "text") {
      if (value.includes("{{")) {
        value = value.replace(/\{\{(.+?)\}\}/g, (_, key) => {
          return that.data[key.trim()] ?? "";
        });
      }
      if (value.startsWith("$t(")) {
        const key = value.slice(3, -1).replace(/'/g, "");
        value = that.$i18n?.t(key) || key;
      }
      append(createTextNode(value));
    } else if (key.startsWith("@")) {
      const [eventName, ...modifiers] = key.slice(1).split(".");
      const handler = function (e) {
        if (modifiers.includes("stop")) e.stopPropagation();
        if (modifiers.includes("prevent")) e.preventDefault();
        if (modifiers.includes("once")) {
          elem.removeEventListener(key.slice(1), this);
        }
        if (modifiers.includes("self")) {
          if (e.target !== this) return;
        }

        if (typeof value === 'function') {
          value.call(that, e);
        } else {
          that.methods[value].call(that, e);
        }
      };
      (XRender.on || on)(elem, eventName, handler);
      that._eventHandlers = that._eventHandlers || [];
      that._eventHandlers.push({ elem, eventName, handler });
    } else if (key === "slot") {
      const slotName = value || "default";
      const slotContent = that.$slots[slotName];
      if (slotContent) {
        append(slotContent);
      } else {
        that.$slots[slotName] = elem;
      }
    } else if (key === "v-show") {
      // Visibility toggle
      elem.style.display = that.data[value] ? "" : "none";
    } else if (key === "v-hide") {
      // Inverse visibility
      elem.style.display = that.data[value] ? "none" : "";
    } else if (key === "v-model") {
      const updateEvent = elem.type === "checkbox" ? "change" : "input";
      const prop = elem.type === "checkbox" ? "checked" : "value";

      elem[prop] = that.data[value];
      (XRender.on || on)(elem, updateEvent, (e) => {
        that.data[value] = elem[prop];
      });
    } // 新增 v-for 指令
    else if (key === "v-for") {
      const [item, list] = value.match(/(\w+)\s+in\s+(\w+)/).slice(1);
      const items = that.data[list];
      if (Array.isArray(items)) {
        items.forEach((_, index) => {
          const clone = elem.cloneNode(true);
          that.data[item] = items[index];
          elem.parentNode.insertBefore(clone, elem);
        });
        elem.remove();
      }
    } // 新增 v-once 指令
    else if (key === "v-once") {
      elem.setAttribute("v-once", "");
      return;
    }
    // 新增 v-cloak 指令
    else if (key === "v-cloak") {
      elem.style.display = "none";
      return;
    }
    // 新增 v-pre 指令
    else if (key === "v-pre") {
      elem.setAttribute("v-pre", "");
      return;
    } else if (
      key.startsWith("v-bind") ||
      key.startsWith(":") ||
      key === "v-text"
    ) {
      // 处理 v-bind 指令
      const propName = key.replace(/^((v-bind)*\:)/, "");
      const propValue = that.data[value] ?? value;
      // 新增逻辑判断
      if (propName === "text" || propName === "v-text") {
        append(createTextNode(propValue));
      } else if (propName === "class") {
        // 支持对象和数组语法：:class="{active: isActive}" 或 :class="['class1', 'class2']"
        try {
          let classValue;
          if (isExpression(propValue)) {
            classValue = new Function(
              "data",
              `with(data){return ${propValue}}`
            )(that.data);
          } else if (typeof propValue === "string") {
            classValue = propValue;
          }

          // 处理各种类型返回值
          if (Array.isArray(classValue)) {
            elem.className = classValue.join(" ");
          } else if (typeof classValue === "object") {
            elem.className = Object.entries(classValue)
              .filter(([_, val]) => val)
              .map(([cls]) => cls)
              .join(" ");
          } else {
            elem.className = classValue;
          }
        } catch (e) {
          console.error(`v-bind:class error: ${e}`);
        }
      } else if (propName === "style") {
        // 支持对象语法：:style="{color: textColor}"
        if (typeof propValue === "object") {
          Object.entries(propValue).forEach(([styleName, styleVal]) => {
            elem.style[styleName] = styleVal;
          });
        } else {
          elem.setAttribute("style", propValue);
        }
      } else {
        // 通用属性绑定
        elem.setAttribute(propName, propValue);
      }
    } else {
      elem.setAttribute(key, value);
    }
  });
};
const createElementFromString = function (htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const element = doc.body.firstChild;

  const parseElement = (el) => {
    const tagName = el.tagName.toLowerCase();
    const attributes = {};
    const children = [];

    // 解析属性
    Array.from(el.attributes).forEach((attr) => {
      attributes[attr.name] = attr.value;
    });

    // 解析子节点
    Array.from(el.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        children.push(parseElement(child));
      } else if (
        child.nodeType === Node.TEXT_NODE &&
        child.textContent.trim()
      ) {
        children.push("'" + child.textContent.trim() + "'");
      }
    });

    return `createElem.call(this, "${tagName}", ${JSON.stringify(
      attributes
    )}, ${children.join(", ")})`;
  };

  return parseElement(element);
};
const createElem = function (tagName, attributes = {}, ...children) {
  const that = this;
  if (typeof tagName === "function") {
    let returnElem = createElementFromString(tagName.call(that).trim());
    returnElem = new Function(
      "createElem",
      `try{const el = ${returnElem};return el;}catch(e){console.error(e);return null;}`
    ).call(that, createElem);
    return returnElem;
  }
  // 新增全局组件解析逻辑
  if (typeof tagName === "string") {
    const componentName = tagName.toLowerCase();
    // 先查找当前组件实例的局部组件
    if ($.components && $.components[componentName]) {
      tagName = $.components[componentName];
    }
  }
  if (tagName === "transition") {
    tagName = "div";
    const wrapper = doc.createElement(tagName);
    const { name } = attributes;
    that.applyTransition(wrapper, "enter", {
      name,
      duration: 500,
    });
    elemChildren.call(that, wrapper, children);
    return wrapper;
  }
  if (attributes["static"]) {
    elem.setAttribute("data-static", "true");
    return elem;
  }
  // 前置处理 v-if 指令
  if (attributes["v-if"]) {
    try {
      // 存储当前组件实例的条件状态
      that._prevCondition = new Function(
        "data",
        `with(data){return ${attributes["v-if"]}}`
      )(that.data);
      if (!that._prevCondition)
        return doc.createComment(`v-if:${attributes["v-if"]}`);
      delete attributes["v-if"];
    } catch (e) {
      console.error(`v-if error: ${e}`);
    }
  }
  // 处理 v-else
  if (attributes["v-else"]) {
    const shouldShow =
      typeof that._prevCondition !== "undefined" && !that._prevCondition;
    that._prevCondition = undefined; // 重置条件状态

    if (!shouldShow) return doc.createComment("v-else");
    delete attributes["v-else"];
  }
  if (isComponent(tagName)) {
    const slots = {};
    // 将attributes作为props传递给组件
    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith("on")) {
        const eventName = key.charAt(2).toLowerCase() + key.slice(3);
        attributes[`@${eventName}`] = attributes[key];
        delete attributes[key];
      }
      if (typeof value === "string" && value.includes("{{")) {
        value = value.replace(/\{\{(.+?)\}\}/g, (_, key) => {
          return that.data[key.trim()] ?? "";
        });
        attributes[key] = value;
      }
      if (key.startsWith(":") || key.startsWith("v-bind:")) {
        attributes[key.replace(/^(v-bind:)?:/, "")] = that.data[value];
        delete attributes[key];
      } else if (key.startsWith("slot")) {
        const slotName = key.replace(/slot\:*/, "") || "default";
        slots[slotName] = value;
      } else if (typeof value === "string" && value.startsWith("$t(")) {
        const skey = value.slice(3, -1).replace(/'/g, "");
        value = that.$i18n?.t(skey) || skey;
        attributes[key] = value;
      } else {
        attributes[key] = value;
      }
    });

    let component;
    if (typeof tagName === "function") {
      component = new tagName(
        tagName.name,
        {
          ...tagName.options,
          props: attributes,
        },
        XRender
      ).init();
    } else if (tagName.constructor) {
      component = new tagName.constructor(
        tagName.name,
        {
          ...tagName.options,
          props: attributes,
        },
        XRender
      ).init();
    }
    Object.entries(slots).forEach(([slotName, slotContent]) => {
      findCommon(component.el, slotName).forEach((node) => {
        if (typeof slotContent === "function") {
          // 作用域插槽：传递数据给插槽内容
          const slotData = component.data;
          const renderedContent = slotContent(slotData);
          node.parentNode?.replaceChild(renderedContent, node);
        } else if (Array.isArray(slotContent)) {
          // 动态插槽：支持数组形式
          const fragment = doc.createDocumentFragment();
          slotContent.forEach((content) => {
            fragment.appendChild(content);
          });
          node.parentNode?.replaceChild(fragment, node);
        } else {
          node.parentNode?.replaceChild(slotContent, node);
        }
      });
    });
    elemChildren.call(that, component.el, children);
    return component.el;
  } else if (tagName === "slot") {
    const slotName = attributes.name || "default";
    that.$slots[slotName] = doc.createComment(slotName);
    return that.$slots[slotName];
  }
  const elem = createElement(tagName);
  elemAttrs.call(that, elem, attributes);
  elemChildren.call(that, elem, children);
  return elem;
};

// 新增虚拟节点类
export class VNode {
  constructor(tag, attrs, children) {
    this.tag = tag;
    this.attrs = attrs || {};
    this.children = children || [];
    this.key = attrs?.key; // 支持key属性优化diff
    // 新增静态标记 - 支持isStatic和static属性
    this.isStatic = attrs?.isStatic || attrs?.static || false;
    // 新增缓存标识
    this.cacheKey = attrs?.cacheKey || null;
    this.el = null;
  }
}

export class VDOMUtils {
  // 创建真实DOM元素
  static createElement(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      // 处理文本节点
      const textNode = doc.createTextNode(vnode);
      return textNode;
    }
    
    if (vnode.tag === '#text') {
      // 处理文本节点
      const textNode = doc.createTextNode(vnode.children.join(''));
      vnode.el = textNode;
      return textNode;
    }
    
    const element = createElement(vnode.tag);
    
    // 设置属性
    this.setElementAttributes(element, vnode.attrs);
    
    // 处理静态节点标记
    if (vnode.isStatic) {
      element.setAttribute('data-static', 'true');
    }
    
    // 处理子节点
    if (vnode.children && vnode.children.length > 0) {
      vnode.children.forEach(child => {
        const childElement = this.createElement(child);
        element.appendChild(childElement);
      });
    }
    
    // 保存真实DOM引用
    vnode.el = element;
    
    return element;
  }
  
  // 设置元素属性
  static setElementAttributes(element, attrs) {
    if (!attrs) return;
    
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'style') {
        // 处理样式对象
        if (typeof value === 'object') {
          Object.entries(value).forEach(([styleKey, styleValue]) => {
            element.style[styleKey] = styleValue;
          });
        } else {
          element.setAttribute('style', value);
        }
      } else if (key.startsWith('on')) {
        // 处理事件
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (key === 'class' || key === 'className') {
        // 处理类名
        element.className = value;
      } else if (key === 'static' || key === 'isStatic') {
        // 处理静态节点标记
        if (value) {
          element.setAttribute('data-static', 'true');
        }
      } else {
        // 处理普通属性
        element.setAttribute(key, value);
      }
    });
  }
  
  // 虚拟DOM差异算法 (diff)
  static diff(oldVnode, newVnode, parentEl, index) {
    // 如果新旧节点完全相同，直接返回
    if (oldVnode === newVnode) return oldVnode.el;
    
    // 如果节点类型不同，直接替换
    if (!this.isSameNodeType(oldVnode, newVnode)) {
      const newEl = this.createElement(newVnode);
      // 使用传入的parentEl和index进行替换，确保安全操作
      if (parentEl && index !== undefined) {
        const targetNode = parentEl.childNodes[index];
        if (targetNode && targetNode.parentNode === parentEl) {
          parentEl.replaceChild(newEl, targetNode);
        } else {
          // 如果指定索引处没有节点或节点不在正确位置，尝试使用oldVnode.el
          if (oldVnode.el && oldVnode.el.parentNode === parentEl) {
            parentEl.replaceChild(newEl, oldVnode.el);
          } else if (oldVnode.el && oldVnode.el.parentNode) {
            oldVnode.el.parentNode.replaceChild(newEl, oldVnode.el);
          } else {
            parentEl.appendChild(newEl);
          }
        }
      } else if (oldVnode.el && oldVnode.el.parentNode) {
        oldVnode.el.parentNode.replaceChild(newEl, oldVnode.el);
      }
      return newEl;
    }
    
    // 如果是文本节点
    if (typeof oldVnode === 'string' || typeof oldVnode === 'number' || 
        typeof newVnode === 'string' || typeof newVnode === 'number') {
      if (oldVnode !== newVnode) {
        const textNode = doc.createTextNode(newVnode);
        // 使用传入的parentEl和index进行替换，确保安全操作
        if (parentEl && index !== undefined) {
          const targetNode = parentEl.childNodes[index];
          if (targetNode && targetNode.parentNode === parentEl) {
            parentEl.replaceChild(textNode, targetNode);
          } else {
            // 如果指定索引处没有节点或节点不在正确位置，尝试使用oldVnode.el
            if (oldVnode.el && oldVnode.el.parentNode === parentEl) {
              parentEl.replaceChild(textNode, oldVnode.el);
            } else if (oldVnode.el && oldVnode.el.parentNode) {
              oldVnode.el.parentNode.replaceChild(textNode, oldVnode.el);
            } else {
              parentEl.appendChild(textNode);
            }
          }
        } else if (oldVnode.el && oldVnode.el.parentNode) {
          oldVnode.el.parentNode.replaceChild(textNode, oldVnode.el);
        }
        return textNode;
      }
      return oldVnode.el || (parentEl && index !== undefined ? parentEl.childNodes[index] : null);
    }
    
    // 更新元素属性
    this.updateElementAttributes(oldVnode.el, oldVnode.attrs, newVnode.attrs);
    
    // 更新子节点 - 检查是否有key，决定使用哪种diff算法
    if (oldVnode.el) {
      // 检查子节点是否有key，如果有则使用keyed diff
      const hasKeyedChildren = (oldVnode.children || []).some(child => child.key !== undefined) || 
                               (newVnode.children || []).some(child => child.key !== undefined);
      if (hasKeyedChildren) {
        this.keyedDiffChildren(oldVnode, newVnode, oldVnode.el);
      } else {
        this.diffChildren(oldVnode, newVnode, oldVnode.el);
      }
    }
    
    return oldVnode.el;
  }
  
  // 判断节点类型是否相同
  static isSameNodeType(node1, node2) {
    if (typeof node1 !== typeof node2) return false;
    if (typeof node1 === 'string' || typeof node1 === 'number') return true;
    if (node1 && node2 && node1.tag && node2.tag) {
      return node1.tag === node2.tag;
    }
    return false;
  }
  
  // 更新元素属性
  static updateElementAttributes(element, oldAttrs, newAttrs) {
    if (!oldAttrs) oldAttrs = {};
    if (!newAttrs) newAttrs = {};
    
    // 获取所有需要处理的属性键
    const allKeys = new Set([...Object.keys(oldAttrs), ...Object.keys(newAttrs)]);
    
    allKeys.forEach(key => {
      const oldValue = oldAttrs[key];
      const newValue = newAttrs[key];
      
      // 如果新值不存在，移除属性
      if (newValue === undefined) {
        if (key.startsWith('on')) {
          const eventName = key.slice(2).toLowerCase();
          element.removeEventListener(eventName, oldValue);
        } else {
          element.removeAttribute(key);
        }
      } 
      // 如果旧值不存在，添加属性
      else if (oldValue === undefined) {
        if (key.startsWith('on')) {
          const eventName = key.slice(2).toLowerCase();
          element.addEventListener(eventName, newValue);
        } else if (key === 'style') {
          // 更新样式
          if (typeof newValue === 'object') {
            Object.entries(newValue).forEach(([styleKey, styleValue]) => {
              element.style[styleKey] = styleValue;
            });
          } else {
            element.setAttribute('style', newValue);
          }
        } else {
          element.setAttribute(key, newValue);
        }
      } 
      // 如果值不同，更新属性
      else if (oldValue !== newValue) {
        if (key.startsWith('on')) {
          const eventName = key.slice(2).toLowerCase();
          element.removeEventListener(eventName, oldValue);
          element.addEventListener(eventName, newValue);
        } else if (key === 'style') {
          // 更新样式
          if (typeof newValue === 'object') {
            // 清除旧样式
            if (typeof oldValue === 'object') {
              Object.keys(oldValue).forEach(styleKey => {
                if (!(styleKey in newValue)) {
                  element.style[styleKey] = '';
                }
              });
            }
            // 设置新样式
            Object.entries(newValue).forEach(([styleKey, styleValue]) => {
              element.style[styleKey] = styleValue;
            });
          } else {
            element.setAttribute('style', newValue);
          }
        } else {
          element.setAttribute(key, newValue);
        }
      }
    });
  }
  
  // 对比子节点
  static diffChildren(oldVnode, newVnode, parentEl) {
    const oldChildren = oldVnode.children || [];
    const newChildren = newVnode.children || [];
    
    const maxLength = Math.max(oldChildren.length, newChildren.length);
    
    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];
      
      if (oldChild === undefined) {
        // 新增节点
        const newEl = this.createElement(newChild);
        parentEl.appendChild(newEl);
      } else if (newChild === undefined) {
        // 删除节点
        if (oldChild.el && oldChild.el.parentNode) {
          oldChild.el.parentNode.removeChild(oldChild.el);
        }
      } else {
        // 更新节点
        this.diff(oldChild, newChild, parentEl, i);
      }
    }
  }
  
  // 使用key优化的diff算法
  static keyedDiff(oldVnode, newVnode, parentEl) {
    if (!oldVnode || !newVnode) return;
    
    // 如果是文本节点或类型不同，直接替换
    if (typeof oldVnode !== typeof newVnode || 
        (oldVnode.tag && newVnode.tag && oldVnode.tag !== newVnode.tag)) {
      const newEl = this.createElement(newVnode);
      parentEl.replaceChild(newEl, oldVnode.el);
      return;
    }
    
    // 更新节点属性
    this.updateElementAttributes(oldVnode.el, oldVnode.attrs, newVnode.attrs);
    
    // 对子节点进行keyed diff
    this.keyedDiffChildren(oldVnode, newVnode, parentEl);
  }
  
  // 使用key优化的子节点diff
  static keyedDiffChildren(oldVnode, newVnode, parentEl) {
    const oldChildren = oldVnode.children || [];
    const newChildren = newVnode.children || [];
    
    let oldStartIdx = 0;
    let newStartIdx = 0;
    let oldEndIdx = oldChildren.length - 1;
    let newEndIdx = newChildren.length - 1;
    
    let oldStartVnode = oldChildren[oldStartIdx];
    let newStartVnode = newChildren[newStartIdx];
    let oldEndVnode = oldChildren[oldEndIdx];
    let newEndVnode = newChildren[newEndIdx];
    
    const oldKeyMap = {};
    // 构建旧节点的key映射
    for (let i = 0; i <= oldEndIdx; i++) {
      const key = oldChildren[i].key;
      if (key) {
        oldKeyMap[key] = i;
      }
    }
    
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (!oldStartVnode) {
        oldStartVnode = oldChildren[++oldStartIdx];
      } else if (!oldEndVnode) {
        oldEndVnode = oldChildren[--oldEndIdx];
      } else if (this.isSameKey(oldStartVnode, newStartVnode)) {
        // 头头相同，更新节点
        this.diff(oldStartVnode, newStartVnode, parentEl, oldStartIdx);
        oldStartVnode = oldChildren[++oldStartIdx];
        newStartVnode = newChildren[++newStartIdx];
      } else if (this.isSameKey(oldEndVnode, newEndVnode)) {
        // 尾尾相同，更新节点
        this.diff(oldEndVnode, newEndVnode, parentEl, oldEndIdx);
        oldEndVnode = oldChildren[--oldEndIdx];
        newEndVnode = newChildren[--newEndIdx];
      } else if (this.isSameKey(oldStartVnode, newEndVnode)) {
        // 头尾相同，移动节点
        if (oldStartVnode.el && oldStartVnode.el.parentNode === parentEl) {
          parentEl.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
        }
        this.diff(oldStartVnode, newEndVnode, parentEl, oldStartIdx);
        oldStartVnode = oldChildren[++oldStartIdx];
        newEndVnode = newChildren[--newEndIdx];
      } else if (this.isSameKey(oldEndVnode, newStartVnode)) {
        // 尾头相同，移动节点
        if (oldEndVnode.el && oldEndVnode.el.parentNode === parentEl) {
          parentEl.insertBefore(oldEndVnode.el, oldStartVnode.el);
        }
        this.diff(oldEndVnode, newStartVnode, parentEl, oldEndIdx);
        oldEndVnode = oldChildren[--oldEndIdx];
        newStartVnode = newChildren[++newStartIdx];
      } else {
        // 没有找到相同的节点，尝试使用key查找
        const idxInOld = oldKeyMap[newStartVnode.key];
        if (idxInOld === undefined) {
          // 新增节点
          const newEl = this.createElement(newStartVnode);
          if (oldStartVnode && oldStartVnode.el) {
            parentEl.insertBefore(newEl, oldStartVnode.el);
          } else {
            parentEl.appendChild(newEl);
          }
          newStartVnode = newChildren[++newStartIdx];
        } else {
          // 移动节点
          const movedVnode = oldChildren[idxInOld];
          if (movedVnode.el && movedVnode.el.parentNode === parentEl) {
            if (oldStartVnode && oldStartVnode.el) {
              parentEl.insertBefore(movedVnode.el, oldStartVnode.el);
            } else {
              parentEl.appendChild(movedVnode.el);
            }
          }
          this.diff(movedVnode, newStartVnode, parentEl, idxInOld);
          oldChildren[idxInOld] = undefined;
          newStartVnode = newChildren[++newStartIdx];
        }
      }
    }
    
    // 处理剩余的旧节点
    while (oldStartIdx <= oldEndIdx) {
      if (oldStartVnode) {
        if (oldStartVnode.el && oldStartVnode.el.parentNode === parentEl) {
          parentEl.removeChild(oldStartVnode.el);
        }
        oldStartIdx++;
      }
      if (oldStartIdx <= oldEndIdx) {
        oldStartVnode = oldChildren[oldStartIdx];
      }
    }
    
    // 处理剩余的新节点
    while (newStartIdx <= newEndIdx) {
      const newEl = this.createElement(newChildren[newStartIdx]);
      if (oldStartIdx <= oldEndIdx && oldStartVnode && oldStartVnode.el) {
        parentEl.insertBefore(newEl, oldStartVnode.el);
      } else {
        parentEl.appendChild(newEl);
      }
      newStartIdx++;
    }
  }
  
  // 判断两个节点是否具有相同的key
  static isSameKey(vnode1, vnode2) {
    return vnode1.key === vnode2.key;
  }
}

// 批量更新优化
class BatchUpdater {
  constructor() {
    this.pendingUpdates = new Set();
    this.isFlushing = false;
    this.watchCallbacks = new Map(); // 存储watch回调列表
  }
  
  add(component, key, value, oldVal) {
    this.pendingUpdates.add(component);
    
    // 存储watch回调信息列表
    if (key !== undefined) {
      if (!this.watchCallbacks.has(component)) {
        this.watchCallbacks.set(component, []);
      }
      this.watchCallbacks.get(component).push({ key, value, oldVal });
    }
    
    this.scheduleFlush();
  }
  
  scheduleFlush() {
    if (!this.isFlushing) {
      this.isFlushing = true;
      Promise.resolve().then(() => {
        this.flush();
      });
    }
  }
  
  flush() {
    this.pendingUpdates.forEach(component => {
      component.update();
      
      // 触发watch回调列表
      const watchList = this.watchCallbacks.get(component);
      if (watchList && watchList.length > 0) {
        watchList.forEach(watchInfo => {
          component.triggerWatch(watchInfo.key, watchInfo.value, watchInfo.oldVal);
        });
      }
    });
    this.pendingUpdates.clear();
    this.watchCallbacks.clear();
    this.isFlushing = false;
  }
}

// 新增批量更新器实例
const batchUpdater = new BatchUpdater();

export class Component {
  static version = '1.1.0';
  
  constructor(name, options, parent = null) {
    this.name = name;
    this.options = options || {};
    this.parent = parent || null; // 确保 parent 被正确设置
    this.props = (options && options.props) || {};
    this.render = (options && options.render) || (() => {}); // 确保 render 函数存在;
    let data;
    if (options?.data && typeof options?.data === "function") {
      data = { ...options?.data?.(), ...this.props };
    } else {
      data = { ...this.props };
    }
    this.data = this.observe(data); // 数据响应式处理
    this.methods = (options && options.methods) || {};
    this.watch = (options && options.watch) || {};
    this.$slots = (options && options.slots) || {};
    this.el = null;
    this.isMounted = false;
    this.computed = (options && options.computed) || {};
    this.vnode = null; // 新增虚拟节点属性
    // 新增 SSR 相关属性
    this.isServer = typeof window === "undefined";
    this.ssrContext = options?.ssrContext || null;
    // 新增缓存相关属性
    this._cache = null;
    this._cacheKey = null;
    this.$i18n = parent?.$i18n || XRender.$i18n;
    // 新增生命周期钩子
    this._beforeMountHooks = [];
    this._mountedHooks = [];
    this._beforeUpdateHooks = [];
    this._updatedHooks = [];
    this._beforeUnmountHooks = [];
    this._unmountedHooks = [];
    this._errorCapturedHooks = [];
    this._renderTrackedHooks = [];
    this._renderTriggeredHooks = [];
    this._activatedHooks = [];
    this._deactivatedHooks = [];
    this._isSFC = options && options.isSFC; // 标记是否为 SFC 组件
    this.beforeCreate = options?.beforeCreate || (() => {});
    this.created = options?.created || (() => {});
    this.beforeMount = (options && options.beforeMount) || (() => {});
    this.mounted = options?.mounted || (() => {});
    this.beforeUpdate = (options && options.beforeUpdate) || (() => {});
    this.updated = (options && options.updated) || (() => {});
    this.beforeDestroy = options?.beforeDestroy || (() => {});
    this.destroyed = options?.destroyed || (() => {});
    this.beforeUnmount = (options && options.beforeUnmount) || (() => {});
    this.unmounted = (options && options.unmounted) || (() => {});
    this.setup = (options && options.setup) || (() => ({}));
    // 共享$实例的属性和方法
    if (parent) {
      Object.keys(parent).forEach((key) => {
        if (!this[key]) {
          this[key] = parent[key];
        }
      });
    }

    // 过渡动画相关属性
    this.transition = options?.transition || null;
    this.transitionClasses = {
      enter: "v-enter",
      enterActive: "v-enter-active",
      leave: "v-leave",
      leaveActive: "v-leave-active",
      fadeEnter: "fade-enter",
      fadeEnterActive: "fade-enter-active",
      fadeLeave: "fade-leave",
      fadeLeaveActive: "fade-leave-active",
      scaleEnter: "scale-enter",
      scaleEnterActive: "scale-enter-active",
      scaleLeave: "scale-leave",
      scaleLeaveActive: "scale-leave-active",
      slideEnter: "slide-enter",
      slideEnterActive: "slide-enter-active",
      slideLeave: "slide-leave",
      slideLeaveActive: "slide-leave-active",
      ...options?.transitionClasses,
    };
    // 新增性能优化相关属性
    this._debounceUpdate = null; // 防抖更新
    this._throttleUpdate = function () {
      let timeoutId = null;
      return function () {
        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            this.update();
            timeoutId = null;
          }, 100); // 100ms 的节流间隔
        }
      };
    }; // 节流更新
    this._updateQueue = []; // 批量更新队列
    this._isUpdating = false; // 是否正在更新

    // 增强错误处理
    this._errorHandler = (error) => {
      console.error(`[${this.name}] Error:`, error);
      XRender._errorHandler?.(error);
    };
    // 新增 Mixins 支持
    this.mixins = options?.mixins || [];
    // 新增错误边界
    this.errorCaptured = options.errorCaptured || null;
    // 新增上下文订阅管理
    this._contextSubscriptions = new Set();
    // 新增 effects 数组用于追踪依赖
    this._effects = [];
    // 新增 watchEffects 数组用于存储 watch 和 watchEffect
    this._watchEffects = [];
    
    // 添加render方法，用于创建虚拟DOM
    if (options?.render) {
      this.render = options.render.bind(this);
    }
    
    return this;
  }

  init() {
    if (this._cacheKey) {
      const cached = this.getFromCache(this._cacheKey);
      if (cached) {
        this.el = cached;
        return this;
      }
    }
    this._applyMixins();
    this.initComputed();
    // 初始化观察者
    this.initWatcher();
    // 生命周期钩子调用
    this.beforeCreate?.call(this);
    this.created?.call(this);
    // 调用 setup() 函数（必须在 beforeMount 之前调用）
    setCurrentInstance(this);
    try {
      const setupResult = this.options.setup?.call(this);
      if (setupResult) {
        // 将 setup 返回的值合并到组件实例
        Object.assign(this, setupResult);
      }
    } finally {
      setCurrentInstance(null);
    }
    // 调用 onBeforeMount 钩子（需要重新设置 currentInstance）
    setCurrentInstance(this);
    this._callLifecycleHooks('beforeMount');
    setCurrentInstance(null);
    this.beforeMount?.call(this);
    
    // 处理 SFC 组件
    if (this._isSFC) {
      // 对于 SFC 组件，直接渲染模板并创建 DOM 元素
      this._renderSFC();
    } else {
      // 对于常规组件，使用原有逻辑
      this._setupComponent();
    }
    
    this.mounted?.call(this);
    // 调用 onMounted 钩子（需要重新设置 currentInstance）
    setCurrentInstance(this);
    this._callLifecycleHooks('mounted');
    setCurrentInstance(null);
    return this;
  }

  // 新增方法：清理上下文订阅
  _cleanupContextSubscriptions() {
    this._contextSubscriptions.forEach((unsubscribe) => unsubscribe());
    this._contextSubscriptions.clear();
  }

  // SFC 组件渲染方法
  _renderSFC() {
    try {
      // 如果没有 SFC 描述符，则使用现有模板
      if (!this.options.sfcDescriptor) {
        console.warn(`[${this.name}] SFC 组件缺少描述符，使用默认模板`);
        this.el = this.render?.call(this, createElem.bind(this)) || createElem.call(this, 'div', {}, []);
        return;
      }

      const { sfcDescriptor, render, styles } = this.options;

      // 处理样式注入
      if (styles && styles.length > 0) {
        this._injectStyles(styles, sfcDescriptor.scopeId);
      }

      // 如果有渲染函数，直接使用
      if (typeof render === 'function') {
        this.vnode = render.call(this, createElem.bind(this));
        // 检查vnode是否已经是真实DOM元素
        if (this.vnode && typeof this.vnode.nodeType === 'number') {
          this.el = this.vnode;
        } else {
          this.el = VDOMUtils.createElement(this.vnode);
        }
      } else {
        // 退回到使用模板字符串创建 DOM
        console.warn(`[${this.name}] SFC 组件没有渲染函数，使用模板字符串`);
        this.el = this.render?.call(this, createElem.bind(this)) || createElem.call(this, 'div', {}, []);
      }

      // 方法绑定和代理
      if (this.methods) {
        Object.entries(this.methods).forEach(([key, value]) => {
          this[key] = value.bind(this);
        });
      }

      // 应用进入过渡
      if (this.transition) {
        this.applyTransition(this.el, "enter", {
          name: this.transition,
          duration: 500,
        });
      }
    } catch (error) {
      console.error(`[${this.name}] SFC 渲染错误:`, error);
      this._errorHandler(error);
      
      // 在错误情况下创建备用元素
      this.el = createElem.call(this, 'div', {}, [
        createElem.call(this, 'p', {}, [`渲染错误: ${error.message}`])
      ]);
    }
  }

  // 注入样式到页面
  _injectStyles(styles, scopeId) {
    if (!styles || !Array.isArray(styles) || styles.length === 0) {
      return;
    }

    // 创建或获取样式元素
    let styleElement = document.getElementById(`xrt-styles-${scopeId}`);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = `xrt-styles-${scopeId}`;
      document.head.appendChild(styleElement);
    }

    // 添加样式内容
    const styleContent = styles.map(style => {
      // 如果启用作用域样式，添加 scopeId 前缀
      if (scopeId && this.options.scopeStyles) {
        return this._transformStyleRules(style, scopeId);
      }
      return style;
    }).join('\n');

    styleElement.textContent = styleContent;
  }

  // 转换样式规则以添加作用域
  _transformStyleRules(style, scopeId) {
    // 简单的选择器转换逻辑，实际实现会更复杂
    // 这里只是将所有选择器添加 [data-scope-id] 属性选择器
    return style.replace(/([^{}]+)\{/g, (match, selector) => {
      // 跳过特殊选择器
      if (selector.trim().startsWith('@') || selector.includes('global')) {
        return match;
      }
      
      // 为选择器添加作用域
      const scopedSelector = selector.split(',').map(sel => {
        sel = sel.trim();
        // 如果选择器已经是子选择器，则直接在末尾添加
        if (sel.startsWith('[') || sel.startsWith('.') || sel.startsWith('#')) {
          return `${sel}[data-scope-id="${scopeId}"]`;
        }
        // 其他情况添加后代选择器
        return `${sel}[data-scope-id="${scopeId}"]`;
      }).join(', ');
      
      return `${scopedSelector} {`;
    });
  }

  // 生成作用域 ID
  _generateScopeId() {
    // 生成一个唯一的 ID 用于样式作用域
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  // 调用组合式 API 的生命周期钩子
  _callLifecycleHooks(hookName) {
    const hooksMap = {
      'mounted': this._mountedHooks,
      'updated': this._updatedHooks,
      'unmounted': this._unmountedHooks,
      'beforeMount': this._beforeMountHooks,
      'beforeUpdate': this._beforeUpdateHooks,
      'beforeUnmount': this._beforeUnmountHooks,
      'errorCaptured': this._errorCapturedHooks,
      'renderTracked': this._renderTrackedHooks,
      'renderTriggered': this._renderTriggeredHooks,
      'activated': this._activatedHooks,
      'deactivated': this._deactivatedHooks
    };

    const hooks = hooksMap[hookName];
    if (hooks && hooks.length > 0) {
      hooks.forEach(hook => {
        try {
          hook();
        } catch (error) {
          console.error(`[XRender] Error in ${hookName} hook:`, error);
          if (this.errorCaptured) {
            this.errorCaptured(error);
          }
        }
      });
    }
  }

  // 清理 watchEffects
  _cleanupWatchEffects() {
    if (this._watchEffects) {
      this._watchEffects = [];
    }
    if (this._postWatchEffects) {
      this._postWatchEffects = [];
    }
    if (this._syncWatchEffects) {
      this._syncWatchEffects = [];
    }
  }
  destroy() {
    this.beforeDestroy?.call(this);
    // 调用 onBeforeUnmount 钩子（需要设置 currentInstance）
    setCurrentInstance(this);
    this._callLifecycleHooks('beforeUnmount');
    setCurrentInstance(null);
    this.beforeUnmount?.call(this);
    this.unmount();
    this.destroyed?.call(this);
    this.unmounted?.call(this);
    // 调用 onUnmounted 钩子（需要设置 currentInstance）
    setCurrentInstance(this);
    this._callLifecycleHooks('unmounted');
    setCurrentInstance(null);
    // 清理 watchEffects
    this._cleanupWatchEffects();
  }
  // 新增：捕获错误
  captureError(error) {
    if (this.errorCaptured) {
      this.errorCaptured(error);
    } else if (this.parent) {
      this.parent.captureError(error);
    } else {
      console.error("Uncaught error:", error);
    }
  }
  getFromCache(key) {
    return this.parent?._cache?.[key];
  }

  // 新增 Mixins 应用方法
  _applyMixins() {
    this.mixins.forEach((mixin) => {
      // 合并 data
      if (mixin.data) {
        const mixinData =
          typeof mixin.data === "function" ? mixin.data() : mixin.data;
        this.data = { ...mixinData, ...this.data };
      }

      // 合并 methods
      if (mixin.methods) {
        this.methods = { ...mixin.methods, ...this.methods };
      }

      // 合并生命周期钩子
      ["beforeMount", "beforeUpdate", "updated", "beforeUnmount"].forEach(
        (hook) => {
          const mixinHook = mixin[hook];
          const originalHook = this[hook];

          if (mixinHook) {
            this[hook] = function () {
              mixinHook.call(this);
              if (originalHook) {
                originalHook.call(this);
              }
            };
          }
        }
      );

      // 合并 computed
      if (mixin.computed) {
        this.computed = { ...mixin.computed, ...this.computed };
      }

      // 合并 watch
      if (mixin.watch) {
        this.watch = { ...mixin.watch, ...this.watch };
      }
    });
  }

  // 包装方法调用
  _safeCall(fn, ...args) {
    try {
      return fn.call(this, ...args);
    } catch (error) {
      this._errorHandler(error);
    }
  }

  // 新增批量更新方法
  batchUpdate(callback) {
    this._updateQueue.push(callback);
    if (!this._isUpdating) {
      this._isUpdating = true;
      
      // 直接执行更新，而不是使用 requestAnimationFrame
      const fragment = doc.createDocumentFragment(); // 创建 DocumentFragment
      this._updateQueue.forEach((cb) => cb(fragment));
      const isNodeInFragment = function (fragment, node) {
        return Array.from(fragment.childNodes).some(
          (child) => child === node || child.contains(node)
        );
      };
      if (!isNodeInFragment(fragment, this.el)) {
        this.el.appendChild(fragment); // 一次性插入所有更新
      }
      this._updateQueue = [];
      this._isUpdating = false;
      
      // 触发 nextTick 回调
      XRender.nextTick(() => {});
    }
  }

  // 新增缓存方法
  cache() {
    const cacheExpiration = 60 * 1000; // 缓存有效期 60 秒
    this._cache = {
      node: this.el.cloneNode(true),
      timestamp: Date.now(),
    };
    this._cacheKey = this.vnode.key;
  }

  restoreFromCache() {
    if (this._cache && Date.now() - this._cache.timestamp < 60 * 1000) {
      this.el.parentNode.replaceChild(this._cache.node, this.el);
      this.el = this._cache.node;
      this._cache = null;
    }
  }

  // 新增 SSR 渲染方法
  renderToString() {
    if (!this.isServer) return "";
    return this.el.outerHTML;
  }

  // 增强的过渡动画方法
  applyTransition(el, type, options = {}) {
    if (!this.transition) return;
    
    const {
      name = this.transition.name || 'v',
      duration = this.transition.duration || 300,
      mode = 'in-out',
      appear = false,
      delay = 0,
      easing = 'ease',
      classes = {}
    } = options;

    // 合并自定义类名
    const transitionClasses = {
      enter: `${name}-enter`,
      enterActive: `${name}-enter-active`,
      enterTo: `${name}-enter-to`,
      leave: `${name}-leave`,
      leaveActive: `${name}-leave-active`,
      leaveTo: `${name}-leave-to`,
      move: `${name}-move`,
      moveActive: `${name}-move-active`,
      ...this.transitionClasses,
      ...classes
    };

    const applyWithDelay = (callback) => {
      if (delay > 0) {
        setTimeout(callback, delay);
      } else {
        callback();
      }
    };

    if (type === "enter") {
      applyWithDelay(() => {
        // 设置初始状态
        el.classList.add(`${name}-enter`, `${name}-enter-from`);
        el.style.transitionDuration = `${duration}ms`;
        el.style.transitionTimingFunction = easing;
        
        // 触发重绘
        el.offsetHeight;
        
        // 进入动画开始
        el.classList.remove(`${name}-enter-from`);
        el.classList.add(`${name}-enter-to`, `${name}-enter-active`);
        
        // 清理类名
        setTimeout(() => {
          el.classList.remove(
            `${name}-enter`, 
            `${name}-enter-to`, 
            `${name}-enter-active`
          );
        }, duration);
      });
      
    } else if (type === "leave") {
      applyWithDelay(() => {
        // 设置初始状态
        el.classList.add(`${name}-leave`, `${name}-leave-from`);
        el.style.transitionDuration = `${duration}ms`;
        el.style.transitionTimingFunction = easing;
        
        // 触发重绘
        el.offsetHeight;
        
        // 离开动画开始
        el.classList.remove(`${name}-leave-from`);
        el.classList.add(`${name}-leave-to`, `${name}-leave-active`);
        
        // 清理类名
        setTimeout(() => {
          el.classList.remove(
            `${name}-leave`, 
            `${name}-leave-to`, 
            `${name}-leave-active`
          );
        }, duration);
      });
    }
  }

  // 过渡组动画方法
  applyTransitionGroup(elements, type, options = {}) {
    if (!this.transition) return;
    
    const {
      name = this.transition.name || 'v',
      duration = this.transition.duration || 300,
      moveClass = `${name}-move`
    } = options;

    if (type === "move" && elements.length > 1) {
      // FLIP (First, Last, Invert, Play) 动画算法
      const firstRects = Array.from(elements).map(el => ({
        el,
        rect: el.getBoundingClientRect()
      }));

      elements.forEach(el => {
        el.classList.add(moveClass);
      });

      requestAnimationFrame(() => {
        const lastRects = Array.from(elements).map(el => ({
          el,
          rect: el.getBoundingClientRect()
        }));

        firstRects.forEach((first, index) => {
          const last = lastRects[index];
          const dx = first.rect.left - last.rect.left;
          const dy = first.rect.top - last.rect.top;

          if (dx !== 0 || dy !== 0) {
            // 应用变换
            first.el.style.transform = `translate(${dx}px, ${dy}px)`;
            first.el.style.transition = 'transform 0s';
            
            // 触发重绘
            first.el.offsetHeight;
            
            // 播放动画
            first.el.style.transition = `transform ${duration}ms ease`;
            first.el.style.transform = '';
            
            // 清理
            setTimeout(() => {
              first.el.style.transition = '';
              first.el.classList.remove(moveClass);
            }, duration);
          }
        });
      });
    }
  }

  // CSS 动画方法
  applyCSSAnimation(el, animationName, options = {}) {
    const {
      duration = 300,
      delay = 0,
      easing = 'ease',
      fillMode = 'forwards',
      iterations = 1
    } = options;

    el.style.animation = `${animationName} ${duration}ms ${easing} ${delay}ms ${iterations} ${fillMode}`;
    
    if (fillMode === 'forwards') {
      setTimeout(() => {
        el.style.animation = '';
      }, duration + delay);
    }
  }

  initComputed() {
    this._computedCache = {};
    this._computedDeps = {};
    
    Object.entries(this.computed).forEach(([key, fn]) => {
      let lastValue = undefined;
      let hasCached = false;
      
      Object.defineProperty(this.data, key, {
        get: () => {
          const value = fn.call(this);
          
          if (hasCached && this._computedCache[key] !== value) {
            const oldValue = this._computedCache[key];
            this._computedCache[key] = value;
            this.triggerWatch(key, value, oldValue);
          } else if (!hasCached) {
            this._computedCache[key] = value;
            hasCached = true;
          }
          
          return this._computedCache[key];
        },
        enumerable: true,
        configurable: true
      });
    });
  }
  
  _clearComputedCache(key) {
    if (key) {
      delete this._computedCache[key];
    } else {
      this._computedCache = {};
    }
  }
  
  _getNestedValue(obj, path) {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result && typeof result === 'object') {
        result = result[key];
      } else {
        return undefined;
      }
    }
    return result;
  }
  
  _triggerDeepWatchers(changedKey = null) {
    if (!this._watchers) return;

    this._watchers.forEach(watcher => {
      if (!watcher.deep) return;

      const shouldCheck = !changedKey || 
        changedKey === watcher.key || 
        changedKey.startsWith(watcher.key + '.');

      if (!shouldCheck) return;

      const value = this._getNestedValue(this.data, watcher.key);
      const hasChanged = this._deepEquals(value, watcher._lastDeepValue) === false;

      if (hasChanged) {
        const oldValue = watcher._lastDeepValue;
        watcher._lastDeepValue = this._deepClone(value);
        this._executeWatcher(watcher, value, oldValue);
      }
    });
  }

  _deepEquals(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this._deepEquals(a[key], b[key])) return false;
    }

    return true;
  }

  _deepClone(obj) {
    if (obj == null) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this._deepClone(item));
    
    const cloned = {};
    const keys = Object.keys(obj);
    for (const key of keys) {
      cloned[key] = this._deepClone(obj[key]);
    }
    return cloned;
  }

  // 数据响应式实现
  observe(data, parentPath = '') {
    if (data && data.__observed__) {
      return data;
    }
    const vm = this;

    // 如果是数组，重写数组方法
    if (Array.isArray(data)) {
      const arrayMethods = [
        "push",
        "pop",
        "shift",
        "unshift",
        "splice",
        "sort",
        "reverse",
      ];
      arrayMethods.forEach((method) => {
        const original = Array.prototype[method];
        Object.defineProperty(data, method, {
          value: function (...args) {
            const oldVal = [...this];
            const result = original.apply(this, args);
            
            if (vm._watchEffects && vm._watchEffects.length > 0) {
              vm._watchEffects.forEach(effect => {
                if (typeof effect === 'function') {
                  try {
                    effect();
                  } catch (error) {
                    console.error('[observe] Error in watchEffect:', error);
                  }
                }
              });
            }
            
            // Also trigger global watch effects
            if (typeof getGlobalWatchEffects !== 'undefined') {
              getGlobalWatchEffects().forEach(effect => {
                if (typeof effect === 'function') {
                  try {
                    effect();
                  } catch (error) {
                    console.error('[observe] Error in global watchEffect:', error);
                  }
                }
              });
            }
            
            vm.update();
            vm.triggerWatch(method, this, oldVal);
            vm._triggerDeepWatchers();
            return result;
          },
          enumerable: false,
          writable: true,
          configurable: true
        });
      });
    }

    // 递归地为嵌套对象创建 Proxy
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data);
      for (const key of keys) {
        const value = data[key];
        if (typeof value === 'object' && value !== null && !value.__observed__) {
          const currentPath = parentPath ? `${parentPath}.${key}` : key;
          data[key] = vm.observe(value, currentPath);
        }
      }
    }

    const handler = {
      get(target, key) {
        const value = Reflect.get(target, key);
        
        if (vm._effects && vm._effects.length > 0) {
          vm._effects.forEach(effect => {
            if (effect.active) {
              effect.deps.add(key);
            }
          });
        }
        
        if (
          typeof value === "object" &&
          value !== null &&
          !value.__observed__
        ) {
          const currentPath = parentPath ? `${parentPath}.${key}` : key;
          return vm.observe(value, currentPath);
        }
        return value;
      },
      set(target, key, value) {
        const oldVal = Reflect.get(target, key);
        const result = Reflect.set(target, key, value);
        if (oldVal !== value) {
          XRender.queueUpdate(vm, key, value, oldVal);
          vm._clearComputedCache();
          
          if (vm._effects && vm._effects.length > 0) {
            vm._effects.forEach(effect => {
              if (effect.active && effect.deps.has(key)) {
                if (effect.scheduler) {
                  effect.scheduler();
                } else {
                  effect.fn.call(vm);
                  effect.hasRun = true;
                }
              }
            });
          }
          
          if (vm._watchEffects && vm._watchEffects.length > 0) {
            vm._watchEffects.forEach(effect => {
              if (typeof effect === 'function') {
                try {
                  effect();
                } catch (error) {
                  console.error('[observe] Error in watchEffect:', error);
                }
              }
            });
          }
          
          // Also trigger global watch effects
          if (typeof getGlobalWatchEffects !== 'undefined') {
            getGlobalWatchEffects().forEach(effect => {
              if (typeof effect === 'function') {
                try {
                  effect();
                } catch (error) {
                  console.error('[observe] Error in global watchEffect:', error);
                }
              }
            });
          }
          
          vm.update();
          
          if (vm && typeof vm._triggerDeepWatchers === 'function') {
            const fullPath = parentPath ? `${parentPath}.${key}` : key;
            vm._triggerDeepWatchers(fullPath);
          }
        }
        return result;
      },
      deleteProperty(target, key) {
        const oldVal = Reflect.get(target, key);
        const result = Reflect.deleteProperty(target, key);
        // 如果删除成功，触发更新
        if (result && oldVal !== undefined) {
          if (vm._watchEffects && vm._watchEffects.length > 0) {
            vm._watchEffects.forEach(effect => {
              if (typeof effect === 'function') {
                try {
                  effect();
                } catch (error) {
                  console.error('[observe] Error in watchEffect:', error);
                }
              }
            });
          }
          
          // Also trigger global watch effects
          if (typeof getGlobalWatchEffects !== 'undefined') {
            getGlobalWatchEffects().forEach(effect => {
              if (typeof effect === 'function') {
                try {
                  effect();
                } catch (error) {
                  console.error('[observe] Error in global watchEffect:', error);
                }
              }
            });
          }
          
          vm.update();
          vm.triggerWatch(key, undefined, oldVal);
          vm._triggerDeepWatchers();
        }
        return result;
      },
    };

    const proxy = new Proxy(data || {}, handler);
    Object.defineProperty(proxy, "__observed__", {
      value: true,
      enumerable: false,
      writable: false,
      configurable: false,
    });
    return proxy;
  }
  // 新增事件机制
  $emit(eventName, ...args) {
    const callbacks = this._events?.[eventName];
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }

  // 观察者模式实现
  initWatcher() {
    this._watchers = [];
    
    if (this.watch) {
      Object.entries(this.watch).forEach(([key, handler]) => {
        let watcher = null;
        
        if (typeof handler === 'function') {
          watcher = {
            key,
            handler,
            deep: false,
            immediate: false,
            lazy: false
          };
        } else if (typeof handler === 'object') {
          watcher = {
            key,
            handler: handler.handler || handler.callback,
            deep: handler.deep || false,
            immediate: handler.immediate || false,
            lazy: handler.lazy || false
          };
        }
        
        if (watcher && watcher.handler) {
          this._watchers.push(watcher);

          if (watcher.deep) {
            const value = this._getNestedValue(this.data, watcher.key);
            watcher._lastDeepValue = this._deepClone(value);
          }

          if (watcher.immediate) {
            this._executeWatcher(watcher, this.data[watcher.key], undefined);
          }
        }
      });
    }
  }

  // 执行监听器
  _executeWatcher(watcher, newVal, oldVal) {
    try {
      if (typeof watcher.handler === 'function') {
        // 确保this指向组件实例
        const componentInstance = this;
        watcher.handler.call(componentInstance, newVal, oldVal);
      }
    } catch (error) {
      console.error(`[XRender Watch] Error in watcher for "${watcher.key}":`, error);
    }
  }

  // 触发监听回调
  triggerWatch(key, newVal, oldVal) {
    if (this._watchers) {
      this._watchers.forEach(watcher => {
        if (watcher.key === key) {
          this._executeWatcher(watcher, newVal, oldVal);
        }
      });
    }
  }
  
  // 新增 $watch 方法，支持动态添加监听器
  $watch(keyOrFn, handler, options = {}) {
    const watcher = {
      key: typeof keyOrFn === 'function' ? null : keyOrFn,
      getter: typeof keyOrFn === 'function' ? keyOrFn : null,
      handler,
      deep: options.deep || false,
      immediate: options.immediate || false,
      lazy: options.lazy || false
    };
    
    if (!this._watchers) {
      this._watchers = [];
    }
    
    this._watchers.push(watcher);
    
    if (watcher.immediate) {
      const value = watcher.getter ? watcher.getter.call(this) : this.data[watcher.key];
      this._executeWatcher(watcher, value, undefined);
    }
    
    return () => {
      const index = this._watchers.indexOf(watcher);
      if (index > -1) {
        this._watchers.splice(index, 1);
      }
    };
  }
  
  // 新增 watchEffect 功能，自动追踪依赖
  $watchEffect(effect, options = {}) {
    if (!this._effects) {
      this._effects = [];
    }
    
    const effectRunner = {
      fn: effect,
      deps: new Set(),
      active: true,
      scheduler: options.scheduler || null,
      lazy: options.lazy || false,
      hasRun: false
    };
    
    const runner = () => {
      if (!effectRunner.active) return;
      
      try {
        effectRunner.deps.clear();
        const result = effectRunner.fn.call(this);
        effectRunner.hasRun = true;
        return result;
      } catch (error) {
        console.error('[XRender watchEffect] Error:', error);
      }
    };
    
    this._effects.push(effectRunner);
    
    const stop = () => {
      effectRunner.active = false;
      const index = this._effects.indexOf(effectRunner);
      if (index > -1) {
        this._effects.splice(index, 1);
      }
    };
    
    if (!effectRunner.lazy) {
      runner();
    } else {
      // 对于lazy watchEffect，仍然需要追踪依赖但不执行
      try {
        effectRunner.deps.clear();
        effectRunner.fn.call(this);
      } catch (error) {
        console.error('[XRender watchEffect] Error during dependency tracking:', error);
      }
    }
    
    return stop;
  }
  
  // 新增 watchPostEffect，在 DOM 更新后执行
  $watchPostEffect(effect) {
    return this.$watchEffect(effect, {
      scheduler: () => {
        Promise.resolve().then(effect);
      }
    });
  }
  
  // 新增 watchSyncEffect，同步执行
  $watchSyncEffect(effect) {
    return this.$watchEffect(effect, {
      scheduler: effect
    });
  }

  // 新增更新机制
  update() {
    const that = this;
    try {
      if (this.el.getAttribute("data-static") === "true") {
        return;
      }
      if (this._cacheKey) {
        this.cache(this._cacheKey);
      }
      this.batchUpdate((fragment) => {
        // 调用 onBeforeUpdate 钩子（需要设置 currentInstance）
        setCurrentInstance(that);
        that._callLifecycleHooks('beforeUpdate');
        setCurrentInstance(null);
        that.beforeUpdate?.call(that);
        if (that.isMounted) {
            // 获取新的虚拟DOM或真实DOM
            const newVnode = that.render.call(that, function () {
              return createElem.call(that, ...arguments);
            });
            
            // 检查newVnode是否已经是真实DOM元素
            if (newVnode && typeof newVnode.nodeType === 'number') {
              // 如果是真实DOM元素，直接替换
              if (that.el.parentNode) {
                that.el.parentNode.replaceChild(newVnode, that.el);
                that.el = newVnode;
              }
            } else if (that.vnode) {
              // 使用key优化的diff算法
              VDOMUtils.keyedDiff(that.vnode, newVnode, that.el.parentNode);
              that.vnode = newVnode;
            } else {
              // 初次渲染
              that.vnode = newVnode;
              that.el = VDOMUtils.createElement(that.vnode);
            }
            
            // 调用 onUpdated 钩子（需要设置 currentInstance）
            setCurrentInstance(that);
            that._callLifecycleHooks('updated');
            setCurrentInstance(null);
            that.updated?.call(that);
          
          // 调用指令的 update 钩子
          Object.entries(XRender.directives).forEach(([name, directive]) => {
            const attributeName = `v-${name}`;
            const attributeValue = that.el.getAttribute(attributeName);
            if (that.el && attributeValue !== null) {
              const bindingValue = that.data[attributeValue] ?? attributeValue;
              directive.update?.call(
                that,
                that.el,
                { value: bindingValue },
                that
              );
            }
          });
        }
        XRender.nextTick(() => {
          that.updated?.call(that);
          // 调用 onUpdated 钩子（需要设置 currentInstance）
          setCurrentInstance(that);
          that._callLifecycleHooks('updated');
          setCurrentInstance(null);
        });
      });
    } catch (e) {
      this.errorCaptured?.(e);
    }
  }

  unmount() {
    const that = this;
    if (this.transition) {
      // 应用离开过渡
      this.applyTransition(this.el, "leave");
      setTimeout(() => {
        // 调用 beforeUnmount 钩子
        that.beforeUnmount?.call(that);

        // 清理事件监听器
        if (that._eventHandlers) {
          that._eventHandlers.forEach(({ elem, eventName, handler }) => {
            elem.removeEventListener(eventName, handler);
          });
          that._eventHandlers = null;
        }

        // 调用指令的 unbind 钩子
        Object.entries(XRender.directives).forEach(([name, directive]) => {
          directive.unbind?.(this.el, this);
        });

        // 清理 DOM 元素
        if (that.el && that.el.parentNode) {
          that.el.parentNode.removeChild(that.el);
        }

        // 清理数据观察
        that.data = null;

        // 清理计算属性
        that.computed = null;

        // 清理方法
        that.methods = null;

        // 清理 watch
        that.watch = null;

        // 清理 slots
        that.$slots = null;

        // 标记为未挂载
        that.isMounted = false;

        // 清理父组件引用
        that.parent = null;
        this._cleanupContextSubscriptions(); // 清理上下文订阅
      }, this.transition.duration || 300);
    } else {
      // 调用 beforeUnmount 钩子
      this.beforeUnmount?.call(this);

      // 清理事件监听器
      if (this._eventHandlers) {
        this._eventHandlers.forEach(({ elem, eventName, handler }) => {
          elem.removeEventListener(eventName, handler);
        });
        this._eventHandlers = null;
      }
      // 调用指令的 unbind 钩子
      Object.entries(XRender.directives).forEach(([name, directive]) => {
        directive.unbind?.(this.el, this);
      });
      // 清理 DOM 元素
      if (this.el && this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }

      // 清理数据观察
      this.data = null;

      // 清理计算属性
      this.computed = null;

      // 清理方法
      this.methods = null;

      // 清理 watch
      this.watch = null;

      // 清理 slots
      this.$slots = null;

      // 标记为未挂载
      this.isMounted = false;

      // 清理父组件引用
      this.parent = null;
      this._cleanupContextSubscriptions(); // 清理上下文订阅
    }
  }
  _setupComponent() {
    const vm = this;
    // 使用虚拟DOM创建元素
    if (this.render) {
      // 使用新的虚拟DOM渲染方式
      this.vnode = this.render.call(vm, function () {
        return createElem.call(vm, ...arguments);
      });
      // 检查vnode是否已经是真实DOM元素
      if (this.vnode && typeof this.vnode.nodeType === 'number') {
        this.el = this.vnode;
      } else {
        this.el = VDOMUtils.createElement(this.vnode);
      }
    } else {
      this.el = this.render.call(vm, function () {
        const elem = createElem.call(vm, ...arguments);
        return elem;
      });
    }

    // 方法绑定和代理
    if (this.methods) {
      Object.entries(this.methods).forEach(([key, value]) => {
        vm[key] = value.bind(vm);
      });
    }
    // 应用进入过渡
    if (this.transition) {
      this.applyTransition(this.el, "enter");
    }
    this.isMounted = true;
  }
}

const XRender = {
  components: {},
  el: null,
  _installedPlugins: [],
  $store: null,
  $router: null,
  $i18n: null,
  App: null,
  // 新增插件生命周期钩子
  _pluginHooks: {
    beforeCreate: [],
    created: [],
    beforeMount: [],
    mounted: [],
    beforeUpdate: [],
    updated: [],
    beforeUnmount: [],
    unmounted: [],
  },
  on(hook, callback) {
    this._pluginHooks[hook].push(callback);
  },
  // 新增全局混入功能
  mixins: [],
  mixin(mixin) {
    this.mixins.push(mixin);
  },
  // 新增错误处理
  _errorHandler: null,
  config: {
    errorHandler(fn) {
      this._errorHandler = fn;
    },
  },
  // 新增路由守卫
  _routerGuards: {
    beforeEach: [],
    afterEach: [],
  },
  beforeEach(guard) {
    this._routerGuards.beforeEach.push(guard);
  },
  afterEach(guard) {
    this._routerGuards.afterEach.push(guard);
  },
  _updateQueue: new Set(),
  _isUpdating: false,

  queueUpdate(component, key, value, oldVal) {
    // 使用新的批量更新器
    batchUpdater.add(component, key, value, oldVal);
    if (!this._isUpdating) {
      this._isUpdating = true;
      Promise.resolve().then(() => {
        this._isUpdating = false;
      });
    }
  },
  // 新增自定义指令功能
  directives: {},
  directive(name, options) {
    this.directives[name] = options;
    return this;
  },
  createApp(options) {
    const that = this;
    try {
      Object.entries(options).forEach(([key, value]) => {
        switch (key) {
          case "App":
            that.App = value;
            break;
          case "store":
            that.$store = value;
            break;
          case "router":
            that.$router = value;
            break;
          case "i18n":
            that.$i18n = value;
            break;
          default:
            that["$" + key] = value;
            break;
        }
      });
    } catch (e) {
      this._errorHandler?.(e);
    }

    return {
      $mount(selector) {
        that.query(selector).append(that.App);
        that.nextTick(() => {
          that.$router && that.$router.render();
        });
        //that.$router && that.$router.render();
        return that;
      },
    };
  },
  use(plugin) {
    if (this._installedPlugins.includes(plugin)) return this;
    try {
      const installFn = typeof plugin === "function" ? plugin : plugin.install;
      if (typeof installFn === "function") {
        installFn.call(plugin, this);
      }

      this._installedPlugins.push(plugin);
    } catch (error) {
      this._errorHandler?.(error);
    }
    return this;
  },
  query(selector) {
    this.el = doc.querySelector(selector);
    return this;
  },
  component(name, options) {
    this.components[name] = new Component(
      name,
      {
        ...options,
      },
      XRender
    );
    return this.components[name];
  },
  append(children) {
    const that = this;
    if (isComponent(children)) {
      const component = new children.constructor(
        children.name,
        {
          ...children.options,
          props: children.props,
        },
        XRender
      ).init();
      children = [component.el];
    } else if (Array.isArray(children))
      children = children.map((child) =>
        isComponent(child)
          ? new child.constructor(
              child.name,
              {
                ...child.options,
                props: children.props,
              },
              XRender
            ).init().el
          : child
      );
    else children = [children];
    children.forEach((child) => {
      that.el.appendChild(child);
    });
    return this;
  },
  unmountComponent(component) {
    if (component && component.unmount) {
      component.unmount();
    }
  },
  _nextTickCallbacks: [],
  _pending: false,

  // 新增 nextTick 方法
  nextTick(callback) {
    const that = this;
    this._nextTickCallbacks.push(callback);
    if (!that._pending) {
      that._pending = true;
      Promise.resolve().then(() => {
        that._pending = false;
        const copies = that._nextTickCallbacks.slice(0);
        that._nextTickCallbacks.length = 0;
        for (let i = 0; i < copies.length; i++) {
          if (typeof copies[i] === 'function') {
            copies[i]();
          }
        }
      });
    }
  },
  lazyLoad(component, placeholder) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (isComponent(component)) {
            const loadedComponent = new component.constructor(
              component.name,
              { ...component.options },
              XRender
            ).init();
            entry.target.replaceWith(loadedComponent.el);
          } else {
            entry.target.replaceWith(component);
          }
          observer.unobserve(entry.target);
        }
      });
    });

    observer.observe(placeholder);
    return placeholder;
  },
  asyncComponent(loader) {
    return {
      name: "AsyncComponent",
      data() {
        return {
          component: null,
        };
      },
      async mounted() {
        this.component = await loader();
        this.update();
      },
      render() {
        if (this.component) {
          return createElem(this.component);
        }
        return createElem("div", {}, "加载中...");
      },
    };
  },
  // 新增测试相关方法
  __test__: {
    reset() {
      this.components = {};
      this._installedPlugins = [];
      this.$store = null;
      this.$router = null;
      this.$i18n = null;
      this.App = null;
    },
    mount(Component, options = {}) {
      const instance = new Component("TestComponent", options, XRender).init();
      const div = document.createElement("div");
      div.appendChild(instance.el);
      return {
        vm: instance,
        element: div,
      };
    },
    triggerEvent(el, eventType) {
      const event = new Event(eventType);
      el.dispatchEvent(event);
    },
  },
  // 新增性能监控
  _performance: {
    startTime: null,
    endTime: null,
  },
  startPerformanceMonitor() {
    this._performance.startTime = performance.now();
  },
  endPerformanceMonitor() {
    this._performance.endTime = performance.now();
    console.log(
      `Performance: ${
        this._performance.endTime - this._performance.startTime
      }ms`
    );
  },
};

// 注册自定义指令
Object.entries(customDirectives).forEach(([name, directive]) => {
  XRender.directive(name, directive);
});

// 导出 Composition API
export * from './reactivity.js';

window.$ = XRender;

export default XRender;
