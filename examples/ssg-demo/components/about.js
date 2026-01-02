const About = $.component('About', {
  data() {
    return {
      title: '关于我们',
      mission: '我们的使命',
      missionText: '通过提供强大而易用的静态站点生成工具，帮助开发者构建高性能、SEO 友好的网站。',
      vision: '我们的愿景',
      visionText: '成为最优秀的前端静态站点生成解决方案，让每个开发者都能轻松创建出色的网站。',
      values: [
        { title: '创新', description: '持续推动技术进步，提供最前沿的解决方案' },
        { title: '质量', description: '追求卓越，确保每个功能都达到最高标准' },
        { title: '社区', description: '拥抱开源，与全球开发者共同成长' }
      ]
    };
  },

  render(createElem) {
    return createElem('div', {}, [
      createElem('h2', { style: 'text-align: center; color: #667eea; margin-bottom: 40px;' }, this.data.title),
      
      createElem('div', { style: 'background: #f8f9fa; padding: 40px; border-radius: 10px; margin-bottom: 40px;' }, [
        createElem('h3', { style: 'color: #667eea; margin-bottom: 20px;' }, this.data.mission),
        createElem('p', { style: 'font-size: 1.1em; line-height: 1.8;' }, this.data.missionText)
      ]),
      
      createElem('div', { style: 'background: #f8f9fa; padding: 40px; border-radius: 10px; margin-bottom: 40px;' }, [
        createElem('h3', { style: 'color: #667eea; margin-bottom: 20px;' }, this.data.vision),
        createElem('p', { style: 'font-size: 1.1em; line-height: 1.8;' }, this.data.visionText)
      ]),
      
      createElem('h3', { style: 'text-align: center; color: #667eea; margin-bottom: 30px;' }, '我们的价值观'),
      createElem('div', { class: 'features' }, 
        this.data.values.map(value => 
          createElem('div', { class: 'feature-card' }, [
            createElem('h3', {}, value.title),
            createElem('p', {}, value.description)
          ])
        )
      )
    ]);
  }
});

export { About };
