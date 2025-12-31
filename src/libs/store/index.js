// 状态管理类
export class Store {
  static version = '1.0.0';
  
  constructor(options) {
    this.name = "store";
    this.modules = options.modules || {};
    this.plugins = options.plugins || [];
    this.state = this.observe(this.initState(options.state || {}));
    this.mutations = options.mutations || {};
    this.actions = options.actions || {};
    this.getters = {};
    this.subscribers = new Set();
    this.strict = options.strict || false;
    this.errorHandler = options.errorHandler || null;
    
    if (this.strict) {
      this.enableStrictMode();
    }
    
    if (options.persist) {
      this.persistState(options.persist);
    }
    
    this.initModules();
    this.initPlugins();
    
    if (options.getters) {
      Object.keys(options.getters).forEach((key) => {
        Object.defineProperty(this.getters, key, {
          get: () => options.getters[key](this.state),
        });
      });
    }
  }

  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.error('Store.subscribe: callback must be a function');
      return () => {};
    }
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach((callback) => {
      try {
        callback(this.state);
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  commit(type, payload) {
    if (!this.mutations[type]) {
      console.error(`[Store] Mutation "${type}" is not defined.`);
      return;
    }
    try {
      this.mutations[type](this.state, payload);
      this.notifySubscribers();
    } catch (error) {
      this.handleError(error);
    }
  }

  enableStrictMode() {
    const handler = {
      set: (target, key, value) => {
        if (this.strict && !this.mutations[key]) {
          console.warn(`[Store] Direct mutation of state "${key}" is not allowed in strict mode.`);
        }
        target[key] = value;
        return true;
      },
    };
    this.state = new Proxy(this.state, handler);
  }

  persistState(options = {}) {
    const key = options.key || 'storeState';
    const savedState = localStorage.getItem(key);
    if (savedState) {
      try {
        this.state = this.observe(JSON.parse(savedState));
      } catch (error) {
        console.error('[Store] Failed to parse saved state:', error);
      }
    }

    window.addEventListener("beforeunload", () => {
      try {
        localStorage.setItem(key, JSON.stringify(this.state));
      } catch (error) {
        console.error('[Store] Failed to persist state:', error);
      }
    });
  }

  initPlugins() {
    this.plugins.forEach((plugin) => {
      if (typeof plugin === 'function') {
        try {
          plugin(this);
        } catch (error) {
          this.handleError(error);
        }
      } else {
        console.error('[Store] Plugin must be a function');
      }
    });
  }

  initModules() {
    Object.keys(this.modules).forEach((moduleName) => {
      const module = this.modules[moduleName];
      if (!module) return;
      
      this.state[moduleName] = this.observe(module.state || {});
      this.mutations = { ...this.mutations, ...module.mutations };
      this.actions = { ...this.actions, ...module.actions };
      
      if (module.getters) {
        Object.keys(module.getters).forEach((key) => {
          Object.defineProperty(this.getters, key, {
            get: () => module.getters[key](this.state[moduleName]),
          });
        });
      }
    });
  }

  initState(state) {
    Object.keys(this.modules).forEach((moduleName) => {
      state[moduleName] = this.modules[moduleName].state || {};
    });
    return state;
  }

  createStore(reducer, initialState) {
    if (typeof reducer !== 'function') {
      console.error('[Store] Reducer must be a function');
      return null;
    }
    
    let state = initialState;
    const listeners = new Set();

    const store = {
      getState: () => state,
      dispatch: (action) => {
        try {
          state = reducer(state, action);
          listeners.forEach((listener) => listener());
        } catch (error) {
          this.handleError(error);
        }
      },
      subscribe: (listener) => {
        if (typeof listener !== 'function') {
          console.error('[Store] Listener must be a function');
          return () => {};
        }
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
    this.$store = store;
    return store;
  }

  observe(state) {
    const handler = {
      get(target, key) {
        return target[key];
      },
      set(target, key, value) {
        target[key] = value;
        return true;
      },
    };
    return new Proxy(state, handler);
  }

  dispatch(type, payload) {
    if (!this.actions[type]) {
      console.error(`[Store] Action "${type}" is not defined.`);
      return Promise.reject(new Error(`Action "${type}" is not defined.`));
    }
    try {
      return this.actions[type](
        {
          state: this.state,
          commit: this.commit.bind(this),
          dispatch: this.dispatch.bind(this),
        },
        payload
      );
    } catch (error) {
      this.handleError(error);
      return Promise.reject(error);
    }
  }

  handleError(error) {
    if (this.errorHandler) {
      this.errorHandler(error);
    } else {
      console.error('[Store] Error:', error);
    }
  }
}

// 安装插件
const xStore = {
  install(app) {
    app.Store = Store;
    app.$store = null;
    /* app.useStore = function (store) {
      this.$store = new this.Store(store);
      return this;
    }; */
  },
};

$ && $.use(xStore);

export default xStore;
