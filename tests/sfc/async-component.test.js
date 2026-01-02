import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AsyncComponentManager from '../../src/libs/sfc/async-component-manager.js';

describe('异步组件管理器测试', () => {
  let asyncComponentManager;
  
  beforeEach(() => {
    asyncComponentManager = new AsyncComponentManager();
  });
  
  afterEach(() => {
    asyncComponentManager.clear();
  });

  it('应该能够创建异步组件管理器实例', () => {
    expect(asyncComponentManager).toBeDefined();
    expect(asyncComponentManager.cache).toBeDefined();
    expect(asyncComponentManager.loadingPromises).toBeDefined();
    expect(asyncComponentManager.stats).toBeDefined();
  });

  it('应该能够加载并缓存组件', async () => {
    const mockComponent = {
      name: 'TestComponent',
      template: '<div>Test Component</div>'
    };

    const loader = vi.fn().mockResolvedValue(mockComponent);
    
    const result = await asyncComponentManager.getOrLoad('test', loader);
    
    expect(result).toBe(mockComponent);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(asyncComponentManager.get('test')).toBe(mockComponent);
  });

  it('应该能够处理加载失败的情况', async () => {
    const error = new Error('Load failed');
    const loader = vi.fn().mockRejectedValue(error);
    
    await expect(asyncComponentManager.getOrLoad('test', loader)).rejects.toThrow('Load failed');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('应该能够支持重试机制', async () => {
    const mockComponent = { name: 'TestComponent' };
    let callCount = 0;
    const loader = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error('Temporary error'));
      }
      return Promise.resolve(mockComponent);
    });
    
    const result = await asyncComponentManager.getOrLoad('test', loader, { retryAttempts: 3 });
    
    expect(result).toBe(mockComponent);
    expect(loader).toHaveBeenCalledTimes(3);
  });

  it('应该能够处理超时情况', async () => {
    const loader = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 2000))
    );
    
    const resultPromise = asyncComponentManager.getOrLoad('test', loader, { timeout: 100 });
    
    await expect(resultPromise).rejects.toThrow('timeout');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('应该能够预加载组件', async () => {
    const mockComponent = { name: 'PreloadComponent' };
    const loader = vi.fn().mockResolvedValue(mockComponent);
    
    await asyncComponentManager.preload('preload-test', loader);
    
    expect(loader).toHaveBeenCalledTimes(1);
    expect(asyncComponentManager.get('preload-test')).toBe(mockComponent);
  });

  it('应该能够设置组件元数据', async () => {
    const mockComponent = { name: 'MetaComponent' };
    const loader = vi.fn().mockResolvedValue(mockComponent);
    const metadata = { version: '1.0.0', author: 'Test' };
    
    await asyncComponentManager.getOrLoad('meta-test', loader, { metadata });
    
    expect(asyncComponentManager.getMetadata('meta-test')).toEqual(metadata);
  });

  it('应该能够批量加载组件', async () => {
    const components = [
      { name: 'Component1', template: '<div>1</div>' },
      { name: 'Component2', template: '<div>2</div>' }
    ];
    
    const loaders = components.map(comp => 
      vi.fn().mockResolvedValue(comp)
    );
    
    const result = await asyncComponentManager.batchLoad(['comp1', 'comp2'], loaders);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(components[0]);
    expect(result[1]).toBe(components[1]);
  });

  it('应该能够检查组件是否存在', async () => {
    const mockComponent = { name: 'ExistingComponent' };
    const loader = vi.fn().mockResolvedValue(mockComponent);
    
    expect(asyncComponentManager.has('non-existent')).toBe(false);
    
    await asyncComponentManager.getOrLoad('existing', loader);
    expect(asyncComponentManager.has('existing')).toBe(true);
  });

  it('应该能够获取缓存统计信息', async () => {
    const mockComponent = { name: 'StatsComponent' };
    const loader = vi.fn().mockResolvedValue(mockComponent);
    
    await asyncComponentManager.getOrLoad('stats-test', loader);
    
    const stats = asyncComponentManager.getStats();
    
    expect(stats).toHaveProperty('totalComponents');
    expect(stats).toHaveProperty('cacheSize');
    expect(stats).toHaveProperty('errors');
  });

  it('应该能够清除缓存', async () => {
    const mockComponent = { name: 'ClearComponent' };
    const loader = vi.fn().mockResolvedValue(mockComponent);
    
    await asyncComponentManager.getOrLoad('clear-test', loader);
    expect(asyncComponentManager.has('clear-test')).toBe(true);
    
    asyncComponentManager.clear();
    expect(asyncComponentManager.has('clear-test')).toBe(false);
  });
});