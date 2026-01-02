// 高级插槽管理器 - 提供强大的插槽功能
export class AdvancedSlotManager {
  constructor() {
    this.slots = new Map(); // 插槽定义
    this.dynamicSlots = new Map(); // 动态插槽
    this.slotProps = new Map(); // 插槽属性
    this.slotEvents = new Map(); // 插槽事件
    this.slotCache = new Map(); // 插槽缓存
    this.conditionalSlots = new Map(); // 条件插槽
    this.slotTransitions = new Map(); // 插槽过渡动画
    this.maxCacheSize = 50; // 最大缓存大小
    
    // 渲染统计
    this._renderCount = 0;
    this._cacheHits = 0;
    this._cacheMisses = 0;
    this._totalRenderTime = 0;
  }

  // 注册基础插槽
  registerSlot(name, config = {}) {
    const slotConfig = {
      name,
      props: config.props || {},
      events: config.events || {},
      conditional: config.conditional || null,
      fallback: config.fallback || null,
      cacheable: config.cacheable !== false,
      transition: config.transition || null,
      ...config
    };

    this.slots.set(name, slotConfig);
    return this;
  }

  // 注册动态插槽
  registerDynamicSlot(name, generator, options = {}) {
    const dynamicConfig = {
      name,
      generator,
      options: {
        cacheable: true,
        debounce: options.debounce || 0,
        maxAge: options.maxAge || 300000, // 5分钟
        ...options
      },
      cache: new Map(),
      lastGenerated: 0
    };

    this.dynamicSlots.set(name, dynamicConfig);
    return this;
  }

  // 创建作用域插槽
  createScopedSlot(name, props, renderFn) {
    const scopedSlot = {
      name,
      props,
      render: renderFn,
      isScoped: true,
      context: {}
    };

    this.slots.set(`scoped:${name}`, scopedSlot);
    return scopedSlot;
  }

  // 创建条件插槽
  createConditionalSlot(name, condition, trueSlot, falseSlot = null) {
    const conditionalSlot = {
      name,
      condition,
      trueSlot,
      falseSlot,
      isConditional: true
    };

    this.conditionalSlots.set(name, conditionalSlot);
    return conditionalSlot;
  }

  // 渲染插槽
  renderSlot(slotName, props = {}, context = {}) {
    const startTime = Date.now();
    this._renderCount++;
    
    const slotKey = this._generateSlotKey(slotName, props, context);
    
    // 检查缓存
    if (this.slotCache.has(slotKey)) {
      const cached = this.slotCache.get(slotKey);
      if (Date.now() - cached.timestamp < this.maxCacheSize) {
        this._cacheHits++;
        this._totalRenderTime += Date.now() - startTime;
        this.emitSlotEvent(slotName, 'stateChange', { type: 'cacheHit', slotName, props });
        return cached.content;
      }
    }
    
    this._cacheMisses++;

    let content;

    // 1. 检查条件插槽
    if (this.conditionalSlots.has(slotName)) {
      content = this._renderConditionalSlot(slotName, props, context);
    }
    // 2. 检查动态插槽
    else if (this.dynamicSlots.has(slotName)) {
      content = this._renderDynamicSlot(slotName, props, context);
    }
    // 2.5 检查带前缀的动态插槽
    else if (slotName.startsWith('dynamic:') && this.dynamicSlots.has(slotName.replace('dynamic:', ''))) {
      content = this._renderDynamicSlot(slotName, props, context);
    }
    // 3. 检查作用域插槽
    else if (this.slots.has(`scoped:${slotName}`)) {
      content = this._renderScopedSlot(slotName, props, context);
    }
    // 4. 检查普通插槽
    else if (this.slots.has(slotName)) {
      content = this._renderBasicSlot(slotName, props, context);
    }
    // 5. 使用默认内容
    else {
      content = props.defaultContent || null;
    }

    // 缓存结果
    if (content && this._shouldCache(slotName)) {
      this.slotCache.set(slotKey, {
        content,
        timestamp: Date.now()
      });
    }

    this._totalRenderTime += Date.now() - startTime;
    this.emitSlotEvent(slotName, 'stateChange', { type: 'rendered', slotName, props, content: !!content });
    return content;
  }

