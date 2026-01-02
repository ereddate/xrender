const Home = $.component('Home', {
  data() {
    return {
      title: '欢迎使用 XRender SSG',
      subtitle: '高性能静态站点生成器',
      features: [
        {
          icon: '🚀',
          title: 'SEO 优化',
          description: '生成完整的 HTML 页面，包含所有元数据和结构化数据'
        },
        {
          icon: '⚡',
          title: '快速加载',
          description: '预渲染的静态页面，首屏加载速度显著提升'
        },
        {
          icon: '🔧',
          title: '易于使用',
          description: '零配置开箱即用，支持灵活的自定义配置'
        },
        {
          icon: '📱',
          title: '响应式设计',
          description: '完美支持移动端和桌面端，提供最佳用户体验'
        }
      ]
    };
  },

  render(createElem) {
    return createElem('div', { class: 'hero' }, [
      createElem('h2', {}, this.data.title),
      createElem('p', { style: 'font-size: 1.2em; margin-bottom: 30px;' }, this.data.subtitle),
      createElem('a', { href: '/features.html', class: 'btn' }, '了解更多'),
      createElem('div', { class: 'features' }, 
        this.data.features.map(feature => 
          createElem('div', { class: 'feature-card' }, [
            createElem('div', { style: 'font-size: 3em; margin-bottom: 15px;' }, feature.icon),
            createElem('h3', {}, feature.title),
            createElem('p', {}, feature.description)
          ])
        )
      )
    ]);
  }
});

export { Home };
