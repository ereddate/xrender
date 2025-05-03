// 状态管理类
export class Store {
  constructor(options) {
    this.name = "store";
    this.modules = options.modules || {}; // 新增：模块化支持
    this.plugins = options.plugins || []; // 新增：插件支持
    this.state = this.observe(this.initState(options.state || {}));
    this.mutations = options.mutations || {};
    this.actions = options.actions || {};
    this.getters = {};
    this.subscribers = new Set(); // 新增：订阅者集合
    // 新增：严格模式
    if (this.strict) {
      this.enableStrictMode();
    }
    // 新增：持久化存储
    if (options.persist) {
      this.persistState();
    }
    // 初始化模块
    this.initModules();
    // 初始化插件
    this.initPlugins();
    // 初始化getters
    if (options.getters) {
      Object.keys(options.getters).forEach((key) => {
        Object.defineProperty(this.getters, key, {
          get: () => options.getters[key](this.state),
        });
      });
    }
  }
  // 新增：订阅状态变化
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // 新增：通知订阅者
  notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.state));
  }

  // 修改：在状态更新时通知订阅者
  commit(type, payload) {
    if (this.mutations[type]) {
      this.mutations[type](this.state, payload);
      this.notifySubscribers(); // 通知订阅者
    }
  }
  // 新增：启用严格模式
  enableStrictMode() {
    const handler = {
      set: (target, key, value) => {
        if (this.strict && !this.mutations[key]) {
          console.warn(`Mutation "${key}" is not defined.`);
        }
        target[key] = value;
        return true;
      },
    };
    this.state = new Proxy(this.state, handler);
  }
  // 新增：持久化存储
  persistState() {
    const savedState = localStorage.getItem("storeState");
    if (savedState) {
      this.state = this.observe(JSON.parse(savedState));
    }

    window.addEventListener("beforeunload", () => {
      localStorage.setItem("storeState", JSON.stringify(this.state));
    });
  }
  // 新增：初始化插件
  initPlugins() {
    this.plugins.forEach((plugin) => {
      plugin(this);
    });
  }
  // 新增：初始化模块
  initModules() {
    Object.keys(this.modules).forEach((moduleName) => {
      const module = this.modules[moduleName];
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
  // 新增：初始化状态
  initState(state) {
    Object.keys(this.modules).forEach((moduleName) => {
      state[moduleName] = this.modules[moduleName].state || {};
    });
    return state;
  }
  // 新增状态管理相关方法
  createStore(reducer, initialState) {
    let state = initialState;
    const listeners = new Set();

    const store = {
      getState: () => state,
      dispatch: (action) => {
        state = reducer(state, action);
        listeners.forEach((listener) => listener());
      },
      subscribe: (listener) => {
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

  commit(type, payload) {
    if (this.mutations[type]) {
      this.mutations[type](this.state, payload);
    }
  }

  dispatch(type, payload) {
    if (this.actions[type]) {
      return this.actions[type](
        {
          state: this.state,
          commit: this.commit.bind(this),
          dispatch: this.dispatch.bind(this),
        },
        payload
      );
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
