const { ComponentCacheManager } = require('./src/libs/sfc/component-cache-manager.js');

// 创建缓存管理器实例
const cacheManager = new ComponentCacheManager();

// 测试预加载功能
async function testPreload() {
  const mockComponent = { name: 'PreloadComponent' };
  const loader = () => {
    console.log('Loader called!');
    return Promise.resolve(mockComponent);
  };

  console.log('Starting preload test...');
  console.log('Cache before preload:', cacheManager.cache.size);
  
  try {
    const result = await cacheManager.preload('preload-test', loader);
    console.log('Preload result:', result);
    console.log('Cache after preload:', cacheManager.cache.size);
    console.log('Cached component:', cacheManager.get('preload-test'));
  } catch (error) {
    console.error('Preload error:', error);
  }
}

testPreload().catch(console.error);