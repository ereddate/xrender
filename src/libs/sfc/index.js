// SFC 模块入口文件
import { SFCParser } from './sfc-parser.js';
import { TemplateCompiler } from './template-compiler.js';
import { StyleProcessor } from './style-processor.js';
import { SFCBuilder, registerSFC, loadXRTFromFile } from './sfc-builder.js';
import { XRender } from '../core.js';

// 导入高级管理器
import { EnhancedLifecycleManager } from './lifecycle-manager.js';
import { ComponentCacheManager } from './component-cache-manager.js';
import { AsyncComponentManager } from './async-component-manager.js';
import { ErrorBoundaryManager } from './error-boundary-manager.js';
import { AdvancedSlotManager } from './advanced-slot-manager.js';
import { ComponentPerformanceMonitor } from './performance-monitor.js';
import { TypeScriptTypeManager } from './typescript-type-manager.js';
import { AdvancedStyleProcessor } from './advanced-style-processor.js';

// 独立的 SFC 解析和编译函数
export function parseSFC(source, options = {}) {
  const parser = new SFCParser(source, options);
  return parser.parse();
}

export function compileSFC(source, options = {}) {
  const descriptor = parseSFC(source, options);
  
  const compiler = new TemplateCompiler(descriptor, options);
  const compiled = compiler.compile();
  
  return {
    descriptor,
    ...compiled
  };
}

// 将 SFC 功能集成到 XRender 中
export function initSFC(XRender, options = {}) {
  if (!XRender) {
    console.error('XRender 未加载，无法初始化 SFC 功能');
    return;
  }

  // 初始化高级管理器
  const lifecycleManager = new EnhancedLifecycleManager(options.lifecycle);
  const componentCacheManager = new ComponentCacheManager(options.cache);
  const asyncComponentManager = new AsyncComponentManager(componentCacheManager);
  const errorBoundaryManager = new ErrorBoundaryManager(options.errorBoundary);
  const advancedSlotManager = new AdvancedSlotManager();
  const performanceMonitor = new ComponentPerformanceMonitor(options.performance);
  const typeScriptTypeManager = new TypeScriptTypeManager(options.typescript);
  const advancedStyleProcessor = new AdvancedStyleProcessor(options.style);

  // 创建SFC管理器集合
  const sfcManagers = {
    lifecycle: lifecycleManager,
    cache: componentCacheManager,
    async: asyncComponentManager,
    errorBoundary: errorBoundaryManager,
    slot: advancedSlotManager,
    performance: performanceMonitor,
    typescript: typeScriptTypeManager,
    style: advancedStyleProcessor
  };

  // 添加 SFC 相关的全局方法
  XRender.sfc = {
    parse: parseSFC,
    compile: compileSFC,
    register: registerSFC,
    loadFromFile: loadXRTFromFile,
    // 高级管理器访问接口
    managers: sfcManagers,
    // 便捷方法
    createLifecycle: (options) => new EnhancedLifecycleManager(options),
    createCache: (options) => new ComponentCacheManager(options),
    createAsync: (cache) => new AsyncComponentManager(cache),
    createErrorBoundary: (options) => new ErrorBoundaryManager(options),
    createSlot: () => new AdvancedSlotManager(),
    createPerformance: (options) => new ComponentPerformanceMonitor(options),
    createTypeScript: (options) => new TypeScriptTypeManager(options),
    createStyle: (options) => new AdvancedStyleProcessor(options)
  };

  // 添加全局组件加载方法
  XRender.loadXRT = loadXRTFromFile;
  XRender.registerXRT = registerSFC;

  // 添加热更新支持
  if (options.hotReload !== false) {
    initHotReload(XRender, sfcManagers);
  }

  // 添加组件通信支持
  if (options.componentCommunication !== false) {
    initComponentCommunication(XRender, sfcManagers);
  }

  // 添加依赖注入支持
  if (options.dependencyInjection !== false) {
    initDependencyInjection(XRender, sfcManagers);
  }

  console.log('XRender SFC 功能已初始化（包含高级管理器）');
  return sfcManagers;
}

