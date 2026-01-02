// 组件性能监控和优化器
export class ComponentPerformanceMonitor {
  constructor(options = {}) {
    this.metrics = new Map(); // 性能指标
    this.renderHistory = new Map(); // 渲染历史
    this.memorySnapshots = []; // 内存快照
    this.optimizationSuggestions = new Map(); // 优化建议
    this.observers = new Map(); // 观察者
    this.options = {
      enableMemoryTracking: options.enableMemoryTracking !== false,
      enableRenderTracking: options.enableRenderTracking !== false,
      enablePerformanceAPI: options.enablePerformanceAPI !== false,
      maxHistorySize: options.maxHistorySize || 100,
      monitoringInterval: options.monitoringInterval || 1000,
      memoryThreshold: options.memoryThreshold || 50 * 1024 * 1024, // 50MB
      ...options
    };
    this.startTime = Date.now();
    this.monitoringInterval = null;
  }

  // 开始监控
  startMonitoring() {
    if (this.monitoringInterval) {
      return; // 已经在监控
    }

    // 启动定期检查
    this.monitoringInterval = setInterval(() => {
      this._performHealthCheck();
    }, this.options.monitoringInterval);

    // 启动性能观察
    if (this.options.enablePerformanceAPI) {
      this._setupPerformanceObservers();
    }

    // 启动内存监控
    if (this.options.enableMemoryTracking) {
      this._startMemoryMonitoring();
    }
  }

  // 停止监控
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // 清理观察者
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  // 记录组件渲染
  recordRender(componentName, renderData = {}) {
    if (!this.options.enableRenderTracking) {
      return;
    }

    const timestamp = performance.now();
    const renderMetric = {
      componentName,
      timestamp,
      duration: renderData.duration || 0,
      renderType: renderData.type || 'update',
      props: renderData.props || {},
      state: renderData.state || {},
      memoryUsage: this._getMemoryUsage(),
      ...renderData
    };

    // 更新渲染历史
    if (!this.renderHistory.has(componentName)) {
      this.renderHistory.set(componentName, []);
    }

    const history = this.renderHistory.get(componentName);
    history.push(renderMetric);

    // 限制历史大小
    if (history.length > this.options.maxHistorySize) {
      history.shift();
    }

    // 更新指标
    this._updateMetrics(componentName, renderMetric);

    // 检查是否需要优化
    this._checkOptimizationNeeds(componentName, renderMetric);
  }

  // 记录组件挂载
  recordMount(componentName, mountData = {}) {
    const metric = {
      componentName,
      type: 'mount',
      timestamp: performance.now(),
      duration: mountData.duration || 0,
      memoryUsage: this._getMemoryUsage(),
      ...mountData
    };

    this._addMetric(componentName, metric);
  }

  // 记录组件卸载
  recordUnmount(componentName, unmountData = {}) {
    const metric = {
      componentName,
      type: 'unmount',
      timestamp: performance.now(),
      duration: unmountData.duration || 0,
      memoryUsage: this._getMemoryUsage(),
      ...unmountData
    };

    this._addMetric(componentName, metric);

    // 清理历史数据
    this.renderHistory.delete(componentName);
  }

