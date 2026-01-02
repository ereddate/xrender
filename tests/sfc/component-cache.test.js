import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentCacheManager } from '../../src/libs/sfc/component-cache-manager.js';

describe('组件缓存管理器测试', () => {
  let cacheManager;
  
  beforeEach(() => {
    cacheManager = new ComponentCacheManager({
      maxCacheSize: 5,
      cacheTTL: 1000,
      autoCleanup: false
    });
  });
  
  afterEach(() => {
    cacheManager.clear();
  });

  it('应该能够创建缓存管理器实例', () => {
    expect(cacheManager).toBeDefined();
    expect(cacheManager.cache).toBeDefined();
    expect(cacheManager.accessOrder).toBeDefined();
    expect(cacheManager.options).toBeDefined();
  });

  it('应该能够设置和获取缓存项', () => {
    const mockComponent = {
      name: 'TestComponent',
      template: '<div>Test</div>'
    };

    cacheManager.set('test', mockComponent, { version: '1.0.0' });
    
    const cached = cacheManager.get('test');
    expect(cached).toBe(mockComponent);
  });

  it('应该能够处理缓存命中率统计', () => {
    const mockComponent = { name: 'StatsComponent' };
    
    // 第一次获取，缓存未命中
    const miss = cacheManager.get('non-existent');
    expect(miss).toBeNull();
    expect(cacheManager.stats.misses).toBe(1);
    
    // 设置缓存
    cacheManager.set('test', mockComponent);
    
    // 第二次获取，缓存命中
    const hit = cacheManager.get('test');
    expect(hit).toBe(mockComponent);
    expect(cacheManager.stats.hits).toBe(1);
  });

  it('应该能够处理缓存TTL过期', () => {
    const mockComponent = { name: 'TTLComponent' };
    
    cacheManager.set('ttl-test', mockComponent);
    
    // 模拟时间过去（超过TTL）
    const originalGet = cacheManager.get;
    cacheManager.get = function(key) {
      // 强制返回过期
      const entry = this.cache.get(key);
      if (entry) {
        entry.timestamp = Date.now() - 2000; // 2秒前
      }
      return originalGet.call(this, key);
    };
    
    const expired = cacheManager.get('ttl-test');
    expect(expired).toBeNull();
    expect(cacheManager.stats.misses).toBe(1);
  });

  it('应该能够实现LRU缓存淘汰', () => {
    const mockComponents = [
      { name: 'Component1' },
      { name: 'Component2' },
      { name: 'Component3' },
      { name: 'Component4' },
      { name: 'Component5' },
      { name: 'Component6' }
    ];

    // 填满缓存
    mockComponents.slice(0, 5).forEach((comp, index) => {
      cacheManager.set(`comp${index}`, comp);
    });

    expect(cacheManager.cache.size).toBe(5);

    // 访问第一个组件（更新LRU顺序）
    cacheManager.get('comp0');

    // 添加新组件，应该淘汰最久未使用的组件（comp1）
    cacheManager.set('comp5', mockComponents[5]);

    expect(cacheManager.cache.size).toBe(5);
    expect(cacheManager.get('comp1')).toBeNull(); // 被淘汰
    expect(cacheManager.get('comp0')).toBeDefined(); // 仍然存在
  });

  it('应该能够处理加载中的Promise', async () => {
    const mockComponent = { name: 'AsyncComponent' };
    const loader = vi.fn().mockResolvedValue(mockComponent);
    
    // 第一次调用，应该开始加载
    const promise1 = cacheManager.getOrLoad('async-test', loader);
    
    // 第二次调用，应该返回同一个Promise
    const promise2 = cacheManager.getOrLoad('async-test', loader);
    
    expect(promise1).toBe(promise2);
    expect(loader).toHaveBeenCalledTimes(1);
    
    const result = await promise1;
    expect(result).toBe(mockComponent);
  });

  it('应该能够处理加载失败', async () => {
    const error = new Error('Load failed');
    const loader = vi.fn().mockRejectedValue(error);
    
    await expect(cacheManager.getOrLoad('fail-test', loader)).rejects.toThrow('Load failed');
    expect(loader).toHaveBeenCalledTimes(1);
    expect(cacheManager.loadingPromises.has('fail-test')).toBe(false);
  });

  it('应该能够支持重试机制', async () => {
    const mockComponent = { name: 'RetryComponent' };
    let callCount = 0;
    const loader = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.reject(new Error('Temporary error'));
      }
      return Promise.resolve(mockComponent);
    });
    
    const result = await cacheManager.getOrLoad('retry-test', loader, { retryAttempts: 3 });
    
    expect(result).toBe(mockComponent);
    expect(loader).toHaveBeenCalledTimes(3);
  });

  it('应该能够预加载组件', async () => {
    const mockComponent = { name: 'PreloadComponent' };
    const loader = vi.fn().mockResolvedValue(mockComponent);
    
    await cacheManager.preload('preload-test', loader);
    
    expect(loader).toHaveBeenCalledTimes(1);
    expect(cacheManager.get('preload-test')).toBe(mockComponent);
  });

  it('应该能够删除缓存项', () => {
    const mockComponent = { name: 'DeleteComponent' };
    
    cacheManager.set('delete-test', mockComponent);
    expect(cacheManager.get('delete-test')).toBeDefined();
    
    cacheManager.delete('delete-test');
    expect(cacheManager.get('delete-test')).toBeNull();
  });

  it('应该能够清除所有缓存', () => {
    cacheManager.set('test1', { name: 'Component1' });
    cacheManager.set('test2', { name: 'Component2' });
    
    expect(cacheManager.cache.size).toBe(2);
    
    cacheManager.clear();
    expect(cacheManager.cache.size).toBe(0);
    expect(cacheManager.accessOrder.size).toBe(0);
  });

  it('应该能够获取缓存统计信息', () => {
    cacheManager.set('test1', { name: 'Component1' });
    cacheManager.get('test1');
    cacheManager.get('non-existent');
    
    const stats = cacheManager.getStats();
    
    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
    expect(stats).toHaveProperty('cacheSize');
    expect(stats).toHaveProperty('maxCacheSize');
    expect(stats).toHaveProperty('evictions');
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.cacheSize).toBe(1);
  });

  it('应该能够计算缓存大小', () => {
    const smallComponent = { name: 'Small' };
    const largeComponent = { 
      name: 'Large',
      data: new Array(1000).fill('data')
    };
    
    cacheManager.set('small', smallComponent);
    cacheManager.set('large', largeComponent);
    
    const smallSize = cacheManager._calculateSize(smallComponent);
    const largeSize = cacheManager._calculateSize(largeComponent);
    
    expect(largeSize).toBeGreaterThan(smallSize);
  });

  it('应该能够监听组件可见性进行懒加载', async () => {
    const mockComponent = { name: 'LazyComponent' };
    const loader = vi.fn().mockResolvedValue(mockComponent);
    
    // 模拟Intersection Observer
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    }));
    
    await cacheManager.register('lazy-test', loader, { lazy: true });
    
    // 验证观察器被创建
    expect(cacheManager.observer).toBeDefined();
  });

  it('应该能够处理组件版本管理', () => {
    const componentV1 = { name: 'VersionedComponent', version: '1.0.0' };
    const componentV2 = { name: 'VersionedComponent', version: '2.0.0' };
    
    cacheManager.set('versioned', componentV1);
    cacheManager.set('versioned', componentV2);
    
    const cached = cacheManager.get('versioned');
    expect(cached.version).toBe('2.0.0');
    
    const metadata = cacheManager.getMetadata('versioned');
    expect(metadata.version).toBe('2.0.0');
  });
});