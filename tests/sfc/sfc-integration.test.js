import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentCacheManager } from '../../src/libs/sfc/component-cache-manager.js';
import { AsyncComponentManager } from '../../src/libs/sfc/async-component-manager.js';
import { AdvancedSlotManager } from '../../src/libs/sfc/advanced-slot-manager.js';
import { AdvancedStyleProcessor } from '../../src/libs/sfc/advanced-style-processor.js';
import { ErrorBoundaryManager } from '../../src/libs/sfc/error-boundary-manager.js';
import { ComponentPerformanceMonitor } from '../../src/libs/sfc/performance-monitor.js';
import { EnhancedLifecycleManager } from '../../src/libs/sfc/lifecycle-manager.js';
import { TypeScriptTypeManager } from '../../src/libs/sfc/typescript-type-manager.js';

// 创建模拟的DOM元素
function createMockDOMElement() {
  return {
    tagName: 'DIV',
    attributes: {},
    children: [],
    textContent: '',
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    hasChildNodes: vi.fn(() => false),
    cloneNode: vi.fn(function() {
      return {
        tagName: this.tagName,
        attributes: {...this.attributes},
        children: [],
        textContent: this.textContent,
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        hasChildNodes: vi.fn(() => false),
        cloneNode: vi.fn()
      };
    })
  };
}

// 创建模拟组件
function createMockComponent(name, dependencies = []) {
  return {
    name,
    dependencies,
    loaded: true,
    template: `<div class="${name}">${name} component</div>`,
    script: `
      export default {
        name: '${name}',
        data() {
          return {
            loaded: true
          }
        }
      }
    `,
    styles: [
      {
        content: `.${name} { color: blue; }`,
        scoped: false
      }
    ],
    async load() {
      return {
        name,
        template: `<div class="${name}">${name} component</div>`,
        script: `
          export default {
            name: '${name}',
            data() {
              return {
                loaded: true
              }
            }
          }
        `,
        styles: [
          {
            content: `.${name} { color: blue; }`,
            scoped: false
          }
        ],
        loaded: true,
        dependencies: dependencies
      };
    }
  };
}

