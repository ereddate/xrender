// 增强的生命周期钩子系统
export class EnhancedLifecycleManager {
  constructor(options = {}) {
    this.hooks = new Map(); // 钩子存储
    this.hookExecutors = new Map(); // 钩子执行器
    this.hookOrder = new Map(); // 钩子执行顺序
    this.lifecycleConfig = new Map(); // 生命周期配置
    this.hookMiddleware = []; // 钩子中间件
    this.hookConditions = new Map(); // 钩子执行条件
    this.asyncHookQueue = new Map(); // 异步钩子队列
    this.options = {
      enableAsyncHooks: options.enableAsyncHooks !== false,
      enableHookConditions: options.enableHookConditions !== false,
      enableHookOrdering: options.enableHookOrdering !== false,
      maxHookExecutionTime: options.maxHookExecutionTime || 5000,
      enableHookTimeout: options.enableHookTimeout !== false,
      ...options
    };
  }

  // 注册生命周期钩子
  registerHook(phase, hookName, handler, options = {}) {
    if (!this.hooks.has(phase)) {
      this.hooks.set(phase, new Map());
    }

    const phaseHooks = this.hooks.get(phase);
    const hookConfig = {
      name: hookName,
      handler,
      priority: options.priority || 0,
      condition: options.condition || null,
      async: options.async || false,
      timeout: options.timeout || this.options.maxHookExecutionTime,
      middleware: options.middleware || [],
      metadata: options.metadata || {},
      enabled: options.enabled !== false,
      dependsOn: options.dependsOn || null
    };

    phaseHooks.set(hookName, hookConfig);
    this._updateHookOrder(phase);
    
    return this;
  }

  // 注册异步钩子
  registerAsyncHook(phase, hookName, handler, options = {}) {
    return this.registerHook(phase, hookName, handler, {
      ...options,
      async: true
    });
  }

  // 注册条件钩子
  registerConditionalHook(phase, hookName, handler, condition, options = {}) {
    return this.registerHook(phase, hookName, handler, {
      ...options,
      condition
    });
  }

  // 设置钩子执行顺序
  setHookOrder(phase, hookNames, order = 'sequence') {
    this.hookOrder.set(phase, {
      names: hookNames,
      order,
      customOrder: order === 'custom'
    });
  }

  // 添加钩子中间件
  addHookMiddleware(middleware) {
    console.log('Adding middleware. Current count before:', this.hookMiddleware.length);
    this.hookMiddleware.push(middleware);
    console.log('Adding middleware. Current count after:', this.hookMiddleware.length);
    return this;
  }

  // 执行生命周期钩子
  async executeHook(phase, context = {}, options = {}) {
    const phaseHooks = this.hooks.get(phase);
    console.log(`executeHook called for phase: ${phase}, hooks found: ${phaseHooks ? phaseHooks.size : 0}`);
    
    if (!phaseHooks || phaseHooks.size === 0) {
      return context;
    }

    const executionContext = {
      phase,
      originalContext: { ...context },
      ...context,
      hookResults: new Map(),
      errors: []
    };

    try {
      // 应用中间件
      await this._applyMiddleware(executionContext, phase);

      // 执行钩子
      const result = await this._executePhaseHooks(phase, executionContext, options);

      // 将修改从 executionContext 合并回原始 context
      Object.keys(executionContext).forEach(key => {
        if (key !== 'phase' && key !== 'originalContext' && key !== 'hookResults' && key !== 'errors') {
          context[key] = executionContext[key];
        }
      });

      // 构建返回结果
      const returnContext = { ...context };
      returnContext.hookResults = executionContext.hookResults;
      returnContext.errors = executionContext.errors;
      returnContext.originalContext = executionContext.originalContext;
      
      // 合并钩子执行结果
      if (result && typeof result === 'object') {
        Object.assign(returnContext, result);
      }

      return returnContext;
    } catch (error) {
      executionContext.errors.push(error);
      console.error(`生命周期钩子执行失败 [${phase}]:`, error);
      
      // 如果是超时错误，或者 options.throwOnError 为 true，则抛出错误
      if (error.message === 'timeout' || options.throwOnError) {
        throw error;
      }
      
      // 将错误也合并到原始上下文
      context.errors = executionContext.errors;
      context.originalContext = executionContext.originalContext;
      
      // 否则返回包含错误的结果
      return {
        ...context,
        hookResults: executionContext.hookResults,
        errors: executionContext.errors,
        originalContext: executionContext.originalContext
      };
    }
  }

