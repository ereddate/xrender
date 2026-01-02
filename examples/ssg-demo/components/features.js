const Features = $.component('Features', {
  data() {
    return {
      title: '功能特性',
      features: [
        {
          icon: '🔍',
          title: 'SEO 优化',
          description: '生成完整的 HTML 页面，包含所有元数据和结构化数据，让搜索引擎更好地理解您的网站。',
          details: [
            '自动生成 meta 标签',
            '支持 Open Graph 和 Twitter Card',
            '结构化数据（Schema.org）',
            '语义化 HTML'
          ]
        },
        {
          icon: '🛣️',
          title: '路由预渲染',
          description: '自动为所有路由生成静态 HTML 文件，无需手动配置。',
          details: [
            '支持动态路由',
            '增量构建',
            '并发处理',
            '自定义路由配置'
          ]
        },
        {
          icon: '📊',
          title: '元数据管理',
          description: '灵活的页面级元数据配置，支持自定义元标签。',
          details: [
            '页面级元数据',
            '全局默认配置',
            '继承和覆盖',
            '动态元数据'
          ]
        },
        {
          icon: '⚙️',
          title: '零配置',
          description: '开箱即用，支持灵活的自定义配置。',
          details: [
            '默认配置优化',
            '插件化架构',
            'Vite 集成',
            'TypeScript 支持'
          ]
        },
        {
          icon: '📈',
          title: '性能优化',
          description: '多种优化策略，确保最佳性能。',
          details: [
            '代码分割',
            '资源压缩',
            '懒加载',
            '缓存策略'
          ]
        },
        {
          icon: '🎨',
          title: '开发者体验',
          description: '优秀的开发体验，提高开发效率。',
          details: [
            '热模块替换',
            '错误提示',
            '调试工具',
            '丰富的文档'
          ]
        }
      ]
    };
  },

  render(createElem) {
    return createElem('div', {}, [
      createElem('h2', { style: 'text-align: center; color: #667eea; margin-bottom: 40px;' }, this.data.title),
      createElem('div', { class: 'features' }, 
        this.data.features.map(feature => 
          createElem('div', { class: 'feature-card' }, [
            createElem('div', { style: 'font-size: 3em; margin-bottom: 15px;' }, feature.icon),
            createElem('h3', {}, feature.title),
            createElem('p', { style: 'margin-bottom: 15px;' }, feature.description),
            createElem('ul', { style: 'list-style: none; padding: 0;' }, 
              feature.details.map(detail => 
                createElem('li', { style: 'padding: 5px 0; border-bottom: 1px solid #eee;' }, 
                  createElem('span', { style: 'color: #667eea; margin-right: 8px;' }, '✓'),
                  detail
                )
              )
            )
          ])
        )
      )
    ]);
  }
});

export { Features };