  // 渲染条件插槽
  _renderConditionalSlot(slotName, props, context) {
    const conditional = this.conditionalSlots.get(slotName);
    const conditionResult = this._evaluateCondition(conditional.condition, { ...props, ...context });
    
    if (conditionResult) {
      return this._renderSlotContent(conditional.trueSlot, props, context);
    } else if (conditional.falseSlot) {
      return this._renderSlotContent(conditional.falseSlot, props, context);
    }
    
    return null;
  }

  // 渲染动态插槽
  _renderDynamicSlot(slotName, props, context) {
    // 处理 'dynamic:' 前缀
    const actualSlotName = slotName.replace('dynamic:', '');
    const dynamic = this.dynamicSlots.get(actualSlotName);
    
    if (!dynamic) {
      return null;
    }
    
    const cacheKey = this._generateCacheKey(props);
    
    // 检查动态插槽缓存
    if (dynamic.options.cacheable && dynamic.cache.has(cacheKey)) {
      const cached = dynamic.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < dynamic.options.maxAge) {
        return cached.content;
      }
    }

    try {
      const content = dynamic.generator(props, context);
      
      // 缓存动态内容
      if (dynamic.options.cacheable) {
        dynamic.cache.set(cacheKey, {
          content,
          timestamp: Date.now()
        });
      }
      
      return content;
    } catch (error) {
      console.error(`动态插槽渲染失败: ${slotName}`, error);
      return props.errorContent || null;
    }
  }

  // 渲染作用域插槽
  _renderScopedSlot(slotName, props, context) {
    const scopedSlot = this.slots.get(`scoped:${slotName}`);
    
    if (!scopedSlot || typeof scopedSlot.render !== 'function') {
      return null;
    }

    try {
      // 合并属性和上下文
      const slotProps = {
        ...scopedSlot.props,
        ...props,
        ...context
      };

      return scopedSlot.render(slotProps);
    } catch (error) {
      console.error(`作用域插槽渲染失败: ${slotName}`, error);
      return props.errorContent || null;
    }
  }

  // 渲染基础插槽
  _renderBasicSlot(slotName, props, context) {
    const slot = this.slots.get(slotName);
    
    if (!slot) {
      return props.defaultContent || null;
    }

    // 检查条件
    if (slot.conditional && !this._evaluateCondition(slot.conditional, context)) {
      return slot.fallback || null;
    }

    // 优先使用render函数，其次使用content，最后使用fallback
    const content = slot.render || slot.content || slot.fallback || props.defaultContent;
    
    // 如果提供了errorContent，使用错误处理；否则让错误抛出
    if (props.errorContent !== undefined) {
      return this._renderSlotContentWithErrorHandling(content, props, context, slotName);
    } else {
      return this._renderSlotContent(content, props, context);
    }
  }

  // 渲染插槽内容
  _renderSlotContent(content, props, context) {
    if (typeof content === 'function') {
      return content(props, context);
    }
    
    if (typeof content === 'string') {
      // 简单的字符串模板处理
      return this._processTemplate(content, { ...props, ...context });
    }
    
    return content;
  }

  // 渲染插槽内容（带错误处理）
  _renderSlotContentWithErrorHandling(content, props, context, slotName) {
    try {
      return this._renderSlotContent(content, props, context);
    } catch (error) {
      console.error(`插槽渲染失败: ${slotName}`, error);
      return props.errorContent || null;
    }
  }

  // 处理模板字符串
  _processTemplate(template, data) {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this._getNestedValue(data, key.trim());
      return value !== undefined ? String(value) : '';
    });
  }

  // 获取嵌套对象值
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  // 评估条件
  _evaluateCondition(condition, context) {
    if (typeof condition === 'function') {
      return condition(context);
    }
    
    if (typeof condition === 'boolean') {
      return condition;
    }
    
    if (typeof condition === 'string') {
      // 简单表达式求值（注意：实际使用中需要更安全的实现）
      try {
        return new Function('context', `with(context) { return ${condition}; }`)(context);
      } catch (error) {
        console.warn('条件表达式求值失败:', condition, error);
        return false;
      }
    }
    
    return false;
  }

  // 生成插槽键
  _generateSlotKey(slotName, props, context = {}) {
    const propsStr = JSON.stringify(props, (key, value) => {
      if (typeof value === 'function') {
        return '[Function]';
      }
      return value;
    });
    
    const contextStr = JSON.stringify(context, (key, value) => {
      if (typeof value === 'function') {
        return '[Function]';
      }
      return value;
    });
    
    return `${slotName}:${this._hashString(propsStr + contextStr)}`;
  }

  // 生成缓存键
  _generateCacheKey(props) {
    return this._hashString(JSON.stringify(props));
  }

  // 简单的哈希函数
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  // 检查是否应该缓存
  _shouldCache(slotName) {
    const slot = this.slots.get(slotName);
    return slot?.cacheable !== false && this.slotCache.size < this.maxCacheSize;
  }

  // 添加插槽过渡动画
  addSlotTransition(slotName, transitionConfig) {
    this.slotTransitions.set(slotName, {
      enterClass: transitionConfig.enterClass || 'slot-enter',
      leaveClass: transitionConfig.leaveClass || 'slot-leave',
      duration: transitionConfig.duration || 300,
      ...transitionConfig
    });
  }

  // 监听插槽事件
  onSlotEvent(slotName, eventName, handler) {
    if (!this.slotEvents.has(slotName)) {
      this.slotEvents.set(slotName, new Map());
    }
    
    const events = this.slotEvents.get(slotName);
    if (!events.has(eventName)) {
      events.set(eventName, []);
    }
    
    events.get(eventName).push(handler);
  }

  // 触发插槽事件
  emitSlotEvent(slotName, eventName, data) {
    const events = this.slotEvents.get(slotName);
    if (events && events.has(eventName)) {
      events.get(eventName).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`插槽事件处理失败: ${slotName}.${eventName}`, error);
        }
      });
    }
  }

  // 获取插槽信息
  getSlotInfo(slotName) {
    return {
      exists: this.slots.has(slotName) || this.dynamicSlots.has(slotName) || this.conditionalSlots.has(slotName),
      isDynamic: this.dynamicSlots.has(slotName),
      isConditional: this.conditionalSlots.has(slotName),
      isScoped: this.slots.has(`scoped:${slotName}`),
      hasTransition: this.slotTransitions.has(slotName),
      eventCount: this.slotEvents.get(slotName)?.size || 0
    };
  }

  // 获取插槽配置
  getSlot(slotName) {
    if (this.slots.has(slotName)) {
      return this.slots.get(slotName);
    }
    if (this.dynamicSlots.has(slotName)) {
      return this.dynamicSlots.get(slotName);
    }
    if (this.conditionalSlots.has(slotName)) {
      return this.conditionalSlots.get(slotName);
    }
    return null;
  }

  // 触发插槽事件
  triggerSlotEvent(slotName, eventName, data) {
    return this.emitSlotEvent(slotName, eventName, data);
  }

  // 验证插槽配置
  validateSlotConfig(config) {
    if (!config || typeof config !== 'object') {
      return false;
    }
    
    // 检查必需的属性
    if (config.props && typeof config.props !== 'object') {
      return false;
    }
    
    if (config.events && typeof config.events !== 'object') {
      return false;
    }
    
    if (config.render && typeof config.render !== 'function') {
      return false;
    }
    
    if (config.fallback && typeof config.fallback !== 'string' && typeof config.fallback !== 'function') {
      return false;
    }
    
    return true;
  }

  // 设置插槽属性
  setSlotProps(slotName, props) {
    if (this.slots.has(slotName)) {
      const slot = this.slots.get(slotName);
      slot.props = { ...slot.props, ...props };
      return true;
    }
    return false;
  }

  // 获取插槽属性
  getSlotProps(slotName) {
    if (this.slots.has(slotName)) {
      return this.slots.get(slotName).props || {};
    }
    return {};
  }

  // 渲染多个插槽
  renderSlots(slotNames, props = {}, context = {}) {
    const results = {};
    for (const slotName of slotNames) {
      results[slotName] = this.renderSlot(slotName, props, context);
    }
    
    // 返回所有渲染结果的数组
    return Object.values(results);
  }

  // 监听插槽状态变化
  onSlotStateChange(slotName, handler) {
    this.onSlotEvent(slotName, 'stateChange', handler);
  }

  // 获取渲染统计
  getRenderStats() {
    return {
      totalRenders: this._renderCount || 0,
      cacheHits: this._cacheHits || 0,
      cacheMisses: this._cacheMisses || 0,
      averageRenderTime: this._totalRenderTime / (this._renderCount || 1),
      memoryUsage: this._estimateMemoryUsage()
    };
  }

  // 清除插槽缓存
  clearCache(slotName = null) {
    if (slotName) {
      const keysToDelete = [];
      for (const key of this.slotCache.keys()) {
        if (key.startsWith(slotName + ':')) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.slotCache.delete(key));
      
      // 清除动态插槽缓存
      const dynamic = this.dynamicSlots.get(slotName);
      if (dynamic) {
        dynamic.cache.clear();
      }
    } else {
      this.slotCache.clear();
      for (const dynamic of this.dynamicSlots.values()) {
        dynamic.cache.clear();
      }
    }
  }

  // 获取所有插槽名称
  getAllSlotNames() {
    const names = new Set();
    
    // 基础插槽
    for (const name of this.slots.keys()) {
      if (!name.startsWith('scoped:')) {
        names.add(name);
      }
    }
    
    // 动态插槽
    for (const name of this.dynamicSlots.keys()) {
      names.add(name);
    }
    
    // 条件插槽
    for (const name of this.conditionalSlots.keys()) {
      names.add(name);
    }
    
    return Array.from(names);
  }

  // 获取所有插槽的详细信息
  getAllSlots() {
    const result = {
      base: [],
      dynamic: [],
      conditional: [],
      scoped: []
    };

    // 基础插槽
    for (const [name, slot] of this.slots.entries()) {
      if (!name.startsWith('scoped:')) {
        result.base.push(name);
      }
    }

    // 动态插槽
    for (const [name, slot] of this.dynamicSlots.entries()) {
      result.dynamic.push(name);
    }

    // 条件插槽
    for (const [name, slot] of this.conditionalSlots.entries()) {
      result.conditional.push(name);
    }

    // 作用域插槽
    for (const [name, slot] of this.slots.entries()) {
      if (name.startsWith('scoped:')) {
        const actualName = name.replace('scoped:', '');
        result.scoped.push(actualName);
      }
    }

    return result;
  }

  // 性能统计
  getStats() {
    return {
      totalSlots: this.getAllSlotNames().length,
      dynamicSlots: this.dynamicSlots.size,
      conditionalSlots: this.conditionalSlots.size,
      scopedSlots: Array.from(this.slots.keys()).filter(k => k.startsWith('scoped:')).length,
      cacheSize: this.slotCache.size,
      cacheHitRate: this._calculateCacheHitRate(),
      memoryUsage: this._estimateMemoryUsage()
    };
  }

  // 计算缓存命中率
  _calculateCacheHitRate() {
    // 这里可以实现更复杂的统计
    return this.slotCache.size / this.maxCacheSize;
  }

  // 估算内存使用
  _estimateMemoryUsage() {
    let size = 0;
    
    // 基础数据结构的内存估算
    size += this.slots.size * 100; // 每个插槽约100字节
    size += this.dynamicSlots.size * 200; // 动态插槽约200字节
    size += this.conditionalSlots.size * 150; // 条件插槽约150字节
    size += this.slotCache.size * 500; // 缓存内容约500字节
    
    return size;
  }

  // 销毁
  destroy() {
    this.slots.clear();
    this.dynamicSlots.clear();
    this.conditionalSlots.clear();
    this.slotCache.clear();
    this.slotEvents.clear();
    this.slotTransitions.clear();
  }
}

// 全局高级插槽管理器实例
export const advancedSlotManager = new AdvancedSlotManager();

// 便捷方法
export const registerSlot = (name, config) => 
  advancedSlotManager.registerSlot(name, config);

export const registerDynamicSlot = (name, generator, options) => 
  advancedSlotManager.registerDynamicSlot(name, generator, options);

export const renderSlot = (name, props, context) => 
  advancedSlotManager.renderSlot(name, props, context);

export const createScopedSlot = (name, props, renderFn) => 
  advancedSlotManager.createScopedSlot(name, props, renderFn);

export const createConditionalSlot = (name, condition, trueSlot, falseSlot) => 
  advancedSlotManager.createConditionalSlot(name, condition, trueSlot, falseSlot);