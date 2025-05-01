// 状态管理类
export class Store {
  constructor(options) {
    this.name = "store";
    this.state = this.observe(options.state || {});
    this.mutations = options.mutations || {};
    this.actions = options.actions || {};
    this.getters = {};

    // 初始化getters
    if (options.getters) {
      Object.keys(options.getters).forEach((key) => {
        Object.defineProperty(this.getters, key, {
          get: () => options.getters[key](this.state),
        });
      });
    }
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