  // 记录内存使用情况
  recordMemoryUsage(componentName, memoryData = {}) {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, {
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        minRenderTime: Infinity,
        maxRenderTime: 0,
        lastRenderTime: 0,
        mountCount: 0,
        totalMountTime: 0,
        unmountCount: 0,
        totalUnmountTime: 0,
        peakMemory: 0,
        memoryUsage: [],
        performance: {
          slowRenderCount: 0,
          memoryLeakRisk: false,
          optimizationScore: 100
        }
      });
    }

    const metrics = this.metrics.get(componentName);
    const usedMemory = memoryData.used || 0;
    
    // 更新峰值内存
    if (usedMemory > metrics.peakMemory) {
      metrics.peakMemory = usedMemory;
    }
    
    // 添加到内存使用历史
    metrics.memoryUsage.push(usedMemory);
    
    // 限制内存使用历史
    if (metrics.memoryUsage.length > 20) {
      metrics.memoryUsage.shift();
    }

    // 检查内存泄漏风险
    const memoryTrend = this._analyzeMemoryTrend(metrics.memoryUsage);
    metrics.performance.memoryLeakRisk = memoryTrend.isIncreasing;

    // 如果内存持续增长，添加优化建议
    if (memoryTrend.isIncreasing && metrics.memoryUsage.length >= 5) {
      const suggestions = this.optimizationSuggestions.get(componentName) || [];
      if (!suggestions.some(s => s.includes('内存泄漏'))) {
        suggestions.push(`内存泄漏: 组件 "${componentName}" 可能存在内存泄漏`);
        this.optimizationSuggestions.set(componentName, suggestions);
      }
    }
  }

  // 记录自定义事件
  recordCustomEvent(componentName, eventData = {}) {
    const eventMetric = {
      componentName,
      eventType: eventData.type || 'custom',
      timestamp: performance.now(),
      duration: eventData.duration || 0,
      metadata: eventData.metadata || {},
      memoryUsage: this._getMemoryUsage(),
      ...eventData
    };

    // 更新渲染历史
    if (!this.renderHistory.has(componentName)) {
      this.renderHistory.set(componentName, []);
    }

    const history = this.renderHistory.get(componentName);
    history.push(eventMetric);

    // 限制历史大小
    if (history.length > this.options.maxHistorySize) {
      history.shift();
    }
  }

  // 获取系统性能指标
  getSystemMetrics() {
    const metrics = {
      memory: null,
      timing: null,
      navigation: null
    };

    if (typeof performance !== 'undefined') {
      if (performance.memory) {
        metrics.memory = {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }

      if (performance.timing) {
        metrics.timing = {
          domComplete: performance.timing.domComplete,
          domInteractive: performance.timing.domInteractive,
          loadEventEnd: performance.timing.loadEventEnd,
          navigationStart: performance.timing.navigationStart
        };
      }

      if (performance.navigation) {
        metrics.navigation = {
          type: performance.navigation.type,
          redirectCount: performance.navigation.redirectCount
        };
      }
    }

    return metrics;
  }

  // 更新指标
  _updateMetrics(componentName, renderMetric) {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, {
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        minRenderTime: Infinity,
        maxRenderTime: 0,
        lastRenderTime: 0,
        mountCount: 0,
        totalMountTime: 0,
        unmountCount: 0,
        totalUnmountTime: 0,
        peakMemory: 0,
        memoryUsage: [],
        performance: {
          slowRenderCount: 0,
          memoryLeakRisk: false,
          optimizationScore: 100
        }
      });
    }

    const metric = this.metrics.get(componentName);
    metric.renderCount++;
    metric.totalRenderTime += renderMetric.duration;
    metric.averageRenderTime = metric.totalRenderTime / metric.renderCount;
    metric.lastRenderTime = renderMetric.duration;
    metric.minRenderTime = Math.min(metric.minRenderTime, renderMetric.duration);
    metric.maxRenderTime = Math.max(metric.maxRenderTime, renderMetric.duration);
    metric.memoryUsage.push(renderMetric.memoryUsage);

    // 限制内存使用历史
    if (metric.memoryUsage.length > 20) {
      metric.memoryUsage.shift();
    }

    // 更新性能指标
    if (renderMetric.duration > 16) { // 超过60fps的时间
      metric.performance.slowRenderCount++;
    }

    // 检查内存泄漏风险
    const memoryTrend = this._analyzeMemoryTrend(metric.memoryUsage);
    metric.performance.memoryLeakRisk = memoryTrend.isIncreasing;

    // 计算优化分数
    metric.performance.optimizationScore = this._calculateOptimizationScore(metric);
  }

  // 分析内存趋势
  _analyzeMemoryTrend(memoryUsage) {
    if (memoryUsage.length < 3) {
      return { isIncreasing: false, trend: 'unknown' };
    }

    const recent = memoryUsage.slice(-3);
    const trend = recent[2] - recent[0];

    return {
      isIncreasing: trend > 0,
      trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      change: trend
    };
  }

  // 计算优化分数
  _calculateOptimizationScore(metric) {
    let score = 100;

    // 渲染时间影响
    if (metric.averageRenderTime > 16) {
      score -= Math.min(30, (metric.averageRenderTime - 16) * 2);
    }

    // 慢渲染次数影响
    if (metric.performance.slowRenderCount > 5) {
      score -= Math.min(25, metric.performance.slowRenderCount * 2);
    }

    // 内存泄漏风险影响
    if (metric.performance.memoryLeakRisk) {
      score -= 20;
    }

    return Math.max(0, Math.round(score));
  }

  // 检查优化需求
  _checkOptimizationNeeds(componentName, renderMetric) {
    const suggestions = this.optimizationSuggestions.get(componentName) || [];

    // 检查慢渲染阈值
    const slowRenderThreshold = this.options.slowRenderThreshold || 16;
    if (renderMetric.duration > slowRenderThreshold) {
      if (this.options.slowRenderThreshold) {
        suggestions.push(`超过性能阈值: 组件 "${componentName}" 渲染时间超过阈值 (${renderMetric.duration.toFixed(2)}ms > ${slowRenderThreshold}ms)`);
      } else {
        suggestions.push(`慢渲染: 组件 "${componentName}" 渲染时间过长 (${renderMetric.duration.toFixed(2)}ms)`);
      }
    }

    // 内存使用过高
    if (renderMetric.memoryUsage > this.options.memoryThreshold) {
      suggestions.push(`内存使用过高: 组件 "${componentName}" 内存使用过高 (${(renderMetric.memoryUsage / 1024 / 1024).toFixed(2)}MB)`);
    }

    // 频繁重渲染
    const recentRenders = this.renderHistory.get(componentName);
    if (recentRenders && recentRenders.length > 10) {
      suggestions.push(`频繁重渲染: 组件 "${componentName}" 频繁重渲染 (${recentRenders.length} 次)`);
    }

    if (suggestions.length > 0) {
      this.optimizationSuggestions.set(componentName, suggestions);
    }
  }

  // 性能健康检查
  _performHealthCheck() {
    const overallMetrics = this._getOverallMetrics();
    
    // 检查整体性能
    if (overallMetrics.averageRenderTime > 16) {
      console.warn('整体渲染性能下降:', overallMetrics);
    }

    // 检查内存使用
    if (overallMetrics.memoryUsage > this.options.memoryThreshold) {
      console.warn('内存使用过高:', overallMetrics);
    }

    // 生成性能报告
    if (Math.random() < 0.1) { // 10%概率生成报告
      this._generatePerformanceReport();
    }
  }

  // 设置性能观察者
  _setupPerformanceObservers() {
    if (!window.PerformanceObserver) {
      return;
    }

    // 观察布局和绘制性能
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this._handlePerformanceEntry(entry);
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      this.observers.set('performance', observer);
    } catch (error) {
      console.warn('性能观察器设置失败:', error);
    }
  }

  // 处理性能条目
  _handlePerformanceEntry(entry) {
    if (entry.entryType === 'measure') {
      this._recordPerformanceMeasure(entry);
    }
  }

  // 记录性能测量
  _recordPerformanceMeasure(entry) {
    const metric = {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      timestamp: performance.now()
    };

    // 更新相关指标
    // 这里可以根据测量名称进行特定处理
  }

  // 开始内存监控
  _startMemoryMonitoring() {
    if (!performance.memory) {
      console.warn('Performance Memory API 不可用');
      return;
    }

    const takeSnapshot = () => {
      const memory = performance.memory;
      const snapshot = {
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };

      this.memorySnapshots.push(snapshot);

      // 限制快照数量
      if (this.memorySnapshots.length > 50) {
        this.memorySnapshots.shift();
      }
    };

    takeSnapshot();
    setInterval(takeSnapshot, 5000); // 每5秒拍一次快照
  }

  // 获取内存使用量
  _getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  // 添加指标
  _addMetric(componentName, metric) {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, {
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        minRenderTime: Infinity,
        maxRenderTime: 0,
        lastRenderTime: 0,
        mountCount: 0,
        totalMountTime: 0,
        unmountCount: 0,
        totalUnmountTime: 0,
        peakMemory: 0,
        memoryUsage: [],
        performance: {
          slowRenderCount: 0,
          memoryLeakRisk: false,
          optimizationScore: 100
        }
      });
    }

    const metrics = this.metrics.get(componentName);
    
    if (metric.type === 'mount') {
      metrics.mountCount++;
      metrics.totalMountTime += metric.duration;
    } else if (metric.type === 'unmount') {
      metrics.unmountCount++;
      metrics.totalUnmountTime += metric.duration;
    }
    
    Object.assign(metrics, metric);
  }

  // 获取整体指标
  _getOverallMetrics() {
    const allMetrics = Array.from(this.metrics.values());
    const totalComponents = allMetrics.length;
    
    if (totalComponents === 0) {
      return {
        totalComponents: 0,
        averageRenderTime: 0,
        totalRenderTime: 0,
        memoryUsage: 0,
        slowRenderCount: 0
      };
    }

    return {
      totalComponents,
      averageRenderTime: allMetrics.reduce((sum, m) => sum + m.averageRenderTime, 0) / totalComponents,
      totalRenderTime: allMetrics.reduce((sum, m) => sum + m.totalRenderTime, 0),
      memoryUsage: this._getMemoryUsage(),
      slowRenderCount: allMetrics.reduce((sum, m) => sum + m.performance.slowRenderCount, 0)
    };
  }

  // 生成性能报告
  _generatePerformanceReport() {
    const overallMetrics = this._getOverallMetrics();
    const slowComponents = Array.from(this.metrics.entries())
      .filter(([name, metric]) => metric.averageRenderTime > 16)
      .sort((a, b) => b[1].averageRenderTime - a[1].averageRenderTime)
      .slice(0, 5);

    const report = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      overallMetrics,
      slowComponents,
      optimizationSuggestions: Array.from(this.optimizationSuggestions.values()).flat(),
      memoryAnalysis: this._analyzeMemoryUsage()
    };

    console.log('📊 性能报告:', report);
    return report;
  }

  // 分析内存使用
  _analyzeMemoryUsage() {
    if (this.memorySnapshots.length < 2) {
      return null;
    }

    const recent = this.memorySnapshots.slice(-5);
    const trend = recent[recent.length - 1].usedJSHeapSize - recent[0].usedJSHeapSize;

    return {
      current: recent[recent.length - 1],
      trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      change: trend,
      memoryPressure: trend > 10 * 1024 * 1024 // 10MB
    };
  }

  // 获取组件性能数据
  getComponentMetrics(componentName) {
    return this.metrics.get(componentName) || null;
  }

  // 重置组件指标
  resetComponentMetrics(componentName) {
    if (this.metrics.has(componentName)) {
      this.metrics.set(componentName, {
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        minRenderTime: Infinity,
        maxRenderTime: 0,
        lastRenderTime: 0,
        mountCount: 0,
        totalMountTime: 0,
        unmountCount: 0,
        totalUnmountTime: 0,
        peakMemory: 0,
        memoryUsage: [],
        performance: {
          slowRenderCount: 0,
          memoryLeakRisk: false,
          optimizationScore: 100
        }
      });
    }
  }

  // 比较组件性能
  compareComponents(componentA, componentB) {
    const metricsA = this.metrics.get(componentA);
    const metricsB = this.metrics.get(componentB);

    if (!metricsA || !metricsB) {
      return null;
    }

    return {
      a: {
        renderCount: metricsA.renderCount,
        averageRenderTime: metricsA.averageRenderTime,
        mountCount: metricsA.mountCount,
        peakMemory: metricsA.peakMemory
      },
      b: {
        renderCount: metricsB.renderCount,
        averageRenderTime: metricsB.averageRenderTime,
        mountCount: metricsB.mountCount,
        peakMemory: metricsB.peakMemory
      },
      averageRenderTime: {
        a: metricsA.averageRenderTime,
        b: metricsB.averageRenderTime
      },
      comparison: {
        faster: metricsA.averageRenderTime < metricsB.averageRenderTime ? componentA : componentB,
        difference: Math.abs(metricsA.averageRenderTime - metricsB.averageRenderTime)
      }
    };
  }

  // 获取所有组件指标
  getAllMetrics() {
    const result = {};
    for (const [name, metrics] of this.metrics.entries()) {
      result[name] = metrics;
    }
    return result;
  }

  // 获取优化建议
  getOptimizationSuggestions(componentName = null) {
    if (componentName) {
      return this.optimizationSuggestions.get(componentName) || [];
    }
    
    return Array.from(this.optimizationSuggestions.values()).flat();
  }

  // 获取性能报告
  getPerformanceReport() {
    return this._generatePerformanceReport();
  }

  // 生成性能报告（公共方法）
  generatePerformanceReport() {
    const overallMetrics = this._getOverallMetrics();
    const components = {};
    
    for (const [name, metrics] of this.metrics.entries()) {
      components[name] = {
        renderCount: metrics.renderCount,
        averageRenderTime: metrics.averageRenderTime,
        mountCount: metrics.mountCount,
        unmountCount: metrics.unmountCount,
        peakMemory: metrics.peakMemory,
        optimizationScore: metrics.performance.optimizationScore
      };
    }

    const memoryAnalysis = this._analyzeMemoryUsage();

    return {
      overview: {
        totalComponents: overallMetrics.totalComponents,
        totalRenders: overallMetrics.totalRenderTime > 0 ? overallMetrics.totalComponents : 0,
        averageRenderTime: overallMetrics.averageRenderTime,
        memoryUsage: overallMetrics.memoryUsage,
        slowRenderCount: overallMetrics.slowRenderCount
      },
      components,
      memory: memoryAnalysis || {
        current: 0,
        trend: 'unknown',
        change: 0
      },
      suggestions: Array.from(this.optimizationSuggestions.values()).flat()
    };
  }

  // 重置指标
  reset() {
    this.metrics.clear();
    this.renderHistory.clear();
    this.optimizationSuggestions.clear();
    this.memorySnapshots = [];
    this.startTime = Date.now();
  }

  // 导出数据
  exportData() {
    return {
      metrics: Object.fromEntries(this.metrics),
      renderHistory: Object.fromEntries(this.renderHistory),
      memorySnapshots: this.memorySnapshots,
      optimizationSuggestions: Object.fromEntries(this.optimizationSuggestions),
      exportTime: new Date().toISOString()
    };
  }

  // 导出性能数据
  exportPerformanceData() {
    return {
      metrics: Object.fromEntries(this.metrics),
      history: Object.fromEntries(this.renderHistory),
      memorySnapshots: this.memorySnapshots,
      timestamp: Date.now()
    };
  }

  // 导入性能数据
  importPerformanceData(data) {
    if (data.metrics) {
      if (data.metrics instanceof Map) {
        this.metrics = data.metrics;
      } else {
        this.metrics = new Map(Object.entries(data.metrics));
      }
    }

    if (data.history) {
      if (data.history instanceof Map) {
        this.renderHistory = data.history;
      } else {
        this.renderHistory = new Map(Object.entries(data.history));
      }
    }

    if (data.memorySnapshots) {
      this.memorySnapshots = data.memorySnapshots;
    }
  }

  // 销毁
  // 设置性能阈值
  setPerformanceThreshold(thresholdType, value) {
    switch (thresholdType) {
      case 'slow-render':
        this.options.slowRenderThreshold = value;
        break;
      case 'memory-leak':
        this.options.memoryLeakThreshold = value;
        break;
      default:
        console.warn(`未知的阈值类型: ${thresholdType}`);
    }
  }

  // 启用监控
  enableMonitoring() {
    this.options.enableRenderTracking = true;
    this.options.enableMemoryTracking = true;
  }

  // 禁用监控
  disableMonitoring() {
    this.options.enableRenderTracking = false;
    this.options.enableMemoryTracking = false;
  }

  // 获取运行时统计
  getRuntimeStats() {
    const uptime = Date.now() - this.startTime;
    const totalComponentsTracked = this.metrics.size;
    const memoryUsage = this._getMemoryUsage();

    let totalRenders = 0;
    let totalMounts = 0;
    let totalUnmounts = 0;

    for (const metrics of this.metrics.values()) {
      totalRenders += metrics.renderCount;
      totalMounts += metrics.mountCount;
      totalUnmounts += metrics.unmountCount;
    }

    return {
      uptime,
      totalComponentsTracked,
      memoryUsage,
      totalRenders,
      totalMounts,
      totalUnmounts,
      monitoringActive: this.monitoringInterval !== null
    };
  }

  // 清理过期数据
  cleanupExpiredData() {
    const retentionPeriod = this.options.dataRetentionPeriod || 7 * 24 * 60 * 60 * 1000; // 默认7天
    const now = Date.now();
    const expiredThreshold = now - retentionPeriod;

    // 清理渲染历史
    for (const [componentName, history] of this.renderHistory.entries()) {
      const filteredHistory = history.filter(entry => entry.timestamp > expiredThreshold);
      
      if (filteredHistory.length === 0) {
        // 如果所有记录都过期了，删除整个条目
        this.renderHistory.delete(componentName);
      } else {
        // 更新历史记录
        this.renderHistory.set(componentName, filteredHistory);
      }
    }

    // 清理内存快照
    this.memorySnapshots = this.memorySnapshots.filter(snapshot => snapshot.timestamp > expiredThreshold);

    // 清理优化建议中的过期条目
    for (const [componentName, suggestions] of this.optimizationSuggestions.entries()) {
      if (!this.renderHistory.has(componentName) && !this.metrics.has(componentName)) {
        // 如果组件不再存在，删除优化建议
        this.optimizationSuggestions.delete(componentName);
      }
    }
  }

  destroy() {
    this.stopMonitoring();
    this.reset();
  }
}

// 全局性能监控器实例
export const performanceMonitor = new ComponentPerformanceMonitor();

// 便捷方法
export const startPerformanceMonitoring = () => 
  performanceMonitor.startMonitoring();

export const stopPerformanceMonitoring = () => 
  performanceMonitor.stopMonitoring();

export const recordComponentRender = (name, data) => 
  performanceMonitor.recordRender(name, data);

export const recordComponentMount = (name, data) => 
  performanceMonitor.recordMount(name, data);

export const recordComponentUnmount = (name, data) => 
  performanceMonitor.recordUnmount(name, data);

export const getPerformanceReport = () => 
  performanceMonitor.getPerformanceReport();

export const getOptimizationSuggestions = (componentName) => 
  performanceMonitor.getOptimizationSuggestions(componentName);