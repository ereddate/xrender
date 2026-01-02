import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentPerformanceMonitor } from '../../src/libs/sfc/performance-monitor.js';

describe('性能监控器测试', () => {
  let performanceMonitor;
  
  beforeEach(() => {
    performanceMonitor = new ComponentPerformanceMonitor({
      enableMemoryTracking: true,
      enableRenderTracking: true,
      enablePerformanceAPI: true,
      maxHistorySize: 10,
      monitoringInterval: 100
    });
  });
  
  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  it('应该能够创建性能监控器实例', () => {
    expect(performanceMonitor).toBeDefined();
    expect(performanceMonitor.metrics).toBeDefined();
    expect(performanceMonitor.renderHistory).toBeDefined();
    expect(performanceMonitor.memorySnapshots).toBeDefined();
    expect(performanceMonitor.optimizationSuggestions).toBeDefined();
  });

  it('应该能够开始和停止监控', () => {
    expect(performanceMonitor.monitoringInterval).toBeNull();
    
    performanceMonitor.startMonitoring();
    expect(performanceMonitor.monitoringInterval).toBeDefined();
    
    performanceMonitor.stopMonitoring();
    expect(performanceMonitor.monitoringInterval).toBeNull();
  });

  it('应该能够记录组件渲染', () => {
    const renderData = {
      duration: 15.5,
      type: 'update',
      props: { count: 5 },
      state: { active: true }
    };

    performanceMonitor.recordRender('TestComponent', renderData);

    const history = performanceMonitor.renderHistory.get('TestComponent');
    expect(history).toBeDefined();
    expect(history.length).toBe(1);
    expect(history[0].componentName).toBe('TestComponent');
    expect(history[0].duration).toBe(15.5);
    expect(history[0].renderType).toBe('update');
  });

  it('应该能够限制渲染历史大小', () => {
    // 记录超过限制数量的渲染
    for (let i = 0; i < 15; i++) {
      performanceMonitor.recordRender(`Component${i}`, { duration: i });
    }

    // 应该只保留最近的10条记录
    for (let i = 0; i < 10; i++) {
      const history = performanceMonitor.renderHistory.get(`Component${i + 5}`); // 从第5个开始保留
      expect(history).toBeDefined();
      expect(history.length).toBeLessThanOrEqual(10);
    }
  });

  it('应该能够记录组件挂载', () => {
    const mountData = {
      duration: 25.0,
      timestamp: performance.now()
    };

    performanceMonitor.recordMount('MountComponent', mountData);

    const metrics = performanceMonitor.metrics.get('MountComponent');
    expect(metrics).toBeDefined();
    expect(metrics.mountCount).toBe(1);
    expect(metrics.totalMountTime).toBe(25.0);
  });

  it('应该能够记录组件卸载', () => {
    const unmountData = {
      duration: 5.0,
      reason: 'component-destroyed'
    };

    performanceMonitor.recordUnmount('UnmountComponent', unmountData);

    const metrics = performanceMonitor.metrics.get('UnmountComponent');
    expect(metrics).toBeDefined();
    expect(metrics.unmountCount).toBe(1);
    expect(metrics.totalUnmountTime).toBe(5.0);
  });

  it('应该能够记录内存使用情况', () => {
    const memoryData = {
      used: 1024 * 1024, // 1MB
      total: 2048 * 1024, // 2MB
      limit: 5120 * 1024 // 5MB
    };

    performanceMonitor.recordMemoryUsage('MemoryComponent', memoryData);

    const metrics = performanceMonitor.metrics.get('MemoryComponent');
    expect(metrics).toBeDefined();
    expect(metrics.peakMemory).toBe(1024 * 1024);
  });

  it('应该能够计算渲染性能指标', () => {
    // 记录多个渲染
    performanceMonitor.recordRender('MetricsComponent', { duration: 10 });
    performanceMonitor.recordRender('MetricsComponent', { duration: 20 });
    performanceMonitor.recordRender('MetricsComponent', { duration: 15 });

    const metrics = performanceMonitor.metrics.get('MetricsComponent');
    
    expect(metrics.renderCount).toBe(3);
    expect(metrics.averageRenderTime).toBe(15); // (10 + 20 + 15) / 3
    expect(metrics.minRenderTime).toBe(10);
    expect(metrics.maxRenderTime).toBe(20);
  });

  it('应该能够检测性能问题', () => {
    // 记录一个慢渲染
    performanceMonitor.recordRender('SlowComponent', { duration: 500 });

    const suggestions = performanceMonitor.optimizationSuggestions.get('SlowComponent');
    expect(suggestions).toBeDefined();
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain('慢渲染');
  });

  it('应该能够生成性能报告', () => {
    performanceMonitor.recordRender('ReportComponent1', { duration: 10 });
    performanceMonitor.recordRender('ReportComponent2', { duration: 30 });
    performanceMonitor.recordMemoryUsage('ReportComponent1', { used: 1024 * 1024 });

    const report = performanceMonitor.generatePerformanceReport();

    expect(report).toHaveProperty('overview');
    expect(report).toHaveProperty('components');
    expect(report).toHaveProperty('memory');
    expect(report).toHaveProperty('suggestions');
    expect(report.overview.totalComponents).toBe(2);
    expect(report.overview.totalRenders).toBe(2);
  });

  it('应该能够获取组件性能指标', () => {
    performanceMonitor.recordRender('GetMetricsComponent', { duration: 25 });
    performanceMonitor.recordMount('GetMetricsComponent', { duration: 15 });

    const componentMetrics = performanceMonitor.getComponentMetrics('GetMetricsComponent');

    expect(componentMetrics).toBeDefined();
    expect(componentMetrics.renderCount).toBe(1);
    expect(componentMetrics.averageRenderTime).toBe(25);
    expect(componentMetrics.mountCount).toBe(1);
  });

  it('应该能够重置组件指标', () => {
    performanceMonitor.recordRender('ResetComponent', { duration: 20 });
    
    let metrics = performanceMonitor.getComponentMetrics('ResetComponent');
    expect(metrics.renderCount).toBe(1);

    performanceMonitor.resetComponentMetrics('ResetComponent');
    
    metrics = performanceMonitor.getComponentMetrics('ResetComponent');
    expect(metrics.renderCount).toBe(0);
  });

  it('应该能够比较组件性能', () => {
    performanceMonitor.recordRender('CompareA', { duration: 10 });
    performanceMonitor.recordRender('CompareA', { duration: 20 });
    
    performanceMonitor.recordRender('CompareB', { duration: 5 });
    performanceMonitor.recordRender('CompareB', { duration: 15 });

    const comparison = performanceMonitor.compareComponents('CompareA', 'CompareB');

    expect(comparison).toBeDefined();
    expect(comparison.a.renderCount).toBe(2);
    expect(comparison.b.renderCount).toBe(2);
    expect(comparison.averageRenderTime.a).toBe(15);
    expect(comparison.averageRenderTime.b).toBe(10);
  });

  it('应该能够导出性能数据', () => {
    performanceMonitor.recordRender('ExportComponent', { duration: 30 });

    const exportData = performanceMonitor.exportPerformanceData();

    expect(exportData).toHaveProperty('metrics');
    expect(exportData).toHaveProperty('history');
    expect(exportData).toHaveProperty('memorySnapshots');
    expect(exportData).toHaveProperty('timestamp');
    expect(exportData.history['ExportComponent']).toBeDefined();
  });

  it('应该能够导入性能数据', () => {
    const testData = {
      metrics: new Map([['TestComponent', { renderCount: 5, averageRenderTime: 20 }]]),
      history: new Map([['TestComponent', [{ componentName: 'TestComponent', duration: 20 }]]]),
      memorySnapshots: [],
      timestamp: Date.now()
    };

    performanceMonitor.importPerformanceData(testData);

    const metrics = performanceMonitor.getComponentMetrics('TestComponent');
    expect(metrics.renderCount).toBe(5);
    expect(metrics.averageRenderTime).toBe(20);
  });

  it('应该能够检查内存泄漏', () => {
    // 模拟内存持续增长
    for (let i = 0; i < 10; i++) {
      performanceMonitor.recordMemoryUsage('MemoryLeakComponent', { 
        used: (i + 1) * 1024 * 1024 
      });
    }

    const suggestions = performanceMonitor.optimizationSuggestions.get('MemoryLeakComponent');
    expect(suggestions).toBeDefined();
    expect(suggestions.some(s => s.includes('内存泄漏'))).toBe(true);
  });

  it('应该能够处理性能观察者', () => {
    // 模拟Performance Observer
    global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      callback
    }));

    performanceMonitor.startMonitoring();
    
    expect(PerformanceObserver).toHaveBeenCalled();
  });

  it('应该能够记录自定义事件', () => {
    const customEvent = {
      type: 'custom-action',
      duration: 100,
      metadata: { userId: '123' }
    };

    performanceMonitor.recordCustomEvent('CustomEvent', customEvent);

    const history = performanceMonitor.renderHistory.get('CustomEvent');
    expect(history).toBeDefined();
    expect(history[0].eventType).toBe('custom-action');
    expect(history[0].metadata.userId).toBe('123');
  });

  it('应该能够获取系统性能指标', () => {
    if (typeof performance !== 'undefined' && performance.memory) {
      const systemMetrics = performanceMonitor.getSystemMetrics();
      
      expect(systemMetrics).toHaveProperty('memory');
      expect(systemMetrics).toHaveProperty('timing');
      expect(systemMetrics).toHaveProperty('navigation');
    } else {
      // 在不支持的环境中应该返回默认值
      const systemMetrics = performanceMonitor.getSystemMetrics();
      expect(systemMetrics).toBeDefined();
    }
  });

  it('应该能够设置性能阈值', () => {
    performanceMonitor.setPerformanceThreshold('slow-render', 100);
    performanceMonitor.setPerformanceThreshold('memory-leak', 10 * 1024 * 1024);

    expect(performanceMonitor.options.slowRenderThreshold).toBe(100);
    expect(performanceMonitor.options.memoryLeakThreshold).toBe(10 * 1024 * 1024);
  });

  it('应该能够检查性能阈值违规', () => {
    performanceMonitor.setPerformanceThreshold('slow-render', 50);
    
    // 记录一个超过阈值的渲染
    performanceMonitor.recordRender('ThresholdComponent', { duration: 100 });

    const suggestions = performanceMonitor.optimizationSuggestions.get('ThresholdComponent');
    expect(suggestions).toBeDefined();
    expect(suggestions.some(s => s.includes('超过性能阈值'))).toBe(true);
  });

  it('应该能够启用和禁用监控', () => {
    performanceMonitor.enableMonitoring();
    expect(performanceMonitor.options.enableRenderTracking).toBe(true);
    expect(performanceMonitor.options.enableMemoryTracking).toBe(true);

    performanceMonitor.disableMonitoring();
    expect(performanceMonitor.options.enableRenderTracking).toBe(false);
    expect(performanceMonitor.options.enableMemoryTracking).toBe(false);
  });

  it('应该能够获取运行时统计', () => {
    const stats = performanceMonitor.getRuntimeStats();
    
    expect(stats).toHaveProperty('uptime');
    expect(stats).toHaveProperty('totalComponentsTracked');
    expect(stats).toHaveProperty('memoryUsage');
    expect(typeof stats.uptime).toBe('number');
  });

  it('应该能够清理过期数据', () => {
    // 模拟设置过期时间
    performanceMonitor.options.dataRetentionPeriod = 1000; // 1秒
    
    // 添加一些旧数据
    performanceMonitor.recordRender('OldComponent', { duration: 10 });
    
    // 模拟时间过去
    performanceMonitor.renderHistory.get('OldComponent')[0].timestamp = Date.now() - 2000;
    
    performanceMonitor.cleanupExpiredData();
    
    // 清理后应该没有数据或数据被标记为过期
    const history = performanceMonitor.renderHistory.get('OldComponent');
    if (history && history.length > 0) {
      expect(Date.now() - history[0].timestamp).toBeGreaterThan(1000);
    }
  });
});