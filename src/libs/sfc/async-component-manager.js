// 异步组件管理器 - 负责管理异步组件的加载、缓存和状态
export class AsyncComponentManager {
  constructor(componentCache = null) {
    this.cache = new Map(); // 组件缓存
    this.componentCache = componentCache; // 外部组件缓存管理器
    this.loadingStates = new Map(); // 加载状态
    this.errorStates = new Map(); // 错误状态
    this.preloadQueue = new Set(); // 预加载队列
    this.retryAttempts = new Map(); // 重试次数
    this.maxRetries = 3; // 最大重试次数
    this.loadingTimeout = 30000; // 加载超时时间
    this.loadingPromises = new Map(); // 加载中的Promise
    this.metadata = new Map(); // 组件元数据
    this.stats = {
      totalComponents: 0,
      cacheSize: 0,
      errors: 0
    };
  }

  // 注册异步组件
  async register(name, loader, options = {}) {
    const config = {
      loader,
      timeout: options.timeout || this.loadingTimeout,
      retryAttempts: options.retryAttempts || this.maxRetries,
      cache: options.cache !== false,
      preload: options.preload || false,
      ...options
    };

    if (config.cache && this.cache.has(name)) {
      return this.cache.get(name);
    }

    // 创建异步组件
    const component = this._createAsyncComponent(name, config);
    
    if (config.cache) {
      this.cache.set(name, component);
    }

    if (config.preload) {
      this.preloadQueue.add(name);
      this._preloadComponent(name, config);
    }

    return component;
  }

  // 创建异步组件
  _createAsyncComponent(name, config) {
    return {
      name: name,
      isAsync: true,
      loading: config.loading || this._createLoadingComponent(),
      error: config.error || this._createErrorComponent(),
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      loader: async () => {
        try {
          this._setLoadingState(name, true);
          const result = await config.loader();
          
          // 处理组件结果
          const component = this._processLoadedComponent(result);
          
          this._setLoadingState(name, false);
          this._setErrorState(name, null);
          
          return component;
        } catch (error) {
          const attempts = this.retryAttempts.get(name) || 0;
          
          if (attempts < config.retryAttempts) {
            this.retryAttempts.set(name, attempts + 1);
            console.warn(`异步组件 ${name} 加载失败，尝试重试 (${attempts + 1}/${config.retryAttempts})`);
            
            // 延迟重试
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
            return config.loader();
          }
          
          this._setLoadingState(name, false);
          this._setErrorState(name, error);
          throw error;
        }
      }
    };
  }

  // 处理加载的组件
  _processLoadedComponent(result) {
    if (typeof result === 'function') {
      return result;
    }
    
    if (result && typeof result === 'object') {
      // 如果是组件配置对象，直接返回
      if (result.render || result.template) {
        return result;
      }
      
      // 如果是默认导出的组件
      if (result.default) {
        return result.default;
      }
    }
    
    throw new Error('异步组件加载结果无效');
  }

  // 创建加载组件
  _createLoadingComponent() {
    return {
      name: 'AsyncLoading',
      render(createElem) {
        return createElem('div', { class: 'async-loading' }, [
          createElem('div', { class: 'loading-spinner' }, ['加载中...'])
        ]);
      }
    };
  }

  // 创建错误组件
  _createErrorComponent() {
    return {
      name: 'AsyncError',
      props: ['error'],
      render(createElem) {
        return createElem('div', { class: 'async-error' }, [
          createElem('h3', {}, ['加载失败']),
          createElem('p', {}, ['组件加载出现错误']),
          createElem('button', { 
            '@click': () => window.location.reload() 
          }, ['重试'])
        ]);
      }
    };
  }

  // 预加载组件
  async _preloadComponent(name, config) {
    try {
      await config.loader();
      this.preloadQueue.delete(name);
    } catch (error) {
      console.warn(`预加载组件 ${name} 失败:`, error);
      this.preloadQueue.delete(name);
    }
  }