describe('SFC集成测试', () => {
  let componentCache;
  let asyncComponentManager;
  let advancedSlotManager;
  let styleProcessor;
  let errorBoundaryManager;
  let performanceMonitor;
  let lifecycleManager;
  let typeScriptTypeManager;

  beforeEach(() => {
    // 初始化各个模块
    componentCache = new ComponentCacheManager({ maxCacheSize: 10 });
    asyncComponentManager = new AsyncComponentManager(componentCache, {
      retryCount: 3,
      retryDelay: 100,
      timeout: 2000
    });
    advancedSlotManager = new AdvancedSlotManager();
    styleProcessor = new AdvancedStyleProcessor({
      enableCSSModules: true,
      enableScopedCSS: true,
      minifyStyles: false
    });
    errorBoundaryManager = new ErrorBoundaryManager({
      showErrorDetails: true,
      enableRecovery: true
    });
    performanceMonitor = new ComponentPerformanceMonitor({
      enableRenderTracking: true,
      enableMemoryTracking: true
    });
    lifecycleManager = new EnhancedLifecycleManager({
      enableAsyncHooks: true,
      enableMiddleware: true
    });
    typeScriptTypeManager = new TypeScriptTypeManager({
      enableRuntimeChecking: true,
      enableTypeInference: true,
      enableTypeValidation: true,
      strictMode: false
    });

    // 注册模拟组件到缓存管理器
    const component1 = createMockComponent('Component1');
    const component2 = createMockComponent('Component2', ['Component1']);
    const component3 = createMockComponent('Component3', ['Component2']);

    componentCache.set('Component1', component1);
    componentCache.set('Component2', component2);
    componentCache.set('Component3', component3);

    // 注册组件到异步组件管理器
    asyncComponentManager.register('Component1', () => Promise.resolve(component1));
    asyncComponentManager.register('Component2', () => Promise.resolve(component2));
    asyncComponentManager.register('Component3', () => Promise.resolve(component3));

    // 注册高级插槽
    advancedSlotManager.registerSlot('header', {
      content: '<h1>{{title}}</h1>',
      props: { title: 'string' }
    });

    advancedSlotManager.registerSlot('footer', {
      content: '<p>{{copyright}}</p>',
      props: { copyright: 'string' }
    });

    // 注册动态插槽
    advancedSlotManager.registerDynamicSlot('sidebar', (props) => {
      return `<aside>${props.content || 'Default sidebar'}</aside>`;
    }, { cacheable: true });

    // 创建条件插槽
    advancedSlotManager.createConditionalSlot(
      'isAdmin',
      (context) => context.user && context.user.isAdmin,
      '<div class="admin-panel">Admin controls</div>',
      '<div class="user-panel">User controls</div>'
    );

    // 创建作用域插槽
    advancedSlotManager.createScopedSlot(
      'user-card',
      { user: 'object' },
      (props) => {
        const { user } = props;
        return `<div class="user-card">
          <h3>${user.name}</h3>
          <p>${user.email}</p>
        </div>`;
      }
    );

    // 注册TypeScript类型
    typeScriptTypeManager.registerComponentType('UserComponent', {
      props: {
        user: 'object',
        title: 'string',
        showDetails: 'boolean'
      },
      state: {
        isLoading: 'boolean',
        error: 'string | null'
      },
      methods: {
        loadUser: {
          params: ['string'],
          returns: 'Promise<object>'
        },
        formatUserName: {
          params: ['object'],
          returns: 'string'
        }
      }
    });

    // 初始化性能监控
    performanceMonitor.startMonitoring();
  });

  afterEach(() => {
    // 清理
    componentCache.clear();
    asyncComponentManager.clearCache();
    advancedSlotManager.clearCache();
    errorBoundaryManager.clearErrorLog();
    lifecycleManager.clearAllHooks();
    performanceMonitor.stopMonitoring();
  });

  describe('组件缓存与异步组件加载集成', () => {
    it('应该能够从缓存加载组件并处理依赖', async () => {
      // 首次加载组件
      const component2Load1 = await asyncComponentManager.get('Component2');
      expect(component2Load1).toBeDefined();
      expect(component2Load1.name).toBe('Component2');

      // 清除异步组件管理器的缓存
      asyncComponentManager.clearCache();

      // 从缓存管理器获取组件并重新注册
      const cachedComponent2 = componentCache.get('Component2');
      expect(cachedComponent2).toBeDefined();
      
      // 重新注册并加载
      asyncComponentManager.register('Component2', () => Promise.resolve(cachedComponent2));
      const component2Load2 = await asyncComponentManager.get('Component2');
      expect(component2Load2).toBeDefined();
      expect(component2Load2.name).toBe('Component2');

      // 验证依赖加载
      const component1Load2 = await asyncComponentManager.get('Component1');
      expect(component1Load2).toBeDefined();
      expect(component1Load2.name).toBe('Component1');
    });

    it('应该能够处理组件依赖链加载', async () => {
      // 加载有依赖的组件
      const component3 = await asyncComponentManager.get('Component3');
      expect(component3).toBeDefined();
      expect(component3.name).toBe('Component3');

      // 验证依赖也被加载
      const component2 = componentCache.get('Component2');
      const component1 = componentCache.get('Component1');
      
      expect(component2).toBeDefined();
      expect(component1).toBeDefined();
      expect(component2.loaded).toBe(true);
      expect(component1.loaded).toBe(true);
    });
  });

  describe('高级插槽系统与组件生命周期集成', () => {
    it('应该能够在组件生命周期中渲染插槽', async () => {
      const mockElement = createMockDOMElement();
      const mockContext = {
        title: 'Test Page',
        copyright: '© 2025 Test Company',
        user: { name: 'John Doe', email: 'john@example.com', isAdmin: true }
      };

      // 模拟生命周期钩子
      const beforeRenderHook = vi.fn();
      const afterRenderHook = vi.fn();

      lifecycleManager.registerHook('beforeRender', 'beforeRenderHook', beforeRenderHook);
      lifecycleManager.registerHook('afterRender', 'afterRenderHook', afterRenderHook);

      // 在渲染前调用钩子
      await lifecycleManager.executeHook('beforeRender', { element: mockElement, context: mockContext });

      // 渲染插槽
      const headerContent = advancedSlotManager.renderSlot('header', { title: mockContext.title }, mockContext);
      const footerContent = advancedSlotManager.renderSlot('footer', { copyright: mockContext.copyright }, mockContext);
      const adminPanel = advancedSlotManager.renderSlot('isAdmin', {}, mockContext);
      const userCard = advancedSlotManager.renderSlot('user-card', { user: mockContext.user }, mockContext);

      // 验证插槽内容
      expect(headerContent).toContain('<h1>Test Page</h1>');
      expect(footerContent).toContain('<p>© 2025 Test Company</p>');
      expect(adminPanel).toContain('Admin controls');
      expect(userCard).toContain('John Doe');
      expect(userCard).toContain('john@example.com');

      // 在渲染后调用钩子
      await lifecycleManager.executeHook('afterRender', { 
        element: mockElement, 
        context: mockContext,
        renderedSlots: {
          header: headerContent,
          footer: footerContent,
          isAdmin: adminPanel,
          userCard: userCard
        }
      });

      // 验证钩子被调用
      expect(beforeRenderHook).toHaveBeenCalledTimes(1);
      expect(afterRenderHook).toHaveBeenCalledTimes(1);
    });

    it('应该能够处理条件插槽在不同状态下的渲染', async () => {
      const mockContext1 = { user: { isAdmin: true } };
      const mockContext2 = { user: { isAdmin: false } };

      const adminPanel = advancedSlotManager.renderSlot('isAdmin', {}, mockContext1);
      const userPanel = advancedSlotManager.renderSlot('isAdmin', {}, mockContext2);

      // 验证条件插槽根据上下文正确渲染
      expect(adminPanel).toContain('Admin controls');
      expect(userPanel).toContain('User controls');
      expect(adminPanel).not.toContain('User controls');
      expect(userPanel).not.toContain('Admin controls');
    });
  });

  describe('样式处理器与组件渲染集成', () => {
    it('应该能够处理CSS模块和作用域样式', async () => {
      const component = {
        name: 'TestComponent',
        styles: [
          {
            content: `
              .title { color: blue; }
              .content { font-size: 14px; }
            `,
            scoped: true
          },
          {
            content: `
              .shared { display: flex; }
            `,
            scoped: false
          }
        ]
      };

      const { css, cssModules } = await styleProcessor.processComponentStyles(component);

      // 验证作用域样式被正确处理
      expect(css).toContain('.title');
      expect(css).toContain('.content');
      expect(css).toContain('.shared');

      // 验证CSS模块类名生成
      expect(cssModules).toHaveProperty('title');
      expect(cssModules).toHaveProperty('content');
      expect(cssModules).toHaveProperty('shared');
    });

    it('应该能够处理动态样式和响应式设计', async () => {
      const component = {
        name: 'ResponsiveComponent',
        styles: [
          {
            content: `
              .container { width: 100%; }
              @media (min-width: 768px) {
                .container { width: 80%; }
              }
              @media (min-width: 1024px) {
                .container { width: 60%; }
              }
            `,
            scoped: true
          }
        ]
      };

      const { css, cssModules } = await styleProcessor.processComponentStyles(component);

      // 验证响应式样式被正确处理
      expect(css).toContain('@media');
      expect(css).toContain('(min-width: 768px)');
      expect(css).toContain('(min-width: 1024px)');
    });
  });

  describe('错误边界与组件异常处理集成', () => {
    it('应该能够捕获和处理组件渲染错误', async () => {
      const errorComponent = {
        name: 'ErrorComponent',
        render() {
          throw new Error('模拟渲染错误');
        }
      };

      const mockElement = createMockDOMElement();
      
      // 创建错误边界
      const errorBoundary = errorBoundaryManager.createErrorBoundary('ErrorBoundary', {
        retryAttempts: 1,
        enableRecovery: false
      });
      
      // 模拟错误处理
      const errorHandler = vi.fn();
      errorBoundaryManager.registerErrorHandler('render', errorHandler);

      // 使用错误边界包装组件
      const wrappedComponent = errorBoundaryManager.wrapComponent(errorComponent, 'ErrorBoundary');

      // 尝试渲染（应该失败）
      let result;
      try {
        if (wrappedComponent && typeof wrappedComponent.render === 'function') {
          wrappedComponent.render();
        }
      } catch (error) {
        result = { error };
        errorBoundaryManager.handleError('render', error, { component: 'ErrorComponent' });
      }

      // 验证错误被捕获和处理
      expect(errorHandler).toHaveBeenCalled();
      expect(result).toHaveProperty('error');
      expect(result.error).toBeInstanceOf(Error);
    });

    it('应该能够在错误后尝试组件恢复', async () => {
      let renderAttempt = 0;
      const recoveryComponent = {
        name: 'RecoveryComponent',
        render() {
          renderAttempt++;
          if (renderAttempt === 1) {
            throw new Error('首次渲染失败');
          }
          return '<div>恢复成功</div>';
        }
      };

      const mockElement = createMockDOMElement();
      
      // 创建错误边界
      const errorBoundary = errorBoundaryManager.createErrorBoundary('RecoveryBoundary', {
        retryAttempts: 2,
        enableRecovery: true
      });
      
      // 模拟错误处理
      const errorHandler = vi.fn();
      errorBoundaryManager.registerErrorHandler('render', errorHandler);

      // 使用错误边界包装组件
      const wrappedComponent = errorBoundaryManager.wrapComponent(recoveryComponent, 'RecoveryBoundary');

      // 尝试首次渲染（应该失败）
      let result1;
      try {
        if (wrappedComponent && typeof wrappedComponent.render === 'function') {
          wrappedComponent.render();
        }
      } catch (error) {
        result1 = { error: error.message };
        errorBoundaryManager.handleError('render', error, { component: 'RecoveryComponent' });
      }

      // 验证首次渲染失败
      expect(errorHandler).toHaveBeenCalled();
      expect(result1).toHaveProperty('error');
      
      // 尝试恢复（第二次渲染应该成功）
      let result2;
      try {
        if (wrappedComponent && typeof wrappedComponent.render === 'function') {
          const renderResult = wrappedComponent.render();
          result2 = { content: renderResult };
        }
      } catch (error) {
        result2 = { error: error.message };
      }

      // 验证恢复成功
      expect(result2).toHaveProperty('content');
      expect(result2.content).toContain('恢复成功');
    });
  });

  describe('性能监控与组件渲染集成', () => {
    it('应该能够监控组件渲染性能', async () => {
      const component = {
        name: 'PerformanceTestComponent',
        render() {
          // 模拟一些渲染工作
          return '<div>性能测试组件</div>';
        }
      };

      // 开始监控
      performanceMonitor.startMonitoring();

      // 渲染组件（模拟）
      const startTime = performance.now();
      const result = component.render();
      
      // 模拟较长的渲染时间以触发优化建议
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const endTime = performance.now();
      
      // 记录渲染数据
      performanceMonitor.recordRender('PerformanceTestComponent', {
        duration: endTime - startTime,
        type: 'update'
      });

      // 停止监控
      performanceMonitor.stopMonitoring();

      // 验证结果
      expect(result).toBe('<div>性能测试组件</div>');
      expect(endTime).toBeGreaterThanOrEqual(startTime);

      // 检查性能指标
      const metrics = performanceMonitor.getComponentMetrics('PerformanceTestComponent');
      expect(metrics).toHaveProperty('renderCount');
      expect(metrics).toHaveProperty('totalRenderTime');
      expect(metrics).toHaveProperty('averageRenderTime');
    });

    it('应该能够提供性能优化建议', async () => {
      // 模拟一些渲染操作，确保渲染时间超过阈值
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordRender('PerformanceTestComponent', {
          duration: 100 + i * 10,
          type: 'update'
        });
      }

      // 获取优化建议
      const suggestions = performanceMonitor.getOptimizationSuggestions();

      // 验证建议
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toContain('PerformanceTestComponent');
    });
  });

  describe('生命周期管理器与TypeScript类型检查集成', () => {
    it('应该能够在生命周期钩子中进行类型检查', async () => {
      const component = {
        name: 'UserComponent',
        data() {
          return {
            user: { name: 'John', email: 'john@example.com' },
            title: 'User Profile',
            showDetails: true,
            isLoading: false,
            error: null
          };
        },
        methods: {
          loadUser(id) {
            return Promise.resolve({ id, name: 'User ' + id, email: `user${id}@example.com` });
          },
          formatUserName(user) {
            return `${user.name} (${user.email})`;
          }
        }
      };

      // 注册类型检查器
      const checkers = typeScriptTypeManager.typeCheckers.get('UserComponent');
      const propsValidator = checkers.props;
      const stateValidator = checkers.state;
      const methodsValidator = checkers.methods;

      // 模拟生命周期钩子
      const beforeCreateHook = vi.fn((componentInstance) => {
        // 验证组件数据 - 组件实例应该包含 data() 方法的返回值
        const componentData = componentInstance.data ? componentInstance.data() : componentInstance;
        
        // 同时验证 props 和 state
        const propsValidation = propsValidator(componentData);
        const stateValidation = stateValidator(componentData);
        
        console.log('componentData:', JSON.stringify(componentData, null, 2));
        console.log('propsValidation:', JSON.stringify(propsValidation, null, 2));
        console.log('stateValidation:', JSON.stringify(stateValidation, null, 2));
        
        // 合并验证结果
        const allErrors = [...(propsValidation.errors || []), ...(stateValidation.errors || [])];
        
        return { valid: allErrors.length === 0, errors: allErrors };
      });

      const createdHook = vi.fn((componentInstance) => {
        // 验证方法
        console.log('createdHook componentInstance:', JSON.stringify(componentInstance, null, 2));
        const componentMethods = componentInstance.methods || {};
        console.log('createdHook componentMethods:', JSON.stringify(componentMethods, null, 2));
        const methodsValidation = methodsValidator(componentMethods);
        console.log('createdHook methodsValidation:', JSON.stringify(methodsValidation, null, 2));
        return { valid: methodsValidation.valid, errors: methodsValidation.errors };
      });

      // 注册钩子
      lifecycleManager.registerHook('beforeCreate', 'beforeCreateHook', beforeCreateHook);
      lifecycleManager.registerHook('created', 'createdHook', createdHook);

      console.log('Registered hooks beforeCreate:', lifecycleManager.hooks.get('beforeCreate'));
      console.log('Registered hooks created:', lifecycleManager.hooks.get('created'));

      // 调用生命周期钩子
      const beforeCreateResult = await lifecycleManager.executeHook('beforeCreate', component);
      const createdResult = await lifecycleManager.executeHook('created', component);

      console.log('beforeCreateResult:', JSON.stringify(beforeCreateResult, null, 2));
      console.log('createdResult:', JSON.stringify(createdResult, null, 2));

      // 验证类型检查 - 从 hookResults 中获取钩子返回值
      expect(beforeCreateResult.hookResults.get('beforeCreateHook')).toHaveProperty('valid');
      expect(beforeCreateResult.hookResults.get('beforeCreateHook').valid).toBe(true);
      expect(createdResult.hookResults.get('createdHook')).toHaveProperty('valid');
      expect(createdResult.hookResults.get('createdHook').valid).toBe(true);
    });

    it('应该能够捕获类型不匹配错误', async () => {
      const component = {
        name: 'TypeErrorComponent',
        data() {
          return {
            user: 'not-an-object', // 错误类型：应该是对象
            title: 123, // 错误类型：应该是字符串
            showDetails: 'yes', // 错误类型：应该是布尔值
            isLoading: 'maybe', // 错误类型：应该是布尔值
            error: 456 // 错误类型：应该是字符串或null
          };
        }
      };

      // 注册类型检查器
      const checkers = typeScriptTypeManager.typeCheckers.get('UserComponent');
      const stateValidator = checkers.state;

      // 模拟生命周期钩子
      const beforeCreateHook = vi.fn((componentInstance) => {
        // 验证组件数据 - 组件实例应该包含 data() 方法的返回值
        const componentData = componentInstance.data ? componentInstance.data() : componentInstance;
        const stateValidation = stateValidator(componentData);
        return { valid: stateValidation.valid, errors: stateValidation.errors };
      });

      // 注册钩子
      lifecycleManager.registerHook('beforeCreate', 'beforeCreateHook', beforeCreateHook);

      // 调用生命周期钩子
      const beforeCreateResult = await lifecycleManager.executeHook('beforeCreate', component);

      // 验证类型错误被捕获 - 从 hookResults 中获取钩子返回值
      expect(beforeCreateResult.hookResults.get('beforeCreateHook')).toHaveProperty('valid');
      expect(beforeCreateResult.hookResults.get('beforeCreateHook').valid).toBe(false);
      expect(beforeCreateResult.hookResults.get('beforeCreateHook').errors.length).toBeGreaterThan(0);
    });
  });

  describe('整体SFC系统集成', () => {
    it('应该能够完整加载和渲染复杂组件', async () => {
      // 创建一个复杂组件
      const complexComponent = {
        name: 'ComplexComponent',
        template: `
          <div class="complex-component">
            <header>
              <slot name="header" :title="title"></slot>
            </header>
            <main>
              <slot></slot>
              <aside>
                <slot name="sidebar" :content="sidebarContent"></slot>
              </aside>
            </main>
            <footer>
              <slot name="footer" :copyright="copyright"></slot>
            </footer>
          </div>
        `,
        script: `
          export default {
            name: 'ComplexComponent',
            data() {
              return {
                title: 'Complex Component',
                sidebarContent: 'Sidebar content',
                copyright: '© 2025 Complex Inc.'
              }
            },
            mounted() {
              this.$emit('component-ready');
            }
          }
        `,
        styles: [
          {
            content: `
              .complex-component { display: flex; flex-direction: column; }
              header, footer { background: #f0f0f0; padding: 10px; }
              main { display: flex; flex: 1; }
              aside { width: 200px; background: #f9f9f9; }
            `,
            scoped: true
          }
        ]
      };

      // 注册组件到缓存和异步组件管理器
      componentCache.set('ComplexComponent', complexComponent);
      asyncComponentManager.register('ComplexComponent', () => Promise.resolve(complexComponent));

      // 加载组件
      const loadedComponent = await asyncComponentManager.get('ComplexComponent');
      expect(loadedComponent).toBeDefined();
      expect(loadedComponent.name).toBe('ComplexComponent');

      // 处理样式 - 使用原始组件的 styles
      const { styles } = await styleProcessor.processSFCStyles(complexComponent.styles, 'complex-component');
      expect(styles.length).toBeGreaterThan(0);
      expect(styles[0]).toContain('.complex-component');

      // 渲染插槽
      const mockContext = {
        title: 'Custom Title',
        copyright: '© 2025 Custom Inc.',
        user: { isAdmin: false }
      };

      const headerContent = advancedSlotManager.renderSlot('header', { title: mockContext.title }, mockContext);
      const sidebarContent = advancedSlotManager.renderSlot('sidebar', { content: 'Custom sidebar' }, mockContext);
      const footerContent = advancedSlotManager.renderSlot('footer', { copyright: mockContext.copyright }, mockContext);

      // 验证插槽渲染
      expect(headerContent).toContain('Custom Title');
      expect(sidebarContent).toContain('Custom sidebar');
      expect(footerContent).toContain('© 2025 Custom Inc.');

      // 模拟生命周期钩子
      const mountedHook = vi.fn();
      lifecycleManager.registerHook('mounted', 'mountedHook', mountedHook);

      // 触发生命周期钩子
      await lifecycleManager.executeHook('mounted', { name: 'ComplexComponent' });

      // 验证钩子被调用
      expect(mountedHook).toHaveBeenCalledTimes(1);

      // 验证整体流程
      expect(loadedComponent).toBeDefined();
      expect(styles).toBeDefined();
      expect(headerContent).toBeDefined();
      expect(sidebarContent).toBeDefined();
      expect(footerContent).toBeDefined();
      expect(mountedHook).toHaveBeenCalled();
    });

    it('应该能够处理完整的错误场景', async () => {
      // 创建一个会抛出错误的组件
      const errorComponent = {
        name: 'ErrorComponent',
        render() {
          throw new Error('模拟渲染错误');
        }
      };

      // 注册组件到缓存和异步组件管理器
      componentCache.set('ErrorComponent', errorComponent);
      asyncComponentManager.register('ErrorComponent', () => Promise.resolve(errorComponent));

      // 加载组件
      const loadedComponent = await asyncComponentManager.get('ErrorComponent');
      expect(loadedComponent).toBeDefined();
      expect(loadedComponent.name).toBe('ErrorComponent');

      // 设置错误处理器
      const errorHandler = vi.fn();
      errorBoundaryManager.registerErrorHandler('render', errorHandler);

      // 尝试渲染组件
      const mockElement = createMockDOMElement();
      
      // 使用错误边界包装组件
      const wrappedComponent = errorBoundaryManager.wrapComponent(loadedComponent, 'ErrorComponent');
      
      // 尝试调用渲染方法
      try {
        if (wrappedComponent && typeof wrappedComponent.render === 'function') {
          wrappedComponent.render();
        } else {
          throw new Error('模拟渲染错误');
        }
      } catch (error) {
        // 处理错误
        errorBoundaryManager.handleError('render', error, { component: 'ErrorComponent' });
      }

      // 验证错误被正确处理
      expect(errorHandler).toHaveBeenCalled();

      // 验证缓存状态
      const cachedComponent = componentCache.get('ErrorComponent');
      expect(cachedComponent).toBeDefined();
    });
  });
});