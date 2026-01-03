# v-memo 指令

v-memo 是一个性能优化指令，用于缓存组件或元素的渲染结果，避免不必要的重新渲染。

## 基本用法

```javascript
const App = $.component('App', {
  data() {
    return {
      items: [
        { id: 1, name: 'Item 1', expensive: 'expensive computation' },
        { id: 2, name: 'Item 2', expensive: 'expensive computation' }
      ],
      filter: ''
    };
  },
  render(createElem) {
    return createElem('div', { class: 'app' }, [
      createElem('input', {
        type: 'text',
        'v-model': 'filter',
        placeholder: 'Filter items'
      }),
      createElem('ul', {}, 
        this.data.items.map(item => 
          createElem('li', { 
            'v-memo': ['items', 'filter']
          }, [
            createElem('span', {}, item.name),
            createElem('span', {}, item.expensive)
          ])
        )
      )
    ]);
  }
});
```

## 语法

### 单个依赖

```javascript
createElem('div', { 'v-memo': 'count' }, content)
```

### 多个依赖

```javascript
createElem('div', { 'v-memo': ['count', 'name'] }, content)
```

### 表达式

```javascript
createElem('div', { 'v-memo': ['items.length'] }, content)
```

## 工作原理

v-memo 指令通过以下机制实现性能优化：

1. **依赖追踪**：记录指定的依赖项
2. **值比较**：在更新时比较依赖项的值
3. **跳过更新**：如果依赖项未变化，跳过重新渲染
4. **深度比较**：使用 JSON.stringify 进行深度比较

## 使用场景

### 1. 长列表渲染