  // 应用中间件
  async _applyMiddleware(context, phase) {
    console.log('Applying middleware. Total middleware count:', this.hookMiddleware.length);
    
    // 创建中间件链
    const dispatch = async (i) => {
      if (i <= this.hookMiddleware.length) {
        const middleware = this.hookMiddleware[i - 1];
        if (middleware) {
          try {
            // 创建 next 函数，调用下一个中间件
            const next = async (error) => {
              console.log('Next function called with error:', error);
              if (error) {
                throw error;
              }
              // 继续到下一个中间件
              await dispatch(i + 1);
            };
            
            console.log('Processing middleware:', i, middleware.toString());
            console.log('Middleware function length:', middleware.length);
            console.log('Context before middleware:', context);
            console.log('Context has middlewareApplied:', 'middlewareApplied' in context);
            
            // 根据中间件函数的参数数量决定如何调用它
            try {
              // 先尝试2参数调用（context, next）
              console.log('Trying to call middleware with (context, next)');
              const result = await middleware(context, next);
              console.log('Middleware result:', result);
              console.log('Context after middleware:', context);
              console.log('Context has middlewareApplied after:', 'middlewareApplied' in context);
            } catch (error) {
              console.log('Middleware call error:', error.message);
              if (error.message.includes('next is not a function')) {
                // 如果失败，尝试3参数调用（context, phase, next）
                console.log('Retrying with (context, phase, next)');
                await middleware(context, phase, next);
              } else {
                throw error;
              }
            }
          } catch (error) {
            console.warn('钩子中间件执行失败:', error);
            throw error; // 重新抛出错误以便上层处理
          }
        } else {
          // 没有更多中间件，结束链
          console.log('Middleware chain completed');
        }
      }
    };
    
    // 开始执行中间件链
    await dispatch(1);
  }

  // 执行阶段钩子
  async _executePhaseHooks(phase, executionContext, options = {}) {
    const phaseHooks = this.hooks.get(phase);
    const hookOrder = this.hookOrder.get(phase);
    
    // 获取要执行的钩子列表
    const hooksToExecute = this._getHooksToExecute(phaseHooks, executionContext);
    
    // 根据执行顺序执行钩子
    if (hookOrder?.customOrder) {
      return this._executeHooksInCustomOrder(hooksToExecute, hookOrder, executionContext, options);
    } else {
      return this._executeHooksInDefaultOrder(hooksToExecute, executionContext, options);
    }
  }

  // 获取要执行的钩子
  _getHooksToExecute(phaseHooks, executionContext) {
    const hooks = [];
    
    for (const [hookName, hookConfig] of phaseHooks.entries()) {
      // 检查钩子是否启用
      if (!hookConfig.enabled) {
        continue;
      }

      // 检查执行条件
      if (hookConfig.condition && !this._evaluateCondition(hookConfig.condition, executionContext)) {
        continue;
      }

      hooks.push({ name: hookName, config: hookConfig });
    }

    // 按优先级排序
    return hooks.sort((a, b) => b.config.priority - a.config.priority);
  }

  // 评估执行条件
  _evaluateCondition(condition, context) {
    if (typeof condition === 'function') {
      try {
        return condition(context);
      } catch (error) {
        console.warn('钩子条件执行失败:', error);
        return false;
      }
    }
    
    if (typeof condition === 'boolean') {
      return condition;
    }
    
    return true;
  }

  // 默认顺序执行钩子
  async _executeHooksInDefaultOrder(hooks, executionContext, options = {}) {
    const results = {};
    
    console.log(`Executing ${hooks.length} hooks for phase ${executionContext.phase}`);
    
    for (const { name, config } of hooks) {
      try {
        const startTime = performance.now();
        const result = await this._executeSingleHook(config, executionContext, options);
        const endTime = performance.now();
        
        console.log(`Hook ${name} result:`, result);
        executionContext.hookResults.set(name, result);
        
        // 合并结果
        if (result && typeof result === 'object') {
          Object.assign(results, result);
        }
      } catch (error) {
        executionContext.errors.push(error);
        
        executionContext.hookResults.set(name, {
          error,
          success: false
        });
        
        // 如果是超时错误，总是抛出
        if (error.message === 'timeout') {
          throw error;
        }
        
        // 默认继续执行，除非明确指定 continueOnError: false
        if (options.continueOnError === false) {
          throw error;
        }
      }
    }
    
    return results;
  }