// 热更新支持
function initHotReload(XRender, sfcManagers) {
  const hotReloadManager = {
    componentVersions: new Map(),
    componentStates: new Map(),
    eventListeners: new Map(),
    isHotReloading: false,

    // 注册组件用于热更新
    registerComponent(componentName, component, instance) {
      const version = Date.now();
      this.componentVersions.set(componentName, version);
      
      if (instance) {
        this.componentStates.set(componentName, {
          state: instance.state || {},
          props: instance.props || {},
          version
        });
      }
      
      return version;
    },

    // 热更新组件
    async hotReloadComponent(componentName, newComponent) {
      if (this.isHotReloading) {
        console.warn('正在进行热更新，请稍后再试');
        return false;
      }

      this.isHotReloading = true;
      
      try {
        const oldVersion = this.componentVersions.get(componentName);
        const newVersion = Date.now();
        
        // 触发更新前事件
        this.emit('beforeUpdate', { componentName, oldVersion, newVersion });
        
        // 保存组件状态
        const savedState = this.componentStates.get(componentName);
        
        // 清除缓存
        sfcManagers.cache.clear(componentName);
        
        // 重新注册组件
        XRender.registerXRT(componentName, newComponent);
        
        // 更新版本
        this.componentVersions.set(componentName, newVersion);
        
        // 触发更新后事件
        this.emit('afterUpdate', { componentName, oldVersion, newVersion, savedState });
        
        console.log(`组件 ${componentName} 热更新成功`);
        return true;
      } catch (error) {
        console.error(`组件 ${componentName} 热更新失败:`, error);
        this.emit('error', { componentName, error });
        return false;
      } finally {
        this.isHotReloading = false;
      }
    },

    // 事件监听
    on(event, callback) {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event).push(callback);
    },

    // 触发事件
    emit(event, data) {
      const listeners = this.eventListeners.get(event) || [];
      listeners.forEach(callback => callback(data));
    }
  };

  // 添加到XRender
  XRender.hotReload = hotReloadManager;
  XRender.sfc.hotReload = hotReloadManager;
}

