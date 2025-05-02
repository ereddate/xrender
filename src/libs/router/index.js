import { Component } from "../core.js";
const doc = document;

export class Router {
  constructor(routes, rootElement) {
    this.name = "router";
    this.routes = routes; // 路由配置
    this.rootElement = rootElement; // 根元素
    this.currentRoute = null; // 当前路由
    this.history = []; // 历史记录
    this.beforeEachHooks = []; // 存储全局前置守卫
    this.afterEachHooks = []; // 存储 afterEach 钩子
    this.params = {}; // 新增：存储路径参数
    this.query = {}; // 新增：存储查询参数
    this.init();
  }
  // 新增：解析路径参数
  parseParams(path, routePath) {
    const params = {};
    const pathParts = path.split("/");
    const routeParts = routePath.split("/");

    routeParts.forEach((part, i) => {
      if (part.startsWith(":")) {
        const paramName = part.slice(1);
        params[paramName] = pathParts[i];
      }
    });

    return params;
  }

  // 新增：解析查询参数
  parseQuery(hash) {
    const query = {};
    const queryString = hash.split("?")[1];

    if (queryString) {
      queryString.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        query[key] = decodeURIComponent(value);
      });
    }

    return query;
  }
  // 添加全局前置守卫
  beforeEach(hook) {
    this.beforeEachHooks.push(hook);
  }
  // 添加 afterEach 钩子
  afterEach(hook) {
    this.afterEachHooks.push(hook);
  }
  // 初始化路由
  init() {
    // 监听 hashchange 事件
    window.addEventListener("hashchange", () => this.onHashChange());
    // 首次加载时触发路由
    if (!window.location.hash) {
      this.navigate("/"); // 默认跳转到 "/"
    } else {
      this.onHashChange();
    }
  }

  // 处理 hash 变化
  onHashChange() {
    const fullHash = window.location.hash.slice(1) || "/";
    const [path] = fullHash.split("?"); // 分离路径和查询参数
    const route = this.routes.find((r) => {
      // 支持路径参数匹配
      const routePathParts = r.path.split("/");
      const pathParts = path.split("/");

      if (routePathParts.length !== pathParts.length) return false;

      return routePathParts.every((part, i) => {
        return part.startsWith(":") || part === pathParts[i];
      });
    });

    if (route) {
      this.params = this.parseParams(path, route.path); // 解析路径参数
      this.query = this.parseQuery(fullHash); // 解析查询参数
      // 执行 beforeEnter 钩子
      if (route.beforeEnter) {
        route.beforeEnter(route, () => {
          this.currentRoute = route;
          this.history.push(fullHash); // 记录历史
          this.render();
        });
      } else {
        this.runBeforeEachHooks(route, () => {
          this.currentRoute = route;
          this.history.push(fullHash); // 记录历史
          this.render();
        });
      }
      this.runAfterEachHooks(route);
    } else {
      console.error(`Route not found: ${hash}`);
    }
  }

  // 执行 afterEach 钩子
  runAfterEachHooks(route) {
    this.afterEachHooks.forEach((hook) => {
      hook(route);
    });
  }

  // 执行全局前置守卫
  runBeforeEachHooks(route, next) {
    let index = 0;
    const hooks = this.beforeEachHooks;

    const runHook = () => {
      if (index < hooks.length) {
        hooks[index](route, () => {
          index++;
          runHook();
        });
      } else {
        next();
      }
    };

    runHook();
  }

  // 渲染当前路由对应的组件
  render() {
    if (this.currentRoute) {
      // 查找 router-view 容器
      const routerView = document.querySelector(".router-view");
      if (routerView) {
        // 清空 router-view 的内容
        routerView.innerHTML = "";
        // 创建组件实例并渲染
        let component = this.currentRoute.component;
        component = new component.constructor(component.name, {
          ...component.options,
        }).init();
        routerView.appendChild(component.el);
      } /*  else {
        console.error("router-view not found in rootElement");
      } */
    }
  }

  // 导航到指定路径
  navigate(path) {
    window.location.hash = path;
  }
  // 跳转到指定历史记录
  go(n) {
    window.history.go(n);
  }

  // 返回上一页
  goback() {
    window.history.back();
  }

  // 导航到新页面并记录历史
  push(path) {
    this.navigate(path);
  }

  // 支持 router-view 组件
  static RouterView = new Component("router-view", {
    render(createElem) {
      return createElem(
        "div",
        { class: "router-view" },
        "Router View Placeholder"
      );
    },
  });

  // 支持 router-link 组件
  static RouterLink = new Component("router-link", {
    render(createElem) {
      const { to, text } = this.props;
      return createElem(
        "a",
        { href: `#${to}`, "@click.prevent": "navigate" },
        text || to
      );
    },
    methods: {
      navigate() {
        $.$router.push(this.props.to);
      },
    },
  });
}

const xRouter = {
  install(app) {
    app.Router = Router;
    app.$router = null;
    /* app.useRouter = function (routes) {
      this.$router = new this.Router(routes);
      return this;
    }; */
    app.component("router-view", Router.RouterView);
    app.component("router-link", Router.RouterLink);
  },
};
// 暴露 Router 类
$ && $.use(xRouter);