  // 自定义顺序执行钩子
  async _executeHooksInCustomOrder(hooks, hookOrder, executionContext, options = {}) {
    const results = {};
    const hookMap = new Map(hooks.map(h => [h.name, h]));
    
    for (const hookName of hookOrder.names) {
      const hook = hookMap.get(hookName);
      if (!hook) {
        console.warn(`钩子 "${hookName}" 在阶段 "${executionContext.phase}" 中不存在`);
        continue;
      }
      
      try {
        const startTime = performance.now();
        const result = await this._executeSingleHook(hook.config, executionContext, options);
        const endTime = performance.now();
        
        executionContext.hookResults.set(hookName, result);
        
        if (result && typeof result === 'object') {
          Object.assign(results, result);
        }
      } catch (error) {
        executionContext.errors.push({
          hook: hookName,
          error,
          phase: executionContext.phase
        });
        
        executionContext.hookResults.set(hookName, {
          error,
          success: false
        });
        
        if (!options.continueOnError) {
          throw error;
        }
      }
    }
    
    return results;
  }

  // 执行单个钩子
  async _executeSingleHook(hookConfig, executionContext, options = {}) {
    const { handler, async, timeout } = hookConfig;
    
    // 使用原始上下文来调用钩子处理器，这样用户期望接收原始 context
    const originalContext = executionContext.originalContext || executionContext;
    
    // 执行钩子处理器
    let result;
    if (async && this.options.enableAsyncHooks) {
      result = await this._executeAsyncHook(handler, originalContext, timeout);
    } else {
      result = await this._executeSyncHook(handler, originalContext, timeout);
    }
    
    // 将原始上下文的修改合并回执行上下文
    Object.keys(originalContext).forEach(key => {
      if (key !== 'phase' && key !== 'originalContext' && key !== 'hookResults' && key !== 'errors') {
        executionContext[key] = originalContext[key];
      }
    });
    
    return result;
  }

