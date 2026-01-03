# v-memo 示例

## 基础示例

```javascript
import 'xrender';

const App = $.component('App', {
  data() {
    return {
      count: 0,
      message: 'Hello'
    };
  },
  render(createElem) {
    return createElem('div', { class: 'app' }, [
      createElem('button', {
        '@click': () => { this.data.count++; }
      }, `Count: ${this.data.count}`),
      createElem('div', {
        'v-memo': ['message']
      }, [
        createElem('p', {}, this.data.message)
      ])
    ]);
  }
});

$.createApp({ App }).$mount('#app');
```

## 长列表优化

```javascript
import 'xrender';

const LongList = $.component('LongList', {
  data() {
    return {
      items: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description ${i}`.repeat(5)
      })),
      filter: ''
    };
  },
  computed: {
    filteredItems() {
      if (!this.data.filter) {
        return this.data.items;
      }
      return this.data.items.filter(item => 
        item.name.includes(this.data.filter)
      );
    }
  },
  render(createElem) {
    return createElem('div', { class: 'long-list' }, [
      createElem('input', {
        type: 'text',
        'v-model': 'filter',
        placeholder: 'Filter items...'
      }),
      createElem('ul', {}, 
        this.filteredItems.map(item => 
          createElem('li', { 
            'v-memo': ['filter', `item-${item.id}`],
            key: item.id
          }, [
            createElem('h3', {}, item.name),
            createElem('p', {}, item.description)
          ])
        )
      )
    ]);
  }
});

$.createApp({ App: LongList }).$mount('#app');
```

## 复杂计算优化

```javascript
import 'xrender';

const ComplexCalculation = $.component('ComplexCalculation', {
  data() {
    return {
      baseValue: 10,
      multiplier: 2,
      offset: 0
    };
  },
  computed: {
    expensiveResult() {
      return this.performExpensiveCalculation();
    }
  },
  methods: {
    performExpensiveCalculation() {
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.sin(i) * Math.cos(i);
      }
      return (this.data.baseValue * this.data.multiplier) + result + this.data.offset;
    }
  },
  render(createElem) {
    return createElem('div', { class: 'complex-calculation' }, [
      createElem('div', {}, [
        createElem('label', {}, 'Base Value: '),
        createElem('input', {
          type: 'number',
          'v-model': 'baseValue'
        })
      ]),
      createElem('div', {}, [
        createElem('label', {}, 'Multiplier: '),
        createElem('input', {
          type: 'number',
          'v-model': 'multiplier'
        })
      ]),
      createElem('div', {}, [
        createElem('label', {}, 'Offset: '),
        createElem('input', {
          type: 'number',
          'v-model': 'offset'
        })
      ]),
      createElem('div', {
        'v-memo': ['baseValue', 'multiplier', 'offset']
      }, [
        createElem('h3', {}, `Result: ${this.expensiveResult.toFixed(2)}`)
      ])
    ]);
  }
});

$.createApp({ App: ComplexCalculation }).$mount('#app');
```

## 条件渲染优化

```javascript
import 'xrender';

const UserProfile = $.component('UserProfile', {
  data() {
    return {
      showDetails: false,
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        location: 'New York',
        bio: 'Software Developer',
        skills: ['JavaScript', 'Python', 'React'],
        projects: [
          { name: 'Project A', description: 'Description A' },
          { name: 'Project B', description: 'Description B' }
        ]
      }
    };
  },
  render(createElem) {
    return createElem('div', { class: 'user-profile' }, [
      createElem('div', { class: 'user-summary' }, [
        createElem('h2', {}, this.data.user.name),
        createElem('button', {
          '@click': () => { this.data.showDetails = !this.data.showDetails; }
        }, this.data.showDetails ? 'Hide Details' : 'Show Details')
      ]),
      this.data.showDetails ? createElem('div', {
        class: 'user-details',
        'v-memo': ['user']
      }, [
        createElem('div', {}, [
          createElem('strong', {}, 'Email: '),
          createElem('span', {}, this.data.user.email)
        ]),
        createElem('div', {}, [
          createElem('strong', {}, 'Age: '),
          createElem('span', {}, this.data.user.age)
        ]),
        createElem('div', {}, [
          createElem('strong', {}, 'Location: '),
          createElem('span', {}, this.data.user.location)
        ]),
        createElem('div', {}, [
          createElem('strong', {}, 'Bio: '),
          createElem('p', {}, this.data.user.bio)
        ]),
        createElem('div', {}, [
          createElem('strong', {}, 'Skills: '),
          createElem('ul', {},
            this.data.user.skills.map(skill =>
              createElem('li', {}, skill)
            )
          )
        ]),
        createElem('div', {}, [
          createElem('strong', {}, 'Projects: '),
          createElem('ul', {},
            this.data.user.projects.map(project =>
              createElem('li', {}, [
                createElem('strong', {}, project.name),
                createElem('span', {}, ` - ${project.description}`)
              ])
            )
          )
        ])
      ]) : null
    ]);
  }
});

$.createApp({ App: UserProfile }).$mount('#app');
```

## 表单优化

```javascript
import 'xrender';

