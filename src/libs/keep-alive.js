class KeepAlive {
  constructor(options = {}) {
    this.max = options.max || 10;
    this.cache = new Map();
    this.keys = [];
    this.currentInstanceKey = null;
  }

  get(key) {
    const item = this.cache.get(key);
    if (item) {
      this.keys = this.keys.filter((k) => k !== key);
      this.keys.push(key);
      return item;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.keys = this.keys.filter((k) => k !== key);
    } else if (this.keys.length >= this.max) {
      const oldestKey = this.keys.shift();
      const oldest = this.cache.get(oldestKey);
      if (oldest && oldest.el) {
        oldest.el.remove();
      }
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
    this.keys.push(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    const item = this.cache.get(key);
    if (item && item.el) {
      item.el.remove();
    }
    this.cache.delete(key);
    this.keys = this.keys.filter((k) => k !== key);
  }

  clear() {
    this.cache.forEach((item) => {
      if (item && item.el) {
        item.el.remove();
      }
    });
    this.cache.clear();
    this.keys = [];
  }

  pruneCacheEntry(key) {
    const cached = this.cache.get(key);
    if (cached) {
      if (cached.component) {
        cached.component.$destroy?.();
      }
      if (cached.el) {
        cached.el.remove();
      }
      this.cache.delete(key);
      this.keys = this.keys.filter((k) => k !== key);
    }
  }
}

const keepAliveCache = new KeepAlive();

const KeepAliveComponent = {
  name: "KeepAlive",

  props: {
    max: {
      type: Number,
      default: 10,
    },
    include: {
      type: [String, RegExp, Array],
      default: undefined,
    },
    exclude: {
      type: [String, RegExp, Array],
      default: undefined,
    },
  },

  setup(props) {
    const cache = new KeepAlive({ max: props.max });
    const currentKey = ref(null);
    const pendingCacheKey = ref(null);

    const matches = (pattern, name) => {
      if (Array.isArray(pattern)) {
        return pattern.some((p) => matches(p, name));
      } else if (typeof pattern === "string") {
        return pattern.split(",").includes(name);
      } else if (pattern instanceof RegExp) {
        return pattern.test(name);
      }
      return false;
    };

    const isCacheable = (name) => {
      if (props.include && !matches(props.include, name)) {
        return false;
      }
      if (props.exclude && matches(props.exclude, name)) {
        return false;
      }
      return true;
    };

    const cacheKey = (component) => {
      return component.type?.name || component.type?.__name || component.key || "default";
    };

    const render = (h) => {
      const defaultSlot = this.$slots.default?.[0];
      if (!defaultSlot) {
        return null;
      }

      const component = defaultSlot;
      const key = cacheKey(component);
      const componentName = component.type?.name || component.type?.__name;

      if (!isCacheable(componentName)) {
        return component;
      }

      const cached = cache.get(key);
      if (cached) {
        return cached.component;
      }

      pendingCacheKey.value = key;
      return component;
    };

    const mounted = () => {
      const key = pendingCacheKey.value;
      if (key) {
        const defaultSlot = this.$slots.default?.[0];
        if (defaultSlot) {
          cache.set(key, {
            component: defaultSlot,
            el: defaultSlot.el,
          });
        }
        pendingCacheKey.value = null;
      }
    };

    const updated = () => {
      const key = currentKey.value;
      if (key) {
        const defaultSlot = this.$slots.default?.[0];
        if (defaultSlot) {
          cache.set(key, {
            component: defaultSlot,
            el: defaultSlot.el,
          });
        }
      }
    };

    const unmounted = () => {
      const key = currentKey.value;
      if (key) {
        cache.delete(key);
      }
    };

    return {
      cache,
      currentKey,
      pendingCacheKey,
      render,
      mounted,
      updated,
      unmounted,
    };
  },
};

export { KeepAlive, KeepAliveComponent, keepAliveCache };
export default KeepAliveComponent;