// 组件通信支持
function initComponentCommunication(XRender, sfcManagers) {
  // 事件总线
  const eventBus = {
    events: new Map(),

    // 订阅事件
    on(event, callback, options = {}) {
      if (!this.events.has(event)) {
        this.events.set(event, []);
      }
      
      const listener = {
        callback,
        once: options.once || false,
        context: options.context || null
      };
      
      this.events.get(event).push(listener);
      return () => this.off(event, callback);
    },

    // 取消订阅
    off(event, callback) {
      if (!this.events.has(event)) return;
      
      const listeners = this.events.get(event);
      const index = listeners.findIndex(l => l.callback === callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      
      if (listeners.length === 0) {
        this.events.delete(event);
      }
    },

    // 触发事件
    emit(event, data) {
      if (!this.events.has(event)) return;
      
      const listeners = [...this.events.get(event)];
      listeners.forEach(listener => {
        try {
          if (listener.context) {
            listener.callback.call(listener.context, data);
          } else {
            listener.callback(data);
          }
          
          if (listener.once) {
            this.off(event, listener.callback);
          }
        } catch (error) {
          console.error(`事件 ${event} 处理失败:`, error);
        }
      });
    },

    // 订阅一次性事件
    once(event, callback, context) {
      return this.on(event, callback, { once: true, context });
    },

    // 清除所有事件
    clear() {
      this.events.clear();
    }
  };

  // Provide/Inject 系统
  const provideInjectSystem = {
    providers: new Map(),
    injectors: new Map(),

    // 提供依赖
    provide(key, value, component) {
      const providerId = component ? component.name : 'global';
      
      if (!this.providers.has(providerId)) {
        this.providers.set(providerId, new Map());
      }
      
      this.providers.get(providerId).set(key, {
        value,
        component,
        timestamp: Date.now()
      });
      
      // 通知所有注入者
      this.notifyInjectors(key, value);
    },

    // 注入依赖
    inject(key, callback, component) {
      const injectorId = component ? component.name : 'global';
      
      if (!this.injectors.has(injectorId)) {
        this.injectors.set(injectorId, new Map());
      }
      
      this.injectors.get(injectorId).set(key, {
        callback,
        component
      });
      
      // 查找并返回当前值
      const value = this.findProvider(key);
      if (value !== undefined && callback) {
        callback(value);
      }
      
      return value;
    },

    // 查找提供者
    findProvider(key) {
      // 从全局到局部查找
      for (const [providerId, providers] of this.providers) {
        if (providers.has(key)) {
          return providers.get(key).value;
        }
      }
      return undefined;
    },

    // 通知注入者
    notifyInjectors(key, value) {
      for (const [injectorId, injectors] of this.injectors) {
        if (injectors.has(key)) {
          const injector = injectors.get(key);
          try {
            injector.callback(value);
          } catch (error) {
            console.error(`注入 ${key} 失败:`, error);
          }
        }
      }
    },

    // 移除提供者
    removeProvider(key, component) {
      const providerId = component ? component.name : 'global';
      if (this.providers.has(providerId)) {
        this.providers.get(providerId).delete(key);
      }
    },

    // 移除注入者
    removeInjector(key, component) {
      const injectorId = component ? component.name : 'global';
      if (this.injectors.has(injectorId)) {
        this.injectors.get(injectorId).delete(key);
      }
    },

    // 清除所有
    clear() {
      this.providers.clear();
      this.injectors.clear();
    }
  };

  // 添加到XRender
  XRender.eventBus = eventBus;
  XRender.provide = (key, value, component) => provideInjectSystem.provide(key, value, component);
  XRender.inject = (key, callback, component) => provideInjectSystem.inject(key, callback, component);
  
  XRender.sfc.eventBus = eventBus;
  XRender.sfc.provide = (key, value, component) => provideInjectSystem.provide(key, value, component);
  XRender.sfc.inject = (key, callback, component) => provideInjectSystem.inject(key, callback, component);
}

// 依赖注入支持
function initDependencyInjection(XRender, sfcManagers) {
  const dependencyContainer = {
    services: new Map(),
    singletons: new Map(),
    factories: new Map(),
    dependencies: new Map(),

    // 注册服务
    register(name, implementation, options = {}) {
      const serviceConfig = {
        implementation,
        singleton: options.singleton !== false,
        factory: options.factory || null,
        dependencies: options.dependencies || [],
        lazy: options.lazy !== false
      };
      
      this.services.set(name, serviceConfig);
      
      // 如果是单例且不是延迟加载，立即实例化
      if (serviceConfig.singleton && !serviceConfig.lazy) {
        this.resolve(name);
      }
      
      return this;
    },

    // 注册工厂函数
    registerFactory(name, factory, options = {}) {
      this.factories.set(name, {
        factory,
        dependencies: options.dependencies || [],
        singleton: options.singleton !== false
      });
      
      return this;
    },

    // 解析依赖
    resolve(name, context = {}) {
      // 检查单例缓存
      if (this.singletons.has(name)) {
        return this.singletons.get(name);
      }
      
      // 检查工厂
      if (this.factories.has(name)) {
        const factoryConfig = this.factories.get(name);
        const instance = this._createInstance(factoryConfig.factory, factoryConfig.dependencies, context);
        
        if (factoryConfig.singleton) {
          this.singletons.set(name, instance);
        }
        
        return instance;
      }
      
      // 检查服务
      if (this.services.has(name)) {
        const serviceConfig = this.services.get(name);
        
        if (serviceConfig.factory) {
          const instance = this._createInstance(serviceConfig.factory, serviceConfig.dependencies, context);
          
          if (serviceConfig.singleton) {
            this.singletons.set(name, instance);
          }
          
          return instance;
        }
        
        const instance = this._createInstance(serviceConfig.implementation, serviceConfig.dependencies, context);
        
        if (serviceConfig.singleton) {
          this.singletons.set(name, instance);
        }
        
        return instance;
      }
      
      throw new Error(`服务 ${name} 未注册`);
    },

    // 创建实例
    _createInstance(implementation, dependencies, context) {
      const resolvedDependencies = dependencies.map(dep => this.resolve(dep, context));
      
      if (typeof implementation === 'function') {
        return new implementation(...resolvedDependencies);
      }
      
      return implementation;
    },

    // 注入到组件
    injectTo(component, dependencies) {
      const resolved = {};
      
      for (const [key, dependencyName] of Object.entries(dependencies)) {
        try {
          resolved[key] = this.resolve(dependencyName);
        } catch (error) {
          console.error(`注入依赖 ${dependencyName} 失败:`, error);
        }
      }
      
      // 将依赖注入到组件
      Object.assign(component, resolved);
      
      return resolved;
    },

    // 检查服务是否已注册
    has(name) {
      return this.services.has(name) || this.factories.has(name);
    },

    // 注销服务
    unregister(name) {
      this.services.delete(name);
      this.factories.delete(name);
      this.singletons.delete(name);
      
      return this;
    },

    // 清除所有
    clear() {
      this.services.clear();
      this.singletons.clear();
      this.factories.clear();
      this.dependencies.clear();
    },

    // 获取统计信息
    getStats() {
      return {
        services: this.services.size,
        factories: this.factories.size,
        singletons: this.singletons.size,
        dependencies: this.dependencies.size
      };
    }
  };

  // 添加到XRender
  XRender.container = dependencyContainer;
  XRender.sfc.container = dependencyContainer;
  
  // 便捷方法
  XRender.registerService = (name, implementation, options) => dependencyContainer.register(name, implementation, options);
  XRender.resolveService = (name) => dependencyContainer.resolve(name);
  XRender.injectDependencies = (component, dependencies) => dependencyContainer.injectTo(component, dependencies);
}