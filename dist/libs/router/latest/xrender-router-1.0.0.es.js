var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const ROUTER_CONSTANTS = {
  DEFAULT_PATH: "/",
  ROUTER_VIEW_SELECTOR: ".router-view",
  PARAM_PREFIX: ":",
  QUERY_SEPARATOR: "?",
  PAIR_SEPARATOR: "&",
  KEY_VALUE_SEPARATOR: "=",
  HASH_PREFIX: "#"
};
const _Router = class _Router {
  constructor(routes, rootElement) {
    this.name = "router";
    this.routes = routes;
    this.rootElement = rootElement;
    this.currentRoute = null;
    this.history = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.params = {};
    this.query = {};
    this.transition = null;
    this.meta = {};
    this.children = [];
    this.errorHandler = null;
    this.init();
  }
  setErrorHandler(handler) {
    if (typeof handler !== "function") {
      throw new Error("ErrorHandler must be a function");
    }
    this.errorHandler = handler;
  }
  setTransition(transition) {
    this.transition = transition;
  }
  parseParams(path, routePath) {
    const params = {};
    const pathParts = path.split("/");
    const routeParts = routePath.split("/");
    routeParts.forEach((part, i) => {
      if (part.startsWith(ROUTER_CONSTANTS.PARAM_PREFIX)) {
        const paramName = part.slice(1);
        params[paramName] = pathParts[i];
      }
    });
    return params;
  }
  addChildRouter(childRouter) {
    if (!childRouter || !(childRouter instanceof _Router)) {
      throw new Error("ChildRouter must be an instance of Router");
    }
    this.children.push(childRouter);
  }
  parseQuery(hash) {
    const query = {};
    const queryString = hash.split(ROUTER_CONSTANTS.QUERY_SEPARATOR)[1];
    if (queryString) {
      queryString.split(ROUTER_CONSTANTS.PAIR_SEPARATOR).forEach((pair) => {
        const [key, value] = pair.split(ROUTER_CONSTANTS.KEY_VALUE_SEPARATOR);
        if (key) {
          query[key] = value ? decodeURIComponent(value) : "";
        }
      });
    }
    return query;
  }
  beforeEach(hook) {
    if (typeof hook !== "function") {
      throw new Error("beforeEach hook must be a function");
    }
    this.beforeEachHooks.push(hook);
  }
  afterEach(hook) {
    if (typeof hook !== "function") {
      throw new Error("afterEach hook must be a function");
    }
    this.afterEachHooks.push(hook);
  }
  init() {
    window.addEventListener("hashchange", () => this.onHashChange());
    if (!window.location.hash) {
      this.navigate(ROUTER_CONSTANTS.DEFAULT_PATH);
    } else {
      this.onHashChange();
    }
  }
  onHashChange() {
    try {
      const fullHash = window.location.hash.slice(1) || ROUTER_CONSTANTS.DEFAULT_PATH;
      const [path] = fullHash.split(ROUTER_CONSTANTS.QUERY_SEPARATOR);
      const route = this.findRoute(path);
      if (route) {
        this.handleRouteFound(route, path, fullHash);
      } else {
        this.handleRouteNotFound(path);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
  findRoute(path) {
    return this.routes.find((r) => {
      const routePathParts = r.path.split("/");
      const pathParts = path.split("/");
      if (routePathParts.length !== pathParts.length) return false;
      return routePathParts.every((part, i) => {
        return part.startsWith(ROUTER_CONSTANTS.PARAM_PREFIX) || part === pathParts[i];
      });
    });
  }
  handleRouteFound(route, path, fullHash) {
    this.params = this.parseParams(path, route.path);
    this.query = this.parseQuery(fullHash);
    this.meta = route.meta || {};
    if (route.beforeEnter) {
      route.beforeEnter(route, () => {
        this.updateRoute(route, fullHash);
      });
    } else {
      this.runBeforeEachHooks(route, () => {
        this.updateRoute(route, fullHash);
      });
    }
    this.runAfterEachHooks(route);
  }
  updateRoute(route, fullHash) {
    this.currentRoute = route;
    this.history.push(fullHash);
    this.render();
  }
  handleRouteNotFound(path) {
    if (this.errorHandler) {
      this.errorHandler(path);
    } else {
      console.error(`Route not found: ${path}`);
    }
  }
  handleError(error) {
    if (this.errorHandler) {
      this.errorHandler(error);
    } else {
      console.error("Router error:", error);
    }
  }
  runAfterEachHooks(route) {
    this.afterEachHooks.forEach((hook) => {
      try {
        hook(route);
      } catch (error) {
        console.error("afterEach hook error:", error);
      }
    });
  }
  runBeforeEachHooks(route, next) {
    let index = 0;
    const hooks = this.beforeEachHooks;
    const runHook = () => {
      if (index < hooks.length) {
        try {
          hooks[index](route, () => {
            index++;
            runHook();
          });
        } catch (error) {
          console.error("beforeEach hook error:", error);
          this.handleError(error);
        }
      } else {
        next();
      }
    };
    runHook();
  }
  lazyLoad(loader) {
    if (typeof loader !== "function") {
      throw new Error("loader must be a function");
    }
    return {
      render: () => {
        loader().then((component) => {
          this.currentRoute.component = component;
          this.render();
        }).catch((error) => {
          console.error("Lazy load error:", error);
          this.handleError(error);
        });
      }
    };
  }
  render() {
    if (!this.currentRoute) return;
    const routerView = document.querySelector(ROUTER_CONSTANTS.ROUTER_VIEW_SELECTOR);
    if (!routerView) {
      console.warn("router-view not found");
      return;
    }
    routerView.innerHTML = "";
    try {
      let component = this.currentRoute.component;
      component = new component.constructor(component.name, {
        ...component.options
      }).init();
      routerView.appendChild(component.el);
      if (this.transition && this.transition.afterEnter) {
        this.transition.afterEnter(routerView);
      }
      this.children.forEach((childRouter) => {
        childRouter.render();
      });
    } catch (error) {
      console.error("Render error:", error);
      this.handleError(error);
    }
  }
  navigate(path) {
    window.location.hash = path;
  }
  go(n) {
    window.history.go(n);
  }
  goback() {
    window.history.back();
  }
  push(path) {
    this.navigate(path);
  }
  static createRouterView() {
    return {
      name: "router-view",
      render(createElem) {
        return createElem(
          "div",
          { class: "router-view" },
          ""
        );
      }
    };
  }
  static createRouterLink() {
    return {
      name: "router-link",
      props: ["to", "text"],
      render(createElem) {
        const { to, text } = this.props;
        return createElem(
          "a",
          {
            href: `${ROUTER_CONSTANTS.HASH_PREFIX}${to}`,
            "@click.prevent": "navigate"
          },
          text || to
        );
      },
      methods: {
        navigate() {
          if ($ && $.$router) {
            $.$router.push(this.props.to);
          } else {
            console.error("$.$router not available");
          }
        }
      }
    };
  }
};
__publicField(_Router, "version", "1.0.0");
let Router = _Router;
const xRouter = {
  install(app) {
    app.Router = Router;
    app.$router = null;
    app.component("router-view", Router.createRouterView());
    app.component("router-link", Router.createRouterLink());
  }
};
$ && $.use(xRouter);
export {
  Router,
  xRouter as default
};
//# sourceMappingURL=xrender-router-1.0.0.es.js.map
