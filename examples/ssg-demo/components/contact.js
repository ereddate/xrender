const Contact = $.component('Contact', {
  data() {
    return {
      title: '联系我们',
      description: '有任何问题或建议？我们随时为您提供帮助。',
      contacts: [
        {
          icon: '📧',
          title: '电子邮件',
          value: 'support@xrender.com',
          link: 'mailto:support@xrender.com'
        },
        {
          icon: '💬',
          title: '在线聊天',
          value: '立即开始对话',
          link: '#'
        },
        {
          icon: '📱',
          title: '社交媒体',
          value: '关注我们的社交媒体',
          link: '#'
        }
      ],
      form: {
        name: '',
        email: '',
        message: ''
      }
    };
  },

  methods: {
    handleSubmit(e) {
      e.preventDefault();
      console.log('Form submitted:', this.data.form);
      alert('感谢您的留言！我们会尽快回复您。');
      this.data.form = { name: '', email: '', message: '' };
    }
  },

  render(createElem) {
    return createElem('div', {}, [
      createElem('h2', { style: 'text-align: center; color: #667eea; margin-bottom: 20px;' }, this.data.title),
      createElem('p', { style: 'text-align: center; font-size: 1.2em; margin-bottom: 40px;' }, this.data.description),
      
      createElem('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;' }, [
        createElem('div', {}, [
          createElem('h3', { style: 'color: #667eea; margin-bottom: 20px;' }, '联系方式'),
          createElem('div', {}, 
            this.data.contacts.map(contact => 
              createElem('div', { style: 'background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 15px;' }, [
                createElem('div', { style: 'font-size: 2em; margin-bottom: 10px;' }, contact.icon),
                createElem('h4', { style: 'margin-bottom: 5px;' }, contact.title),
                createElem('a', { href: contact.link, style: 'color: #667eea; text-decoration: none;' }, contact.value)
              ])
            )
          )
        ]),
        
        createElem('div', {}, [
          createElem('h3', { style: 'color: #667eea; margin-bottom: 20px;' }, '发送消息'),
          createElem('form', { '@submit': 'handleSubmit', style: 'background: #f8f9fa; padding: 30px; border-radius: 10px;' }, [
            createElem('div', { style: 'margin-bottom: 20px;' }, [
              createElem('label', { style: 'display: block; margin-bottom: 5px; font-weight: 500;' }, '姓名'),
              createElem('input', {
                type: 'text',
                'v-model': 'form.name',
                style: 'width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;',
                required: true
              })
            ]),
            createElem('div', { style: 'margin-bottom: 20px;' }, [
              createElem('label', { style: 'display: block; margin-bottom: 5px; font-weight: 500;' }, '电子邮件'),
              createElem('input', {
                type: 'email',
                'v-model': 'form.email',
                style: 'width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;',
                required: true
              })
            ]),
            createElem('div', { style: 'margin-bottom: 20px;' }, [
              createElem('label', { style: 'display: block; margin-bottom: 5px; font-weight: 500;' }, '消息'),
              createElem('textarea', {
                'v-model': 'form.message',
                style: 'width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; min-height: 150px;',
                required: true
              })
            ]),
            createElem('button', {
              type: 'submit',
              style: 'width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 5px; font-size: 1.1em; cursor: pointer;'
            }, '发送消息')
          ])
        ])
      ])
    ]);
  }
});

export { Contact };
