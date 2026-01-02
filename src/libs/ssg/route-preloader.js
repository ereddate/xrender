export class RoutePreloader {
  constructor(options = {}) {
    this.options = {
      routes: [],
      preloadData: true,
      concurrency: 5,
      ...options
    };
    this.loadedRoutes = new Map();
  }

  async preloadRoutes(routes = []) {
    const routesToPreload = routes.length > 0 ? routes : this.options.routes;
    
    console.log(`Preloading ${routesToPreload.length} routes...`);
    
    const chunks = this.chunkArray(routesToPreload, this.options.concurrency);
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(route => this.preloadRoute(route)));
    }
    
    console.log(`Route preloading complete. Loaded ${this.loadedRoutes.size} routes.`);
    return this.loadedRoutes;
  }

  async preloadRoute(route) {
    try {
      const { path, component } = route;
      
      if (this.loadedRoutes.has(path)) {
        return this.loadedRoutes.get(path);
      }
      
      const routeData = {
        path,
        component,
        data: null,
        meta: route.meta || {}
      };
      
      if (this.options.preloadData && component?.options?.data) {
        routeData.data = await this.preloadRouteData(route);
      }
      
      this.loadedRoutes.set(path, routeData);
      
      return routeData;
    } catch (error) {
      console.error(`Error preloading route ${route.path}:`, error);
      throw error;
    }
  }

  async preloadRouteData(route) {
    const { component } = route;
    
    if (component?.options?.asyncData) {
      return await component.options.asyncData();
    }
    
    if (component?.options?.created) {
      const mockComponent = {
        data: () => ({}),
        methods: {}
      };
      
      const instance = Object.create(mockComponent);
      await component.options.created.call(instance);
      
      return instance.data();
    }
    
    return null;
  }

  getRouteData(path) {
    return this.loadedRoutes.get(path);
  }

  getAllRouteData() {
    return this.loadedRoutes;
  }

  clearCache() {
    this.loadedRoutes.clear();
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
  }
}
