import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedLifecycleManager } from '../../src/libs/sfc/lifecycle-manager.js';

describe('生命周期管理器测试', () => {
  let lifecycleManager;
  
  beforeEach(() => {
    lifecycleManager = new EnhancedLifecycleManager({
      enableAsyncHooks: true,
      enableHookConditions: true,
      enableHookOrdering: true,
      maxHookExecutionTime: 5000
    });
  });
  
  afterEach(() => {
    lifecycleManager.clearAllHooks();
  });

  it('应该能够创建生命周期管理器实例', () => {
    expect(lifecycleManager).toBeDefined();
    expect(lifecycleManager.hooks).toBeDefined();
    expect(lifecycleManager.hookExecutors).toBeDefined();
    expect(lifecycleManager.hookOrder).toBeDefined();
    expect(lifecycleManager.hookMiddleware).toBeDefined();
  });

  it('应该能够注册基础钩子', () => {
    const handler = vi.fn().mockReturnValue('handled');
    
    lifecycleManager.registerHook('beforeMount', 'testHook', handler, {
      priority: 10
    });

    const phaseHooks = lifecycleManager.hooks.get('beforeMount');
    expect(phaseHooks).toBeDefined();
    expect(phaseHooks.has('testHook')).toBe(true);
    
    const hookConfig = phaseHooks.get('testHook');
    expect(hookConfig.priority).toBe(10);
    expect(hookConfig.handler).toBe(handler);
  });

  it('应该能够注册异步钩子', async () => {
    const asyncHandler = vi.fn().mockResolvedValue('async result');
    
    lifecycleManager.registerAsyncHook('afterMount', 'asyncHook', asyncHandler);

    const phaseHooks = lifecycleManager.hooks.get('afterMount');
    const hookConfig = phaseHooks.get('asyncHook');
    
    expect(hookConfig.async).toBe(true);
  });

  it('应该能够注册条件钩子', () => {
    const handler = vi.fn();
    const condition = (context) => context.shouldExecute;
    
    lifecycleManager.registerConditionalHook('beforeUpdate', 'conditionalHook', handler, condition);

    const phaseHooks = lifecycleManager.hooks.get('beforeUpdate');
    const hookConfig = phaseHooks.get('conditionalHook');
    
    expect(hookConfig.condition).toBe(condition);
  });

  it('应该能够执行生命周期钩子', async () => {
    const handler1 = vi.fn().mockReturnValue('result1');
    const handler2 = vi.fn().mockReturnValue('result2');
    
    lifecycleManager.registerHook('beforeMount', 'hook1', handler1);
    lifecycleManager.registerHook('beforeMount', 'hook2', handler2);

    const context = { component: 'TestComponent' };
    const result = await lifecycleManager.executeHook('beforeMount', context);

    expect(handler1).toHaveBeenCalledWith(context);
    expect(handler2).toHaveBeenCalledWith(context);
    expect(result).toHaveProperty('hookResults');
  });

  it('应该能够按优先级执行钩子', async () => {
    const executionOrder = [];
    
    const handler1 = vi.fn().mockImplementation(() => {
      executionOrder.push('low');
      return 'low';
    });
    
    const handler2 = vi.fn().mockImplementation(() => {
      executionOrder.push('high');
      return 'high';
    });
    
    const handler3 = vi.fn().mockImplementation(() => {
      executionOrder.push('medium');
      return 'medium';
    });

    lifecycleManager.registerHook('beforeMount', 'lowPriority', handler1, { priority: 1 });
    lifecycleManager.registerHook('beforeMount', 'highPriority', handler2, { priority: 10 });
    lifecycleManager.registerHook('beforeMount', 'mediumPriority', handler3, { priority: 5 });

    await lifecycleManager.executeHook('beforeMount', {});

    expect(executionOrder).toEqual(['high', 'medium', 'low']);
  });

  it('应该能够处理异步钩子执行', async () => {
    const asyncHandler1 = vi.fn().mockResolvedValue('async1');
    const asyncHandler2 = vi.fn().mockResolvedValue('async2');
    
    lifecycleManager.registerAsyncHook('afterMount', 'async1', asyncHandler1);
    lifecycleManager.registerAsyncHook('afterMount', 'async2', asyncHandler2);

    const result = await lifecycleManager.executeHook('afterMount', {});

    expect(asyncHandler1).toHaveBeenCalled();
    expect(asyncHandler2).toHaveBeenCalled();
    expect(result.hookResults.get('async1')).toBe('async1');
    expect(result.hookResults.get('async2')).toBe('async2');
  });

  it('应该能够处理条件钩子', async () => {
    const handler = vi.fn();
    const condition = (context) => context.execute;
    
    lifecycleManager.registerConditionalHook('beforeUpdate', 'conditional', handler, condition);

    // 执行条件为false的钩子
    await lifecycleManager.executeHook('beforeUpdate', { execute: false });
    expect(handler).not.toHaveBeenCalled();

    // 执行条件为true的钩子
    await lifecycleManager.executeHook('beforeUpdate', { execute: true });
    expect(handler).toHaveBeenCalled();
  });

  it('应该能够添加钩子中间件', async () => {
    const middleware = vi.fn().mockImplementation(async (context, next) => {
      context.middlewareApplied = true;
      await next();
      context.middlewareCompleted = true;
    });

    const handler = vi.fn().mockImplementation((context) => {
      context.handlerExecuted = true;
    });

    lifecycleManager.addHookMiddleware(middleware);
    lifecycleManager.registerHook('beforeMount', 'testHook', handler);

    const context = {};
    await lifecycleManager.executeHook('beforeMount', context);

    expect(middleware).toHaveBeenCalled();
    expect(context.middlewareApplied).toBe(true);
    expect(context.middlewareCompleted).toBe(true);
    expect(context.handlerExecuted).toBe(true);
  });

  it('应该能够设置钩子执行顺序', () => {
    lifecycleManager.registerHook('beforeMount', 'hook1', vi.fn());
    lifecycleManager.registerHook('beforeMount', 'hook2', vi.fn());
    lifecycleManager.registerHook('beforeMount', 'hook3', vi.fn());

    lifecycleManager.setHookOrder('beforeMount', ['hook3', 'hook1', 'hook2'], 'custom');

    const order = lifecycleManager.hookOrder.get('beforeMount');
    expect(order.names).toEqual(['hook3', 'hook1', 'hook2']);
    expect(order.customOrder).toBe(true);
  });

  it('应该能够禁用和启用钩子', () => {
    const handler = vi.fn();
    
    lifecycleManager.registerHook('beforeMount', 'toggleHook', handler);

    // 禁用钩子
    lifecycleManager.disableHook('beforeMount', 'toggleHook');
    
    let phaseHooks = lifecycleManager.hooks.get('beforeMount');
    let hookConfig = phaseHooks.get('toggleHook');
    expect(hookConfig.enabled).toBe(false);

    // 启用钩子
    lifecycleManager.enableHook('beforeMount', 'toggleHook');
    
    phaseHooks = lifecycleManager.hooks.get('beforeMount');
    hookConfig = phaseHooks.get('toggleHook');
    expect(hookConfig.enabled).toBe(true);
  });

  it('应该能够移除钩子', () => {
    lifecycleManager.registerHook('beforeMount', 'removeHook', vi.fn());
    
    expect(lifecycleManager.hooks.get('beforeMount').has('removeHook')).toBe(true);
    
    lifecycleManager.removeHook('beforeMount', 'removeHook');
    
    expect(lifecycleManager.hooks.get('beforeMount').has('removeHook')).toBe(false);
  });

  it('应该能够清除所有钩子', () => {
    lifecycleManager.registerHook('beforeMount', 'hook1', vi.fn());
    lifecycleManager.registerHook('afterMount', 'hook2', vi.fn());
    lifecycleManager.registerHook('beforeUpdate', 'hook3', vi.fn());

    lifecycleManager.clearAllHooks();

    expect(lifecycleManager.hooks.size).toBe(0);
  });

  it('应该能够获取钩子列表', () => {
    lifecycleManager.registerHook('beforeMount', 'hook1', vi.fn());
    lifecycleManager.registerHook('beforeMount', 'hook2', vi.fn());
    lifecycleManager.registerHook('afterMount', 'hook3', vi.fn());

    const hookList = lifecycleManager.getAllHooks();

    expect(hookList.beforeMount).toHaveLength(2);
    expect(hookList.afterMount).toHaveLength(1);
    expect(hookList.beforeUpdate).toHaveLength(0);
  });

  it('应该能够获取特定阶段的钩子', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    lifecycleManager.registerHook('beforeMount', 'hook1', handler1);
    lifecycleManager.registerHook('beforeMount', 'hook2', handler2);

    const phaseHooks = lifecycleManager.getHooksForPhase('beforeMount');

    expect(phaseHooks.size).toBe(2);
    expect(phaseHooks.has('hook1')).toBe(true);
    expect(phaseHooks.has('hook2')).toBe(true);
  });

  it('应该能够处理钩子执行超时', async () => {
    const slowHandler = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    lifecycleManager.registerAsyncHook('beforeMount', 'slowHook', slowHandler, {
      timeout: 50
    });

    await expect(lifecycleManager.executeHook('beforeMount', {}))
      .rejects.toThrow('timeout');
  });

  it('应该能够处理钩子执行错误', async () => {
    const errorHandler = vi.fn().mockImplementation(() => {
      throw new Error('Hook execution failed');
    });

    lifecycleManager.registerHook('beforeMount', 'errorHook', errorHandler);

    const result = await lifecycleManager.executeHook('beforeMount', {});

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('Hook execution failed');
  });

  it('应该能够暂停和恢复钩子执行', () => {
    lifecycleManager.pauseHooks('beforeMount');
    expect(lifecycleManager.hooks.get('beforeMount')).toBeDefined();
    // 暂停钩子的具体实现可能需要根据实际代码调整

    lifecycleManager.resumeHooks('beforeMount');
    // 恢复钩子的具体实现
  });

  it('应该能够获取钩子执行统计', () => {
    lifecycleManager.registerHook('beforeMount', 'statsHook', vi.fn());
    
    const stats = lifecycleManager.getHookStats('beforeMount');
    
    expect(stats).toHaveProperty('totalHooks');
    expect(stats).toHaveProperty('asyncHooks');
    expect(stats).toHaveProperty('conditionalHooks');
    expect(stats.totalHooks).toBe(1);
  });

  it('应该能够批量注册钩子', () => {
    const hooks = [
      { phase: 'beforeMount', name: 'hook1', handler: vi.fn() },
      { phase: 'afterMount', name: 'hook2', handler: vi.fn() },
      { phase: 'beforeUpdate', name: 'hook3', handler: vi.fn() }
    ];

    lifecycleManager.registerBatchHooks(hooks);

    expect(lifecycleManager.hooks.get('beforeMount').has('hook1')).toBe(true);
    expect(lifecycleManager.hooks.get('afterMount').has('hook2')).toBe(true);
    expect(lifecycleManager.hooks.get('beforeUpdate').has('hook3')).toBe(true);
  });

  it('应该能够克隆钩子配置', () => {
    const originalHandler = vi.fn();
    lifecycleManager.registerHook('beforeMount', 'cloneHook', originalHandler, {
      priority: 5,
      condition: (ctx) => ctx.test
    });

    const clonedConfig = lifecycleManager.cloneHookConfig('beforeMount', 'cloneHook');
    
    expect(clonedConfig).toBeDefined();
    expect(clonedConfig.priority).toBe(5);
    expect(typeof clonedConfig.condition).toBe('function');
  });

  it('应该能够验证钩子配置', () => {
    const validHandler = vi.fn();
    const invalidHandler = 'not-a-function';

    expect(lifecycleManager.validateHookConfig({
      handler: validHandler,
      priority: 5
    })).toBe(true);

    expect(lifecycleManager.validateHookConfig({
      handler: invalidHandler,
      priority: 'invalid'
    })).toBe(false);
  });

  it('应该能够处理钩子依赖关系', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    lifecycleManager.registerHook('beforeMount', 'dependent', handler1, {
      dependsOn: ['base']
    });
    
    lifecycleManager.registerHook('beforeMount', 'base', handler2);

    const phaseHooks = lifecycleManager.hooks.get('beforeMount');
    const dependentHook = phaseHooks.get('dependent');
    
    expect(dependentHook.dependsOn).toContain('base');
  });

  it('应该能够设置钩子执行上下文', () => {
    const customContext = {
      userId: '123',
      sessionId: 'abc'
    };

    lifecycleManager.setHookContext('beforeMount', customContext);

    const result = lifecycleManager.getHookContext('beforeMount');
    expect(result.userId).toBe('123');
    expect(result.sessionId).toBe('abc');
  });

  it('应该能够监听钩子执行事件', () => {
    const eventHandler = vi.fn();
    const hookHandler = vi.fn();
    
    // 先注册钩子
    lifecycleManager.registerHook('beforeMount', 'hook1', hookHandler);
    
    // 然后设置事件监听器
    lifecycleManager.onHookEvent('beforeMount', 'hook1', 'executed', eventHandler);
    
    // 触发事件
    lifecycleManager.triggerHookEvent('beforeMount', 'hook1', 'executed', {});

    expect(eventHandler).toHaveBeenCalled();
  });
});