const OptimizedForm = $.component('OptimizedForm', {
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      touched: {
        username: false,
        email: false,
        password: false,
        confirmPassword: false
      },
      errors: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
    };
  },
  methods: {
    validateUsername() {
      if (!this.data.form.username) {
        this.data.errors.username = 'Username is required';
      } else if (this.data.form.username.length < 3) {
        this.data.errors.username = 'Username must be at least 3 characters';
      } else {
        this.data.errors.username = '';
      }
    },
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.data.form.email) {
        this.data.errors.email = 'Email is required';
      } else if (!emailRegex.test(this.data.form.email)) {
        this.data.errors.email = 'Invalid email format';
      } else {
        this.data.errors.email = '';
      }
    },
    validatePassword() {
      if (!this.data.form.password) {
        this.data.errors.password = 'Password is required';
      } else if (this.data.form.password.length < 6) {
        this.data.errors.password = 'Password must be at least 6 characters';
      } else {
        this.data.errors.password = '';
      }
    },
    validateConfirmPassword() {
      if (this.data.form.confirmPassword !== this.data.form.password) {
        this.data.errors.confirmPassword = 'Passwords do not match';
      } else {
        this.data.errors.confirmPassword = '';
      }
    }
  },
  render(createElem) {
    return createElem('form', { class: 'optimized-form' }, [
      createElem('div', { class: 'form-group' }, [
        createElem('label', {}, 'Username'),
        createElem('input', {
          type: 'text',
          'v-model': 'form.username',
          '@blur': () => {
            this.data.touched.username = true;
            this.validateUsername();
          }
        })
      ]),
      createElem('div', {
        class: 'validation-errors',
        'v-memo': ['errors.username', 'touched.username']
      }, [
        this.data.touched.username && this.data.errors.username
          ? createElem('div', { class: 'error' }, this.data.errors.username)
          : null
      ]),
      createElem('div', { class: 'form-group' }, [
        createElem('label', {}, 'Email'),
        createElem('input', {
          type: 'email',
          'v-model': 'form.email',
          '@blur': () => {
            this.data.touched.email = true;
            this.validateEmail();
          }
        })
      ]),
      createElem('div', {
        class: 'validation-errors',
        'v-memo': ['errors.email', 'touched.email']
      }, [
        this.data.touched.email && this.data.errors.email
          ? createElem('div', { class: 'error' }, this.data.errors.email)
          : null
      ]),
      createElem('div', { class: 'form-group' }, [
        createElem('label', {}, 'Password'),
        createElem('input', {
          type: 'password',
          'v-model': 'form.password',
          '@blur': () => {
            this.data.touched.password = true;
            this.validatePassword();
          }
        })
      ]),
      createElem('div', {
        class: 'validation-errors',
        'v-memo': ['errors.password', 'touched.password']
      }, [
        this.data.touched.password && this.data.errors.password
          ? createElem('div', { class: 'error' }, this.data.errors.password)
          : null
      ]),
      createElem('div', { class: 'form-group' }, [
        createElem('label', {}, 'Confirm Password'),
        createElem('input', {
          type: 'password',
          'v-model': 'form.confirmPassword',
          '@blur': () => {
            this.data.touched.confirmPassword = true;
            this.validateConfirmPassword();
          }
        })
      ]),
      createElem('div', {
        class: 'validation-errors',
        'v-memo': ['errors.confirmPassword', 'touched.confirmPassword']
      }, [
        this.data.touched.confirmPassword && this.data.errors.confirmPassword
          ? createElem('div', { class: 'error' }, this.data.errors.confirmPassword)
          : null
      ])
    ]);
  }
});

$.createApp({ App: OptimizedForm }).$mount('#app');
```

## 性能对比示例

```javascript
import 'xrender';

const WithoutMemo = $.component('WithoutMemo', {
  data() {
    return {
      count: 0,
      items: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        value: `Item ${i}`,
        computed: Math.random() * 100
      }))
    };
  },
  render(createElem) {
    return createElem('div', { class: 'without-memo' }, [
      createElem('h2', {}, 'Without v-memo'),
      createElem('button', {
        '@click': () => { this.data.count++; }
      }, `Count: ${this.data.count}`),
      createElem('ul', {},
        this.data.items.map(item =>
          createElem('li', { key: item.id }, [
            createElem('span', {}, item.value),
            createElem('span', {}, ` - ${item.computed.toFixed(2)}`)
          ])
        )
      )
    ]);
  }
});

const WithMemo = $.component('WithMemo', {
  data() {
    return {
      count: 0,
      items: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        value: `Item ${i}`,
        computed: Math.random() * 100
      }))
    };
  },
  render(createElem) {
    return createElem('div', { class: 'with-memo' }, [
      createElem('h2', {}, 'With v-memo'),
      createElem('button', {
        '@click': () => { this.data.count++; }
      }, `Count: ${this.data.count}`),
      createElem('ul', {},
        this.data.items.map(item =>
          createElem('li', {
            key: item.id,
            'v-memo': ['items']
          }, [
            createElem('span', {}, item.value),
            createElem('span', {}, ` - ${item.computed.toFixed(2)}`)
          ])
        )
      )
    ]);
  }
});

const App = $.component('App', {
  render(createElem) {
    return createElem('div', { class: 'app' }, [
      createElem(WithoutMemo, {}),
      createElem('hr', {}),
      createElem(WithMemo, {})
    ]);
  }
});

$.createApp({ App }).$mount('#app');
```
