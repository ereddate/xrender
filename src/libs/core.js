import customDirectives from "./customDirectives.js";
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

        that.methods[value].call(that, e);
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
class VNode {
  constructor(tag, attrs, children) {
    this.tag = tag;
    this.attrs = attrs || {};
    this.children = children || [];
    this.key = attrs?.key; // 支持key属性优化diff
    // 新增静态标记
    this.isStatic = attrs?.isStatic || false;
    // 新增缓存标识
    this.cacheKey = attrs?.cacheKey || null;
    this.el = null;
  }
}

export class Component {
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
    this.beforeCreate = options?.beforeCreate || (() => {});
    this.created = options?.created || (() => {});
    this.beforeMount = (options && options.beforeMount) || (() => {});
    this.mounted = options?.mounted || (() => {});
    this.beforeUpdate = (options && options.beforeUpdate) || (() => {});
    this.updated = (options && options.updated) || (() => {});
    this.beforeDestroy = options?.beforeDestroy || (() => {});
    this.destroyed = options?.destroyed || (() => {});
    this.beforeUnmount = (options && options.beforeUnmount) || (() => {});
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
    this.beforeMount?.call(this);
    this.setup();
    this.mounted?.call(this);
    return this;
  }

  // 新增方法：清理上下文订阅
  _cleanupContextSubscriptions() {
    this._contextSubscriptions.forEach((unsubscribe) => unsubscribe());
    this._contextSubscriptions.clear();
  }
  destroy() {
    this.beforeDestroy?.call(this);
    this.unmount();
    this.destroyed?.call(this); // 在销毁之后调用
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
      requestAnimationFrame(() => {
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
      });
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

  // 新增过渡动画方法
  applyTransition(el, type, options = {}) {
    if (!this.transition) return;
    const classes = this.transitionClasses;
    const duration = options.duration || this.transition.duration || 300; // 默认过渡时间为 300ms

    // 根据过渡名称获取对应的类名
    const prefix =
      options.name || this.transition.name
        ? `${options.name || this.transition.name}-`
        : "v-";
    const enterClass = `${prefix}enter`;
    const enterActiveClass = `${prefix}enter-active`;
    const leaveClass = `${prefix}leave`;
    const leaveActiveClass = `${prefix}leave-active`;

    if (type === "enter") {
      el.classList.add(enterClass, enterActiveClass);
      setTimeout(() => {
        el.classList.remove(enterClass);
      }, 0);
      setTimeout(() => {
        el.classList.remove(enterActiveClass);
      }, duration);
    } else if (type === "leave") {
      el.classList.add(leaveClass, leaveActiveClass);
      setTimeout(() => {
        el.classList.remove(leaveClass, leaveActiveClass);
      }, duration);
    }
  }

  initComputed() {
    Object.entries(this.computed).forEach(([key, fn]) => {
      Object.defineProperty(this.data, key, {
        get: () => {
          // 建立依赖追踪
          this.currentDep = key;
          const value = fn.call(this);
          this.currentDep = null;
          return value;
        },
        enumerable: true,
      });
    });
  }

  // 数据响应式实现
  observe(data) {
    if (data && data.__observed__) {
      return data;
    }
    const vm = this;
    const handler = {
      get(target, key) {
        const value = Reflect.get(target, key);
        // 深度监听对象
        if (
          typeof value === "object" &&
          value !== null &&
          !value.__observed__
        ) {
          return vm.observe(value);
        }
        return value;
      },
      set(target, key, value) {
        const oldVal = Reflect.get(target, key);
        const result = Reflect.set(target, key, value);
        // 触发更新
        if (oldVal !== value) {
          XRender.queueUpdate(vm, key, value, oldVal);
          /* vm.update();
          vm.triggerWatch(key, value, oldVal); */
        }
        return result;
      },
      deleteProperty(target, key) {
        const oldVal = Reflect.get(target, key);
        const result = Reflect.deleteProperty(target, key);
        // 如果删除成功，触发更新
        if (result && oldVal !== undefined) {
          vm.update();
          vm.triggerWatch(key, undefined, oldVal);
        }
        return result;
      },
    };

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
        data[method] = function (...args) {
          const oldVal = [...this];
          const result = original.apply(this, args);
          vm.update();
          vm.triggerWatch(method, this, oldVal);
          return result;
        };
      });
    }
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
    if (this.watch) {
      Object.entries(this.watch).forEach(([key, fn]) => {
        this.triggerWatch(key, this.data[key], undefined);
      });
    }
  }

  // 触发监听回调
  triggerWatch(key, newVal, oldVal) {
    if (this.watch?.[key]) {
      this.watch[key].call(this, newVal, oldVal);
    }
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
        that.beforeUpdate?.call(that);
        if (that.isMounted) {
          const newEl = that.render.call(that, function () {
            return createElem.call(that, ...arguments);
          });
          fragment.appendChild(newEl); // 将新节点添加到 DocumentFragment
          // 调用指令的 update 钩子
          Object.entries(XRender.directives).forEach(([name, directive]) => {
            const attributeName = `v-${name}`;
            const attributeValue = newEl.getAttribute(attributeName);
            if (newEl && attributeValue !== null) {
              const bindingValue = that.data[attributeValue] ?? attributeValue;
              directive.update?.call(
                that,
                newEl,
                { value: bindingValue },
                that
              );
            }
          });
          that.el.parentNode?.replaceChild(fragment, that.el);
          that.el = newEl;
        }
        XRender.nextTick(() => {
          that.updated?.call(that);
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
  setup() {
    const vm = this;
    this.el = this.render.call(vm, function () {
      const elem = createElem.call(vm, ...arguments);
      return elem;
    });

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
    this._updateQueue.add(component);
    if (!this._isUpdating) {
      this._isUpdating = true;
      Promise.resolve().then(() => {
        this._isUpdating = false;
        const queue = Array.from(this._updateQueue);
        this._updateQueue.clear();
        queue.forEach((c) => {
          c.update();
          c.triggerWatch(key, value, oldVal);
        });
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
          copies[i]();
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

window.$ = XRender;
export default XRender;