```javascript
const LongList = $.component('LongList', {
  data() {
    return {
      items: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description ${i}`.repeat(10)
      })),
      searchTerm: ''
    };
  },
  computed: {
    filteredItems() {
      return this.data.items.filter(item => 
        item.name.includes(this.data.searchTerm)
      );
    }
  },
  render(createElem) {
    return createElem('div', { class: 'long-list' }, [
      createElem('input', {
        type: 'text',
        'v-model': 'searchTerm',
        placeholder: 'Search...'
      }),
      createElem('ul', {}, 
        this.filteredItems.map(item => 
          createElem('li', { 
            'v-memo': ['searchTerm', `item-${item.id}`]
          }, [
            createElem('h3', {}, item.name),
            createElem('p', {}, item.description)
          ])
        )
      )
    ]);
  }
});
```

### 2. 复杂计算

```javascript
const ComplexComponent = $.component('ComplexComponent', {
  data() {
    return {
      data: {},
      config: {},
      settings: {}
    };
  },
  computed: {
    expensiveResult() {
      return this.performExpensiveComputation();
    }
  },
  methods: {
    performExpensiveComputation() {
      return this.data.value * this.config.multiplier;
    }
  },
  render(createElem) {
    return createElem('div', { 
      'v-memo': ['data', 'config']
    }, [
      createElem('div', {}, `Result: ${this.expensiveResult}`)
    ]);
  }
});
```

### 3. 条件渲染优化

```javascript
const ConditionalRender = $.component('ConditionalRender', {
  data() {
    return {
      showDetails: false,
      user: {
        name: 'John',
        email: 'john@example.com',
        profile: {
          bio: 'Developer',
          skills: ['JavaScript', 'HTML', 'CSS']
        }
      }
    };
  },
  render(createElem) {
    return createElem('div', { class: 'conditional-render' }, [
      createElem('h2', {}, this.data.user.name),
      createElem('button', {
        '@click': () => { this.data.showDetails = !this.data.showDetails; }
      }, 'Toggle Details'),
      this.data.showDetails ? createElem('div', {
        'v-memo': ['user']
      }, [
        createElem('p', {}, this.data.user.email),
        createElem('p', {}, this.data.user.profile.bio),
        createElem('ul', {},
          this.data.user.profile.skills.map(skill =>
            createElem('li', {}, skill)
          )
        )
      ]) : null
    ]);
  }
});
```

### 4. 表单优化

```javascript
const OptimizedForm = $.component('OptimizedForm', {
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: ''
      },
      validation: {
        username: true,
        email: true,
        password: true
      }
    };
  },
  render(createElem) {
    return createElem('form', {}, [
      createElem('input', {
        type: 'text',
        'v-model': 'form.username',
        placeholder: 'Username'
      }),
      createElem('input', {
        type: 'email',
        'v-model': 'form.email',
        placeholder: 'Email'
      }),
      createElem('input', {
        type: 'password',
        'v-model': 'form.password',
        placeholder: 'Password'
      }),
      createElem('div', {
        'v-memo': ['validation']
      }, [
        !this.data.validation.username ? createElem('div', { class: 'error' }, 'Invalid username') : null,
        !this.data.validation.email ? createElem('div', { class: 'error' }, 'Invalid email') : null,
        !this.data.validation.password ? createElem('div', { class: 'error' }, 'Invalid password') : null
      ])
    ]);
  }
});
```

## 性能对比

### 未使用 v-memo

```javascript
const WithoutMemo = $.component('WithoutMemo', {
  data() {
    return {
      count: 0,
      list: Array.from({ length: 100 }, (_, i) => i)
    };
  },
  render(createElem) {
    return createElem('div', {}, [
      createElem('button', {
        '@click': () => { this.data.count++; }
      }, `Count: ${this.data.count}`),
      createElem('ul', {},
        this.data.list.map(item =>
          createElem('li', {}, `Item ${item}`)
        )
      )
    ]);
  }
});
```

### 使用 v-memo

```javascript
const WithMemo = $.component('WithMemo', {
  data() {
    return {
      count: 0,
      list: Array.from({ length: 100 }, (_, i) => i)
    };
  },
  render(createElem) {
    return createElem('div', {}, [
      createElem('button', {
        '@click': () => { this.data.count++; }
      }, `Count: ${this.data.count}`),
      createElem('ul', {},
        this.data.list.map(item =>
          createElem('li', {
            'v-memo': ['list']
          }, `Item ${item}`)
        )
      )
    ]);
  }
});
```

## 注意事项

1. **依赖选择**：只缓存真正需要的依赖，避免过度缓存
2. **性能测试**：使用性能分析工具验证优化效果
3. **内存使用**：缓存会增加内存使用，需要权衡
4. **更新频率**：对于频繁更新的内容，使用 v-memo 可能适得其反

## 最佳实践

### 1. 缓存长列表项

```javascript
createElem('li', { 'v-memo': ['items', index }, content)
```

### 2. 缓存计算结果

```javascript
createElem('div', { 'v-memo': ['data', 'config'] }, result)
```

### 3. 缓存条件内容

```javascript
condition ? createElem('div', { 'v-memo': ['condition'] }, content) : null
```

### 4. 避免过度使用

```javascript
// 不推荐：过度缓存
createElem('div', { 'v-memo': ['all', 'data', 'here'] }, content)

// 推荐：只缓存必要的依赖
createElem('div', { 'v-memo': ['importantData'] }, content)
```

## 与 Vue v-memo 的区别

| 特性 | XRender v-memo | Vue v-memo |
|------|---------------|------------|
| 语法 | `v-memo` | `v-memo` |
| 依赖类型 | 字符串或数组 | 数组 |
| 深度比较 | ✅ 支持 | ✅ 支持 |
| 性能优化 | ✅ 支持 | ✅ 支持 |
| 使用场景 | 长列表、复杂计算 | 长列表、复杂计算 |

## 总结

v-memo 是一个强大的性能优化工具，合理使用可以显著提升应用性能。但需要注意：

- 只在必要时使用
- 选择合适的依赖项
- 进行性能测试验证
- 避免过度优化
