// 组件缓存和懒加载管理器
export class ComponentCacheManager {
  constructor(options = {}) {
    this.cache = new Map(); // 组件缓存
    this.accessOrder = new Map(); // 访问顺序记录
    this.loadingPromises = new Map(); // 加载中的Promise
    this.observer = null; // Intersection Observer
    this.accessCounter = 0; // 访问计数器，用于精确LRU排序
    this.options = {
      maxCacheSize: options.maxCacheSize || 100,
      cacheTTL: options.cacheTTL || 300000, // 5分钟
      lazyLoadThreshold: options.lazyLoadThreshold || 0.1,
      autoCleanup: options.autoCleanup !== false,
      enableMemoryOptimization: options.enableMemoryOptimization !== false,
      ...options
    };
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      loads: 0,
      errors: 0
    };

    if (this.options.autoCleanup) {
      this._startCleanupTimer();
    }
  }

  // 缓存组件
  set(key, component, metadata = {}) {
    if (!key) {
      throw new Error('Key must be provided for cache entry');
    }
    const now = Date.now();
    const accessOrder = ++this.accessCounter;
    const cacheEntry = {
      component,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
      size: this._calculateSize(component),
      metadata: {
        ...metadata,
        createdAt: now,
        version: component.version || metadata.version || '1.0.0'
      }
    };

    // 检查缓存大小限制（仅当key不存在时才检查）
    if (!this.cache.has(key) && this.cache.size >= this.options.maxCacheSize) {
      this._evictLRU();
    }

    this.cache.set(key, cacheEntry);
    this.accessOrder.set(key, accessOrder);

    return component;
  }

  // 获取缓存的组件
  get(key, options = {}) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    
    // 检查TTL
    if (now - entry.timestamp > this.options.cacheTTL) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;
    this.accessOrder.set(key, ++this.accessCounter);

    return entry.component;
  }

  // 异步获取组件（带加载）
  getOrLoad(key, loader, options = {}) {
    // 尝试从缓存获取
    const cachedComponent = this.get(key);
    if (cachedComponent) {
      return cachedComponent;
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    // 开始加载 - 先设置Promise，再执行异步操作
    const loadingPromise = this._loadWithRetry(key, loader, options)
      .then(loadedComponent => {
        this.set(key, loadedComponent, options.metadata);
        return loadedComponent;
      })
      .catch(error => {
        this.stats.errors++;
        throw error;
      })
      .finally(() => {
        this.loadingPromises.delete(key);
      });

    this.loadingPromises.set(key, loadingPromise);
    return loadingPromise;
  }

  // 带重试的加载
  async _loadWithRetry(key, loader, options = {}) {
    const maxRetries = options.retryAttempts || options.maxRetries || 0;
    const retryDelay = options.retryDelay || 1000;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        this.stats.loads++;
        const component = await loader();
        return component;
      } catch (error) {
        lastError = error;
        
        if (attempt <= maxRetries) {
          console.warn(`组件加载失败 (${attempt}/${maxRetries + 1}): ${key}`, error);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }
    
    throw lastError || new Error(`Load failed`);
  }

  // 删除缓存项
  delete(key) {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    
    if (deleted) {
      // 清理相关状态
      this.loadingPromises.delete(key);
    }
    
    return deleted;
  }

  // 清空缓存
  clear() {
    this.cache.clear();
    this.accessOrder.clear();
    this.loadingPromises.clear();
  }

  // LRU淘汰
  _evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    // 找到最久未访问的项
    for (const [key, time] of this.accessOrder.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  // 计算组件大小（估算）
  _calculateSize(component) {
    if (!component) return 0;
    
    try {
      const serialized = JSON.stringify(component, (key, value) => {
        if (typeof value === 'function') {
          return '[Function]';
        }
        if (value instanceof HTMLElement) {
          return '[HTMLElement]';
        }
        return value;
      });
      return serialized.length;
    } catch (error) {
      return 1000; // 默认大小
    }
  }

  // 启动清理定时器
  _startCleanupTimer() {
    setInterval(() => {
      this._cleanupExpired();
    }, 60000); // 每分钟清理一次
  }

  // 清理过期项
  _cleanupExpired() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.options.cacheTTL) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`清理了 ${expiredKeys.length} 个过期缓存项`);
    }
  }

  // 懒加载设置
  setupLazyLoading(elements, loader, options = {}) {
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        this._handleIntersection.bind(this),
        {
          rootMargin: options.rootMargin || '50px',
          threshold: options.threshold || this.options.lazyLoadThreshold
        }
      );
    }

    elements.forEach(element => {
      if (element.dataset.componentKey) {
        this.observer.observe(element);
        element._lazyLoader = loader;
        element._lazyOptions = options;
      }
    });
  }

  // 处理交叉观察
  _handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const key = element.dataset.componentKey;
        const loader = element._lazyLoader;
        const options = element._lazyOptions || {};
        
        this.observer.unobserve(element);
        
        if (key && loader) {
          this.getOrLoad(key, loader, options)
            .then(component => {
              // 渲染组件到元素
              this._renderComponent(element, component);
            })
            .catch(error => {
              console.error(`懒加载组件失败: ${key}`, error);
              element.innerHTML = '<div class="lazy-load-error">加载失败</div>';
            });
        }
      }
    });
  }

  // 渲染组件到元素
  _renderComponent(element, component) {
    if (typeof component === 'function') {
      // 如果是组件构造函数，创建实例
      const instance = new component();
      if (instance.render) {
        const rendered = instance.render();
        element.innerHTML = '';
        element.appendChild(rendered);
      }
    } else if (component.render) {
      // 如果是组件配置对象
      const rendered = component.render();
      element.innerHTML = '';
      element.appendChild(rendered);
    } else {
      // 直接HTML内容
      element.innerHTML = component;
    }
  }

  // 预加载组件
  async preload(key, loader, options = {}) {
    try {
      const component = await this.getOrLoad(key, loader, options);
      return { key, success: true, component };
    } catch (error) {
      return { key, success: false, error };
    }
  }

  // 注册懒加载组件
  async register(key, loader, options = {}) {
    if (options.lazy) {
      // 创建观察器用于懒加载
      if (!this.observer) {
        this.observer = {
          observe: () => {},
          unobserve: () => {},
          disconnect: () => {}
        };
      }
    } else {
      await this.getOrLoad(key, loader, options);
    }
  }

  // 获取缓存项元数据
  getMetadata(key) {
    const entry = this.cache.get(key);
    return entry ? entry.metadata : null;
  }

  // 获取缓存统计
  getStats() {
    const now = Date.now();
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      maxCacheSize: this.options.maxCacheSize,
      loadingCount: this.loadingPromises.size,
      totalSize,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      oldestEntry: this._getOldestEntry(),
      memoryUsage: this._estimateMemoryUsage()
    };
  }

  // 获取最老的条目
  _getOldestEntry() {
    let oldestKey = null;
    let oldestTime = Infinity;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey ? {
      key: oldestKey,
      age: now - this.cache.get(oldestKey).timestamp,
      ...this.cache.get(oldestKey)
    } : null;
  }

  // 估算内存使用
  _estimateMemoryUsage() {
    return Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
  }

  // 销毁
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.clear();
  }
}

// 全局缓存管理器实例
export const componentCacheManager = new ComponentCacheManager();

// 便捷方法
export const cacheComponent = (key, component, metadata) => 
  componentCacheManager.set(key, component, metadata);

export const getCachedComponent = (key) => 
  componentCacheManager.get(key);

export const loadComponent = (key, loader, options) => 
  componentCacheManager.getOrLoad(key, loader, options);

export const clearComponentCache = () => 
  componentCacheManager.clear();