  // 执行同步钩子
  _executeSyncHook(handler, executionContext, timeout) {
    if (this.options.enableHookTimeout && timeout) {
      return Promise.race([
        Promise.resolve(handler(executionContext)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`timeout`)), timeout)
        )
      ]);
    }
    
    return handler(executionContext);
  }

  // 执行异步钩子
  async _executeAsyncHook(handler, executionContext, timeout) {
    const result = handler(executionContext);
    
    if (this.options.enableHookTimeout && timeout) {
      return Promise.race([
        result,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`timeout`)), timeout)
        )
      ]);
    }
    
    return result;
  }

  // 更新钩子顺序
  _updateHookOrder(phase) {
    const phaseHooks = this.hooks.get(phase);
    if (phaseHooks && !this.hookOrder.has(phase)) {
      // 自动生成执行顺序
      const hookNames = Array.from(phaseHooks.keys());
      this.setHookOrder(phase, hookNames);
    }
  }

  // 移除钩子
  removeHook(phase, hookName) {
    const phaseHooks = this.hooks.get(phase);
    if (phaseHooks) {
      phaseHooks.delete(hookName);
      this._updateHookOrder(phase);
    }
    return this;
  }

  // 启用/禁用钩子
  toggleHook(phase, hookName, enabled = true) {
    const phaseHooks = this.hooks.get(phase);
    if (phaseHooks && phaseHooks.has(hookName)) {
      const config = phaseHooks.get(hookName);
      config.enabled = enabled;
    }
    return this;
  }

  // 获取钩子信息
  getHookInfo(phase, hookName = null) {
    if (hookName) {
      const phaseHooks = this.hooks.get(phase);
      return phaseHooks?.get(hookName) || null;
    }
    
    const phaseHooks = this.hooks.get(phase);
    return phaseHooks ? Array.from(phaseHooks.values()) : [];
  }

  // 获取所有钩子
  getAllHooks() {
    const result = {};
    
    // 包含所有可能的生命周期阶段
    const allPhases = [
      'beforeInitialize', 'afterInitialize',
      'beforeMount', 'afterMount', 
      'beforeUpdate', 'afterUpdate',
      'beforeUnmount', 'afterUnmount',
      'beforeDestroy', 'afterDestroy',
      'onError', 'afterError'
    ];
    
    // 初始化所有阶段为空数组
    for (const phase of allPhases) {
      result[phase] = [];
    }
    
    // 填充实际存在的钩子
    for (const [phase, hooks] of this.hooks.entries()) {
      result[phase] = Array.from(hooks.values());
    }
    
    return result;
  }

  // 清空钩子
  clearHooks(phase = null) {
    if (phase) {
      this.hooks.delete(phase);
      this.hookOrder.delete(phase);
    } else {
      this.hooks.clear();
      this.hookOrder.clear();
    }
    return this;
  }

  // 清空所有钩子（别名）
  clearAllHooks() {
    return this.clearHooks();
  }

  // 禁用钩子
  disableHook(phase, hookName) {
    return this.toggleHook(phase, hookName, false);
  }

  // 启用钩子
  enableHook(phase, hookName) {
    return this.toggleHook(phase, hookName, true);
  }

  // 获取特定阶段的钩子
  getHooksForPhase(phase) {
    return this.hooks.get(phase) || new Map();
  }

  // 获取钩子统计信息
  getHookStats(phase) {
    const phaseHooks = this.hooks.get(phase);
    if (!phaseHooks) {
      return {
        totalHooks: 0,
        enabledHooks: 0,
        disabledHooks: 0,
        asyncHooks: 0,
        syncHooks: 0,
        conditionalHooks: 0
      };
    }

    const stats = {
      totalHooks: phaseHooks.size,
      enabledHooks: 0,
      disabledHooks: 0,
      asyncHooks: 0,
      syncHooks: 0,
      conditionalHooks: 0
    };

    for (const hook of phaseHooks.values()) {
      if (hook.enabled) {
        stats.enabledHooks++;
      } else {
        stats.disabledHooks++;
      }

      if (hook.async) {
        stats.asyncHooks++;
      } else {
        stats.syncHooks++;
      }

      if (hook.condition) {
        stats.conditionalHooks++;
      }
    }

    return stats;
  }

  // 批量注册钩子
  registerBatchHooks(hooksConfig) {
    for (const config of hooksConfig) {
      const { phase, name, handler, ...options } = config;
      this.registerHook(phase, name, handler, options);
    }
    return this;
  }

  // 克隆钩子配置
  cloneHookConfig(phase, hookName, newHookName = null) {
    const phaseHooks = this.hooks.get(phase);
    if (!phaseHooks || !phaseHooks.has(hookName)) {
      return null;
    }

    const originalConfig = phaseHooks.get(hookName);
    const clonedConfig = { ...originalConfig };
    
    if (newHookName) {
      clonedConfig.name = newHookName;
    }

    return clonedConfig;
  }

  // 验证钩子配置
  validateHookConfig(config) {
    if (!config || typeof config !== 'object') {
      return false;
    }

    if (typeof config.handler !== 'function') {
      return false;
    }

    if (config.priority !== undefined && typeof config.priority !== 'number') {
      return false;
    }

    if (config.condition && typeof config.condition !== 'function' && typeof config.condition !== 'boolean') {
      return false;
    }

    if (config.timeout !== undefined && typeof config.timeout !== 'number') {
      return false;
    }

    return true;
  }

  // 暂停钩子执行
  pauseHooks(phase) {
    if (!this.hooks.has(phase)) {
      this.hooks.set(phase, new Map());
    }
    const phaseHooks = this.hooks.get(phase);
    if (phaseHooks) {
      for (const hook of phaseHooks.values()) {
        hook.enabled = false;
      }
    }
    return this;
  }

  // 恢复钩子执行
  resumeHooks(phase) {
    const phaseHooks = this.hooks.get(phase);
    if (phaseHooks) {
      for (const hook of phaseHooks.values()) {
        hook.enabled = true;
      }
    }
    return this;
  }

  // 设置钩子上下文
  setHookContext(phase, context) {
    if (!this.hookConditions.has(phase)) {
      this.hookConditions.set(phase, new Map());
    }
    const phaseContext = this.hookConditions.get(phase);
    phaseContext.set('__context__', context);
    return this;
  }

  // 获取钩子上下文
  getHookContext(phase) {
    const phaseContext = this.hookConditions.get(phase);
    return phaseContext?.get('__context__') || null;
  }

  // 监听钩子事件
  onHookEvent(phase, hookName, event, handler) {
    // 这里可以实现事件监听逻辑
    // 为简化实现，暂时存储在 metadata 中
    const phaseHooks = this.hooks.get(phase);
    if (phaseHooks && phaseHooks.has(hookName)) {
      const hookConfig = phaseHooks.get(hookName);
      if (!hookConfig.metadata.events) {
        hookConfig.metadata.events = {};
      }
      hookConfig.metadata.events[event] = handler;
    }
    return this;
  }

  // 触发钩子事件
  triggerHookEvent(phase, hookName, event, data) {
    const phaseHooks = this.hooks.get(phase);
    if (phaseHooks && phaseHooks.has(hookName)) {
      const hookConfig = phaseHooks.get(hookName);
      if (hookConfig.metadata.events && hookConfig.metadata.events[event]) {
        const handler = hookConfig.metadata.events[event];
        return handler(data);
      }
    }
    return null;
  }

  // 创建钩子装饰器
  createHookDecorator(phase, options = {}) {
    return (target, propertyName, descriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        const context = {
          target: this,
          method: propertyName,
          args,
          originalResult: null
        };
        
        // 执行前置钩子
        await this.lifecycleManager.executeHook(`before${phase}`, context);
        
        try {
          // 执行原始方法
          const result = await originalMethod.apply(this, args);
          context.originalResult = result;
          
          // 执行后置钩子
          const afterResult = await this.lifecycleManager.executeHook(`after${phase}`, {
            ...context,
            result
          });
          
          return afterResult?.result || result;
        } catch (error) {
          // 执行错误钩子
          await this.lifecycleManager.executeHook(`error${phase}`, {
            ...context,
            error
          });
          
          throw error;
        }
      };
      
      return descriptor;
    };
  }

  // 获取生命周期统计
  getLifecycleStats() {
    const stats = {
      totalPhases: this.hooks.size,
      totalHooks: 0,
      asyncHooks: 0,
      conditionalHooks: 0,
      hookMiddlewareCount: this.hookMiddleware.length
    };
    
    for (const hooks of this.hooks.values()) {
      stats.totalHooks += hooks.size;
      
      for (const hook of hooks.values()) {
        if (hook.async) stats.asyncHooks++;
        if (hook.condition) stats.conditionalHooks++;
      }
    }
    
    return stats;
  }

  // 导出钩子配置
  exportHooks() {
    return {
      hooks: Object.fromEntries(
        Array.from(this.hooks.entries()).map(([phase, hooks]) => [
          phase,
          Object.fromEntries(hooks)
        ])
      ),
      hookOrder: Object.fromEntries(this.hookOrder),
      lifecycleConfig: Object.fromEntries(this.lifecycleConfig),
      exportTime: new Date().toISOString()
    };
  }

  // 导入钩子配置
  importHooks(config) {
    this.clearHooks();
    
    if (config.hooks) {
      for (const [phase, hooks] of Object.entries(config.hooks)) {
        for (const [hookName, hookConfig] of Object.entries(hooks)) {
          this.registerHook(phase, hookName, hookConfig.handler, hookConfig);
        }
      }
    }
    
    if (config.hookOrder) {
      for (const [phase, order] of Object.entries(config.hookOrder)) {
        this.setHookOrder(phase, order.names, order.order);
      }
    }
    
    return this;
  }

  // 销毁
  destroy() {
    this.clearHooks();
    this.hookMiddleware = [];
    this.hookConditions.clear();
    this.asyncHookQueue.clear();
  }
}

