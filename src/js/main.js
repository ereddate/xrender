((global) => {
  const elemChildren = function (elem, children) {
    const that = this;
    children.length > 0 &&
      children.forEach((child) => {
        if (typeof child === "string") {
          if (child.includes("{{")) {
            const interpolatedText = child.replace(
              /\{\{(.+?)\}\}/g,
              (_, key) => {
                return that.data[key.trim()] ?? "";
              }
            );
            const textNode = document.createTextNode(interpolatedText);
            elem.appendChild(textNode);
            return;
          }
          const textNode = document.createTextNode(child);
          elem.appendChild(textNode);
        } else if (isComponent(child)) {
          const component = new Component(child.name, {
            ...child.options,
            props: child.props,
          });
          elem.appendChild(component.el);
        } else if (child.tagName === "TEMPLATE") {
          const templateChildren = Array.from(child.childNodes);
          elemChildren.call(that, elem, templateChildren);
        } else {
          elem.appendChild(child);
        }
      });
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
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "text") {
        if (value.includes("{{")) {
          value = value.replace(/\{\{(.+?)\}\}/g, (_, key) => {
            return that.data[key.trim()] ?? "";
          });
        }
        const textNode = document.createTextNode(value);
        elem.appendChild(textNode);
      } else if (key.startsWith("@")) {
        elem.addEventListener(key.slice(1), function () {
          that.methods[value].call(that.data, ...arguments);
        });
      } else if (
        key.startsWith(":") ||
        key.startsWith("v-bind:") ||
        key.startsWith("v-text")
      ) {
        if (
          key.replace(":", "") === "text" ||
          key.replace("v-bind:", "") === "text" ||
          key === "v-text"
        ) {
          const textNode = document.createTextNode(this.data[value]);
          elem.appendChild(textNode);
        } else {
          elem.setAttribute(key.slice(1), this.data[value]);
        }
      } else if (key === "slot") {
        const slotName = value || "default";
        const slotContent = that.$slots[slotName];
        console.log(findCommon(document.body, slotName));
        if (slotContent) {
          elem.appendChild(slotContent);
        } else {
          that.$slots[slotName] = elem;
        }
      } else {
        elem.setAttribute(key, value);
      }
    });
  };
  const createElem = function (tagName, attributes = {}, ...children) {
    const that = this;
    if (isComponent(tagName)) {
      const slots = {};
      // 将attributes作为props传递给组件
      Object.entries(attributes).forEach(([key, value]) => {
        if (typeof value === "string" && value.includes("{{")) {
          value = value.replace(/\{\{(.+?)\}\}/g, (_, key) => {
            return that.data[key.trim()] ?? "";
          });
        }
        if (key.startsWith(":") || key.startsWith("v-bind:")) {
          attributes[key.replace(/^(v-bind:)?:/, "")] = that.data[value];
          delete attributes[key];
        } else if (key.startsWith("slot")) {
          const slotName = key.replace(/slot\:*/, "") || "default";
          slots[slotName] = value;
        } else {
          attributes[key] = value;
        }
      });

      const component = new tagName.constructor(tagName.name, {
        ...tagName.options,
        props: attributes, // 传递当前属性作为props
      });
      elemChildren.call(that, component.el, children);
      Object.entries(slots).forEach(([slotName, slotContent]) => {
        findCommon(component.el, slotName).forEach((node) => {
          node.parentNode?.replaceChild(slotContent, node);
        });
      });
      return component.el;
    } else if (tagName === "slot") {
      const slotName = attributes.name || "default";
      that.$slots[slotName] = document.createComment(slotName);
      return that.$slots[slotName];
    }
    const elem = document.createElement(tagName);
    elemAttrs.call(that, elem, attributes);
    elemChildren.call(that, elem, children);

    return elem;
  };

  const isComponent = function (component) {
    return component instanceof Component;
  };

  class Component {
    constructor(name, options) {
      this.name = name;
      this.options = options;
      this.props = options.props || {};
      this.render = options.render;
      this.data = this.observe({ ...options.data?.(), ...this.props });
      this.methods = options.methods;
      this.watch = options.watch;
      this.computed = options.computed;
      this.$slots = options.slots || {};
      this.el = null;
      this.isMounted = false;

      this.initComputed();
      this.initWatcher();
      options.created?.call(this);
      this.setup();
      options.mounted?.call(this);
    }

    initComputed() {
      if (this.computed) {
        Object.entries(this.computed).forEach(([key, fn]) => {
          Object.defineProperty(this.data, key, {
            get: () => fn.call(this),
            enumerable: true,
            configurable: true
          });
        });
      }
    }

    observe(data) {
      const vm = this;
      return new Proxy(data || {}, {
        set(target, key, value) {
          const oldVal = target[key];
          target[key] = value;
          if (oldVal !== value) {
            vm.update();
            vm.triggerWatch(key, value, oldVal);
          }
          return true;
        },
      });
    }

    initWatcher() {
      if (this.watch) {
        Object.entries(this.watch).forEach(([key, fn]) => {
          this.triggerWatch(key, this.data[key], undefined);
        });
      }
    }

    triggerWatch(key, newVal, oldVal) {
      if (this.watch?.[key]) {
        this.watch[key].call(this, newVal, oldVal);
      }
    }

    update() {
      const that = this;
      if (this.isMounted) {
        const newEl = this.render.call(this, function () {
          return createElem.call(that, ...arguments);
        });
        this.el.parentNode?.replaceChild(newEl, this.el);
        this.el = newEl;
      }
    }

    setup() {
      const vm = this;
      this.el = this.render.call(vm, function () {
        return createElem.call(vm, ...arguments);
      });
      this.isMounted = true;

      if (this.methods) {
        Object.entries(this.methods).forEach(([key, value]) => {
          vm[key] = value.bind(vm);
        });
      }
    }
  }

  global.$ = {
    el: null,
    components: {},
    query(selector) {
      this.el = document.querySelector(selector);
      return this;
    },
    component(name, options) {
      this.components[name] = new Component(name, {
        ...options,
      });
      return this.components[name];
    },
    append(children) {
      if (isComponent(children)) {
        const component = new children.constructor(children.name, {
          ...children.options,
          //props: children.props,
        });
        children = [component.el];
      } else if (Array.isArray(children))
        children = children.map((child) =>
        isComponent(child)
          ? new child.constructor(child.name, {
              ...child.options,
              //props: child.props,
            }).el
          : child
      );
      else children = [children];
      children.forEach((child) => this.el.appendChild(child));
      return this;
    },
    isComponent,
    createElem,
  };
})(window);
