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

  it('应该能够实现LRU缓存淘汰', () => {
    const mockComponents = [
      { name: 'Component1' },
      { name: 'Component2' },
      { name: 'Component3' },
      { name: 'Component4' },
      { name: 'Component5' },
      { name: 'Component6' }
    ];

    console.log('Starting LRU test...');
    console.log('Max cache size:', cacheManager.options.maxCacheSize);

    // 填满缓存
    console.log('Filling cache...');
    mockComponents.slice(0, 5).forEach((comp, index) => {
      console.log(`Setting comp${index}`);
      cacheManager.set(`comp${index}`, comp);
      console.log(`Cache size after comp${index}:`, cacheManager.cache.size);
    });

    console.log('Cache size after filling:', cacheManager.cache.size);
    console.log('Cache keys:', Array.from(cacheManager.cache.keys()));

    // 访问第一个组件（更新LRU顺序）
    console.log('Accessing comp0...');
    cacheManager.get('comp0');
    console.log('Access order after accessing comp0:', Array.from(cacheManager.accessOrder.keys()));

    // 添加新组件，应该淘汰最久未使用的组件（comp1）
    console.log('Adding comp5...');
    console.log('Before adding comp5 - cache size:', cacheManager.cache.size);
    cacheManager.set('comp5', mockComponents[5]);
    console.log('After adding comp5 - cache size:', cacheManager.cache.size);

    console.log('Final state:');
    console.log('Cache keys:', Array.from(cacheManager.cache.keys()));
    console.log('comp1 in cache:', cacheManager.cache.has('comp1'));
    console.log('comp0 in cache:', cacheManager.cache.has('comp0'));

    expect(cacheManager.cache.size).toBe(5);
    expect(cacheManager.get('comp1')).toBeNull(); // 被淘汰
    expect(cacheManager.get('comp0')).toBeDefined(); // 仍然存在
  });
});