// 全局生命周期管理器实例
export const lifecycleManager = new EnhancedLifecycleManager();

// 便捷方法
export const registerLifecycleHook = (phase, name, handler, options) => 
  lifecycleManager.registerHook(phase, name, handler, options);

export const executeLifecycleHook = (phase, context, options) => 
  lifecycleManager.executeHook(phase, context, options);

export const addLifecycleMiddleware = (middleware) => 
  lifecycleManager.addHookMiddleware(middleware);

export const createLifecycleDecorator = (phase, options) => 
  lifecycleManager.createHookDecorator(phase, options);

// 预定义的常用生命周期钩子
export const LIFECYCLE_PHASES = {
  INITIALIZE: 'initialize',
  MOUNT: 'mount',
  UPDATE: 'update',
  UNMOUNT: 'unmount',
  DESTROY: 'destroy',
  ERROR: 'error'
};

export const LIFECYCLE_HOOKS = {
  // 初始化阶段
  BEFORE_INITIALIZE: 'beforeInitialize',
  AFTER_INITIALIZE: 'afterInitialize',
  
  // 挂载阶段
  BEFORE_MOUNT: 'beforeMount',
  AFTER_MOUNT: 'afterMount',
  
  // 更新阶段
  BEFORE_UPDATE: 'beforeUpdate',
  AFTER_UPDATE: 'afterUpdate',
  
  // 卸载阶段
  BEFORE_UNMOUNT: 'beforeUnmount',
  AFTER_UNMOUNT: 'afterUnmount',
  
  // 销毁阶段
  BEFORE_DESTROY: 'beforeDestroy',
  AFTER_DESTROY: 'afterDestroy',
  
  // 错误处理
  ON_ERROR: 'onError',
  AFTER_ERROR: 'afterError'
};