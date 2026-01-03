---
title: 组件
description: 深入了解 XRender 组件系统
---

# 组件

组件是 XRender 的核心概念，它允许你将 UI 拆分成独立、可复用的部分。

## 定义组件

### 基础组件

```javascript
const MyComponent = $.component('MyComponent', {
  data() {
    return {
      message: 'Hello, World!'
    };
  },
  methods: {
    greet() {
      console.log(this.data.message);
    }
  },
  render(createElem) {
    return createElem('div', { class: 'my-component' }, [
      createElem('h1', {}, this.data.message),
      createElem('button', { 
        onclick: () => this.greet() 
      }, 'Greet')
    ]);
  }
});
```

### Props 传递

```javascript
const ChildComponent = $.component('ChildComponent', {
  props: {
    title: String,
    count: Number
  },
  render(createElem) {
    return createElem('div', {}, [
      createElem('h2', {}, this.props.title),
      createElem('p', {}, `Count: ${this.props.count}`)
    ]);
  }
});

const ParentComponent = $.component('ParentComponent', {
  render(createElem) {
    return createElem('div', {}, [
      createElem(ChildComponent, {
        props: {
          title: 'Child Component',
          count: 42
        }
      })
    ]);
  }
});
```

### 组件通信

#### 父子通信

```javascript
const Child = $.component('Child', {
  props: ['value'],
  methods: {
    handleClick() {
      this.$emit('update', this.props.value + 1);
    }
  },
  render(createElem) {
    return createElem('button', { 
      onclick: () => this.handleClick() 
    }, `Value: ${this.props.value}`);
  }
});

const Parent = $.component('Parent', {
  data() {
    return {
      count: 0
    };
  },
  methods: {
    handleUpdate(newVal) {
      this.data.count = newVal;
    }
  },
  render(createElem) {
    return createElem('div', {}, [
      createElem('p', {}, `Parent Count: ${this.data.count}`),
      createElem(Child, {
        props: {
          value: this.data.count,
          onUpdate: (newVal) => this.handleUpdate(newVal)
        }
      })
    ]);
  }
});
```

### 插槽（Slots）

```javascript
const Card = $.component('Card', {
  render(createElem) {
    return createElem('div', { class: 'card' }, [
      createElem('div', { class: 'card-header' }, this.props.title),
      createElem('div', { class: 'card-body' }, this.props.default),
      createElem('div', { class: 'card-footer' }, this.props.footer)
    ]);
  }
});

const App = $.component('App', {
  render(createElem) {
    return createElem(Card, {
      props: {
        title: 'Card Title',
        default: createElem('p', {}, 'Card content goes here'),
        footer: createElem('button', {}, 'Action')
      }
    });
  }
});
```

## 生命周期

组件提供完整的生命周期钩子：

```javascript
const LifecycleComponent = $.component('LifecycleComponent', {
  data() {
    return {
      message: 'Component Data'
    };
  },
  created() {
    console.log('Component created');
  },
  mounted() {
    console.log('Component mounted');
    console.log('DOM element:', this.$el);
  },
  updated() {
    console.log('Component updated');
  },
  beforeDestroy() {
    console.log('Component about to be destroyed');
  },
  destroyed() {
    console.log('Component destroyed');
  },
  render(createElem) {
    return createElem('div', {}, this.data.message);
  }
});
```

## 组件缓存

使用 KeepAlive 缓存组件实例，避免重复创建和销毁：

```javascript
import { KeepAlive } from 'xrender/keep-alive';

const App = $.component('App', {
  data() {
    return {
      currentTab: 'home'
    };
  },
  methods: {
    switchTab(tab) {
      this.data.currentTab = tab;
    }
  },
  render(createElem) {
    return createElem('div', {}, [
      createElem('nav', {}, [
        createElem('button', { 
          onclick: () => this.switchTab('home') 
        }, 'Home'),
        createElem('button', { 
          onclick: () => this.switchTab('about') 
        }, 'About')
      ]),
      createElem(KeepAlive, {
        props: {
          max: 2
        }
      }, [
        this.data.currentTab === 'home' ? 
          createElem(HomeComponent) : 
          createElem(AboutComponent)
      ])
    ]);
  }
});
```

## 动态组件

```javascript
const App = $.component('App', {
  data() {
    return {
      currentComponent: 'ComponentA'
    };
  },
  methods: {
    switchComponent() {
      this.data.currentComponent = 
        this.data.currentComponent === 'ComponentA' ? 
        'ComponentB' : 'ComponentA';
    }
  },
  render(createElem) {
    const Component = this.data.currentComponent === 'ComponentA' ? 
      ComponentA : ComponentB;
    
    return createElem('div', {}, [
      createElem('button', { 
        onclick: () => this.switchComponent() 
      }, 'Switch Component'),
      createElem(Component)
    ]);
  }
});
```

## 组件最佳实践

1. **单一职责**：每个组件只负责一个功能
2. **Props 验证**：为 props 添加类型验证
3. **命名规范**：使用有意义的组件名称
4. **避免过度嵌套**：保持组件层级合理
5. **复用性**：设计可复用的通用组件

## 下一步

- [响应式系统](/guide/reactivity) - 学习响应式原理
- [生命周期](/guide/lifecycle) - 深入了解生命周期
- [指令](/guide/directives) - 掌握指令的使用