  // 动态导入组件
  async import(name, path, options = {}) {
    const cacheKey = `${name}:${path}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const loader = async () => {
      const module = await import(path);
      return module.default || module;
    };

    return this.register(name, loader, options);
  }

  // 设置加载状态
  _setLoadingState(name, loading) {
    this.loadingStates.set(name, { loading, timestamp: Date.now() });
  }

  // 设置错误状态
  _setErrorState(name, error) {
    this.errorStates.set(name, { error, timestamp: Date.now() });
  }

  // 获取组件加载状态
  getLoadingState(name) {
    return this.loadingStates.get(name) || { loading: false, timestamp: 0 };
  }

  // 获取组件错误状态
  getErrorState(name) {
    return this.errorStates.get(name) || { error: null, timestamp: 0 };
  }

  // 清除缓存
  clearCache() {
    this.cache.clear();
    this.loadingStates.clear();
    this.errorStates.clear();
    this.preloadQueue.clear();
    this.retryAttempts.clear();
  }

  // 预加载多个组件
  async preloadComponents(components) {
    const promises = components.map(({ name, loader, options }) => 
      this.register(name, loader, { ...options, preload: true })
    );
    
    return Promise.all(promises);
  }

  // 组件懒加载包装器
  lazy(loader, options = {}) {
    return {
      name: options.name || 'LazyComponent',
      isLazy: true,
      loader,
      ...options
    };
  }

  // 获取缓存统计
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      loadingCount: Array.from(this.loadingStates.values())
        .filter(state => state.loading).length,
      errorCount: Array.from(this.errorStates.values())
        .filter(state => state.error).length,
      preloadQueueSize: this.preloadQueue.size
    };
  }

  // 获取或加载组件（测试需要的方法）
  async getOrLoad(name, loader, options = {}) {
    // 如果已在缓存中，直接返回
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    // 如果正在加载中，返回相同的Promise
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    // 对于简单情况（无重试，无超时），直接执行loader
    if (!options.retryAttempts && !options.timeout) {
      try {
        const component = await loader();
        
        // 缓存组件
        if (options.cache !== false) {
          this.cache.set(name, component);
          this.stats.cacheSize = this.cache.size;
        }
        
        // 存储元数据
        if (options.metadata) {
          this.metadata.set(name, options.metadata);
        }
        
        this.stats.totalComponents++;
        return component;
      } catch (error) {
        this.stats.errors++;
        throw error;
      }
    }

    // 创建加载Promise（复杂情况）
    const loadPromise = this._loadComponentWithRetry(name, loader, options);
    this.loadingPromises.set(name, loadPromise);

    try {
      const component = await loadPromise;
      
      // 缓存组件
      if (options.cache !== false) {
        this.cache.set(name, component);
        this.stats.cacheSize = this.cache.size;
      }
      
      // 存储元数据
      if (options.metadata) {
        this.metadata.set(name, options.metadata);
      }
      
      this.stats.totalComponents++;
      this.loadingPromises.delete(name);
      
      return component;
    } catch (error) {
      this.loadingPromises.delete(name);
      this.stats.errors++;
      throw error;
    }
  }

  // 带重试机制的组件加载
  async _loadComponentWithRetry(name, loader, options = {}) {
    const maxRetries = options.retryAttempts !== undefined ? options.retryAttempts : this.maxRetries;
    const timeout = options.timeout || this.loadingTimeout;
    
    // 如果没有指定重试次数（undefined），则只执行一次，不重试
    if (maxRetries === 0) {
      // 创建超时Promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), timeout);
      });
      
      // 竞速：加载 vs 超时
      return await Promise.race([
        loader(),
        timeoutPromise
      ]);
    }
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 创建超时Promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), timeout);
        });
        
        // 竞速：加载 vs 超时
        const component = await Promise.race([
          loader(),
          timeoutPromise
        ]);
        
        return component;
      } catch (error) {
        if (attempt === maxRetries || error.message === 'timeout') {
          throw error;
        }
        
        // 延迟重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  // 获取缓存的组件
  get(name) {
    const component = this.cache.get(name);
    if (component) {
      return component;
    }
    
    // 如果在异步组件缓存中没有，尝试从外部组件缓存管理器获取
    if (this.componentCache && this.componentCache.get) {
      const cachedComponent = this.componentCache.get(name);
      if (cachedComponent) {
        return cachedComponent;
      }
    }
    
    return undefined;
  }

  // 获取组件元数据
  getMetadata(name) {
    return this.metadata.get(name);
  }

  // 批量加载组件
  async batchLoad(names, loaders) {
    const promises = names.map((name, index) => {
      const loader = loaders[index];
      return this.getOrLoad(name, loader);
    });
    
    return Promise.all(promises);
  }

  // 检查组件是否存在
  has(name) {
    return this.cache.has(name);
  }

  // 获取统计信息
  getStats() {
    return {
      totalComponents: this.stats.totalComponents,
      cacheSize: this.stats.cacheSize,
      errors: this.stats.errors
    };
  }

  // 清除缓存
  clear() {
    this.cache.clear();
    this.loadingPromises.clear();
    this.metadata.clear();
    this.loadingStates.clear();
    this.errorStates.clear();
    this.retryAttempts.clear();
    this.preloadQueue.clear();
    
    // 重置统计
    this.stats = {
      totalComponents: 0,
      cacheSize: 0,
      errors: 0
    };
  }

  // 预加载（兼容测试）
  async preload(name, loader, options = {}) {
    return this.getOrLoad(name, loader, { ...options, cache: true });
  }
}

// 全局异步组件管理器实例
export const asyncComponentManager = new AsyncComponentManager();

// 便捷方法
export const AsyncComponent = asyncComponentManager.register.bind(asyncComponentManager);
export const LazyComponent = asyncComponentManager.lazy.bind(asyncComponentManager);
export const ImportComponent = asyncComponentManager.import.bind(asyncComponentManager);

// 默认导出 AsyncComponentManager 类
export default AsyncComponentManager;