import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdvancedSlotManager } from '../../src/libs/sfc/advanced-slot-manager.js';

describe('高级插槽管理器测试', () => {
  let slotManager;
  
  beforeEach(() => {
    slotManager = new AdvancedSlotManager();
  });
  
  afterEach(() => {
    slotManager.clearCache();
  });

  it('应该能够创建插槽管理器实例', () => {
    expect(slotManager).toBeDefined();
    expect(slotManager.slots).toBeDefined();
    expect(slotManager.dynamicSlots).toBeDefined();
    expect(slotManager.slotCache).toBeDefined();
    expect(slotManager.conditionalSlots).toBeDefined();
  });

  it('应该能够注册基础插槽', () => {
    const config = {
      props: { title: 'string', content: 'string' },
      events: { click: 'function' },
      fallback: '<div>Default Content</div>',
      cacheable: true
    };

    slotManager.registerSlot('header', config);
    
    const slot = slotManager.getSlot('header');
    expect(slot).toBeDefined();
    expect(slot.name).toBe('header');
    expect(slot.props).toEqual(config.props);
    expect(slot.events).toEqual(config.events);
    expect(slot.fallback).toBe(config.fallback);
  });

  it('应该能够渲染基础插槽', () => {
    const mockContent = '<h1>Header Content</h1>';
    slotManager.registerSlot('header', {
      fallback: mockContent
    });

    const result = slotManager.renderSlot('header', { title: 'Test' });
    expect(result).toBe(mockContent);
  });

  it('应该能够渲染带属性的插槽', () => {
    const template = (props) => `<div class="slot" data-title="${props.title}">${props.content}</div>`;
    
    slotManager.registerSlot('content', {
      props: { title: 'string', content: 'string' },
      render: template
    });

    const result = slotManager.renderSlot('content', {
      title: 'My Title',
      content: 'My Content'
    });

    expect(result).toContain('My Title');
    expect(result).toContain('My Content');
    expect(result).toContain('data-title="My Title"');
  });

  it('应该能够创建作用域插槽', () => {
    const renderFn = (props, context) => {
      return `<div>Hello ${props.name}! Age: ${props.age}</div>`;
    };

    const scopedSlot = slotManager.createScopedSlot('user-info', 
      { name: 'string', age: 'number' }, 
      renderFn
    );

    expect(scopedSlot.isScoped).toBe(true);
    expect(scopedSlot.props).toEqual({ name: 'string', age: 'number' });

    const result = slotManager.renderSlot('scoped:user-info', {
      name: 'John',
      age: 25
    });

    expect(result).toContain('Hello John!');
    expect(result).toContain('Age: 25');
  });

  it('应该能够创建条件插槽', () => {
    const condition = (props) => props.isLoggedIn;
    const trueContent = '<div>Welcome, User!</div>';
    const falseContent = '<div>Please login</div>';

    const conditionalSlot = slotManager.createConditionalSlot(
      'auth-message',
      condition,
      trueContent,
      falseContent
    );

    expect(conditionalSlot.isConditional).toBe(true);
    expect(conditionalSlot.condition).toBe(condition);

    const trueResult = slotManager.renderSlot('auth-message', { isLoggedIn: true });
    expect(trueResult).toBe(trueContent);

    const falseResult = slotManager.renderSlot('auth-message', { isLoggedIn: false });
    expect(falseResult).toBe(falseContent);
  });

  it('应该能够注册动态插槽', () => {
    const generator = (props) => {
      const timeOfDay = props.hour < 12 ? 'morning' : 'afternoon';
      return `<div>Good ${timeOfDay}, ${props.name}!</div>`;
    };

    slotManager.registerDynamicSlot('greeting', generator, {
      cacheable: true,
      maxAge: 1000
    });

    const dynamicSlot = slotManager.getSlot('dynamic:greeting');
    expect(dynamicSlot).toBeDefined();
  });

  it('应该能够渲染动态插槽', () => {
    const generator = (props) => `<div>Dynamic: ${props.data}</div>`;
    
    slotManager.registerDynamicSlot('dynamic', generator);

    const result = slotManager.renderSlot('dynamic:dynamic', { data: 'test data' });
    expect(result).toBe('<div>Dynamic: test data</div>');
  });

  it('应该能够处理动态插槽缓存', () => {
    const generator = vi.fn().mockReturnValue('<div>Cached Result</div>');
    
    slotManager.registerDynamicSlot('cached', generator, {
      cacheable: true,
      maxAge: 5000
    });

    // 第一次渲染
    slotManager.renderSlot('dynamic:cached', { test: 1 });
    expect(generator).toHaveBeenCalledTimes(1);

    // 第二次渲染，相同参数应该从缓存获取
    slotManager.renderSlot('dynamic:cached', { test: 1 });
    expect(generator).toHaveBeenCalledTimes(1); // 不应该再次调用生成器

    // 不同参数应该重新生成
    slotManager.renderSlot('dynamic:cached', { test: 2 });
    expect(generator).toHaveBeenCalledTimes(2);
  });

  it('应该能够处理插槽事件', () => {
    const clickHandler = vi.fn();
    
    slotManager.registerSlot('interactive', {
      events: { click: 'function' },
      render: (props) => `<button onclick="handleClick()">Click me</button>`
    });

    slotManager.onSlotEvent('interactive', 'click', clickHandler);

    // 模拟事件触发
    const event = { type: 'click', target: { id: 'test-btn' } };
    slotManager.triggerSlotEvent('interactive', 'click', event);

    expect(clickHandler).toHaveBeenCalledWith(event);
  });

  it('应该能够使用插槽过渡效果', () => {
    const enterTransition = (element) => {
      element.style.opacity = '0';
      element.style.transform = 'translateX(-20px)';
      return element.animate([
        { opacity: 0, transform: 'translateX(-20px)' },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 300 });
    };

    slotManager.registerSlot('animated', {
      transition: { enter: enterTransition },
      render: () => '<div class="animated">Content</div>'
    });

    const result = slotManager.renderSlot('animated');
    expect(result).toBe('<div class="animated">Content</div>');
  });

  it('应该能够处理插槽缓存', () => {
    const content = '<div>Cached Content</div>';
    
    slotManager.registerSlot('cached', {
      cacheable: true,
      render: () => content
    });

    // 第一次渲染
    const result1 = slotManager.renderSlot('cached');
    expect(result1).toBe(content);

    // 检查缓存
    expect(slotManager.slotCache.size).toBeGreaterThan(0);
  });

  it('应该能够清除插槽缓存', () => {
    slotManager.registerSlot('test1', { render: () => '<div>Test1</div>' });
    slotManager.registerSlot('test2', { render: () => '<div>Test2</div>' });

    slotManager.renderSlot('test1');
    slotManager.renderSlot('test2');

    expect(slotManager.slotCache.size).toBeGreaterThan(0);

    slotManager.clearCache();

    expect(slotManager.slotCache.size).toBe(0);
  });

  it('应该能够获取插槽信息', () => {
    slotManager.registerSlot('info-slot', {
      props: { title: 'string' },
      events: { select: 'function' }
    });

    const slotInfo = slotManager.getSlot('info-slot');
    expect(slotInfo).toBeDefined();
    expect(slotInfo.props).toEqual({ title: 'string' });
    expect(slotInfo.events).toEqual({ select: 'function' });
  });

  it('应该能够获取所有插槽列表', () => {
    slotManager.registerSlot('slot1', {});
    slotManager.registerSlot('slot2', {});
    slotManager.createScopedSlot('scoped1', {}, vi.fn());

    const slots = slotManager.getAllSlots();
    
    expect(slots).toHaveProperty('base');
    expect(slots).toHaveProperty('scoped');
    expect(slots.base).toContain('slot1');
    expect(slots.base).toContain('slot2');
    expect(slots.scoped).toContain('scoped1');
  });

  it('应该能够验证插槽配置', () => {
    const validConfig = {
      props: { name: 'string' },
      events: { click: 'function' }
    };

    const invalidConfig = {
      props: 'invalid', // 应该是对象，不是字符串
      events: { click: 'invalid' } // 应该指定类型，不是字符串
    };

    expect(slotManager.validateSlotConfig(validConfig)).toBe(true);
    expect(slotManager.validateSlotConfig(invalidConfig)).toBe(false);
  });

  it('应该能够处理插槽错误', () => {
    const errorGenerator = () => {
      throw new Error('Slot generation failed');
    };

    slotManager.registerSlot('error-slot', {
      render: errorGenerator
    });

    expect(() => {
      slotManager.renderSlot('error-slot');
    }).toThrow('Slot generation failed');
  });

  it('应该能够设置插槽属性', () => {
    slotManager.registerSlot('props-slot', {});
    
    slotManager.setSlotProps('props-slot', {
      title: 'Test Title',
      content: 'Test Content'
    });

    const props = slotManager.getSlotProps('props-slot');
    expect(props.title).toBe('Test Title');
    expect(props.content).toBe('Test Content');
  });

  it('应该能够处理插槽组合', () => {
    slotManager.registerSlot('header', {
      render: () => '<header>Header Content</header>'
    });

    slotManager.registerSlot('footer', {
      render: () => '<footer>Footer Content</footer>'
    });

    const combined = slotManager.renderSlots(['header', 'footer']);
    expect(combined).toContain('<header>Header Content</header>');
    expect(combined).toContain('<footer>Footer Content</footer>');
  });

  it('应该能够监听插槽状态变化', () => {
    const stateChangeHandler = vi.fn();
    
    slotManager.onSlotStateChange('test-slot', stateChangeHandler);
    
    slotManager.registerSlot('test-slot', {});
    slotManager.renderSlot('test-slot');
    
    // 验证状态变化监听器被调用
    expect(stateChangeHandler).toHaveBeenCalled();
  });

  it('应该能够获取插槽渲染统计', () => {
    slotManager.registerSlot('stats-slot', {
      render: () => '<div>Stats Content</div>'
    });

    slotManager.renderSlot('stats-slot');
    slotManager.renderSlot('stats-slot');
    slotManager.renderSlot('non-existent');

    const stats = slotManager.getRenderStats();
    
    expect(stats).toHaveProperty('totalRenders');
    expect(stats).toHaveProperty('cacheHits');
    expect(stats).toHaveProperty('cacheMisses');
    expect(stats.totalRenders).toBeGreaterThan(0);
  });
});