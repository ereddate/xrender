# KeepAlive 组件

KeepAlive 是一个内置组件，用于缓存组件实例，避免重复创建和销毁，从而提升性能。

## 基本用法

```javascript
import { KeepAlive } from 'xrender';

const App = $.component('App', {
  data() {
    return {
      currentTab: 'home'
    };
  },
  render(createElem) {
    return createElem('div', { class: 'app' }, [
      createElem('div', { class: 'tabs' }, [
        createElem('button', {
          '@click': () => { this.data.currentTab = 'home'; }
        }, '首页'),
        createElem('button', {
          '@click': () => { this.data.currentTab = 'about'; }
        }, '关于')
      ]),
      createElem(KeepAlive, {}, [
        this.data.currentTab === 'home' 
          ? createElem(Home, {})
          : createElem(About, {})
      ])
    ]);
  }
});
```

## Props

### max

最大缓存组件数量，默认值为 10。

```javascript
createElem(KeepAlive, { max: 5 }, [
  createElem(Component, {})
])
```

### include

只有名称匹配的组件会被缓存。支持字符串、正则表达式或数组。

```javascript
createElem(KeepAlive, { include: 'Home' }, [
  createElem(Home, {}),
  createElem(About, {})
])

// 使用正则表达式
createElem(KeepAlive, { include: /^Home/ }, [
  createElem(Home, {}),
  createElem(HomeDetail, {})
])

// 使用数组
createElem(KeepAlive, { include: ['Home', 'About'] }, [
  createElem(Home, {}),
  createElem(About, {})
])
```

### exclude

任何名称匹配的组件都不会被缓存。支持字符串、正则表达式或数组。

```javascript
createElem(KeepAlive, { exclude: 'About' }, [
  createElem(Home, {}),
  createElem(About, {})
])
```

## 工作原理

KeepAlive 组件通过以下机制实现组件缓存：

1. **缓存机制**：使用 Map 数据结构存储缓存的组件实例
2. **LRU 策略**：采用最近最少使用（LRU）策略管理缓存
3. **生命周期管理**：正确处理组件的挂载、更新和卸载
4. **内存管理**：当缓存数量超过 max 时，自动清理最久未使用的组件

## 使用场景

### 1. 标签页切换

```javascript
const TabContent = $.component('TabContent', {
  props: ['tab'],
  data() {
    return {
      content: `Tab ${this.props.tab} content`
    };
  },
  mounted() {
    console.log(`Tab ${this.props.tab} mounted`);
  },
  render(createElem) {
    return createElem('div', { class: 'tab-content' }, this.data.content);
  }
});

const App = $.component('App', {
  data() {
    return {
      activeTab: 'tab1'
    };
  },
  render(createElem) {
    return createElem('div', { class: 'app' }, [
      createElem('div', { class: 'tabs' }, [
        ['tab1', 'tab2', 'tab3'].map(tab => 
          createElem('button', {
            '@click': () => { this.data.activeTab = tab; },
            class: this.data.activeTab === tab ? 'active' : ''
          }, tab)
        )
      ]),
      createElem(KeepAlive, {}, [
        createElem(TabContent, { tab: this.data.activeTab })
      ])
    ]);
  }
});
```

### 2. 路由缓存

```javascript
const RouterView = $.component('RouterView', {
  data() {
    return {
      currentRoute: window.location.pathname
    };
  },
  render(createElem) {
    const route = this.data.currentRoute;
    let component;
    
    switch(route) {
      case '/':
        component = createElem(Home, {});
        break;
      case '/about':
        component = createElem(About, {});
        break;
      case '/contact':
        component = createElem(Contact, {});
        break;
    }
    
    return createElem(KeepAlive, {}, [component]);
  }
});
```

### 3. 表单缓存

```javascript
const FormStep = $.component('FormStep', {
  props: ['step'],
  data() {
    return {
      formData: {}
    };
  },
  render(createElem) {
    return createElem('form', {}, [
      createElem('input', {
        type: 'text',
        placeholder: `Step ${this.props.step}`,
        'v-model': 'formData.value'
      })
    ]);
  }
});

const MultiStepForm = $.component('MultiStepForm', {
  data() {
    return {
      currentStep: 1
    };
  },
  render(createElem) {
    return createElem('div', { class: 'multi-step-form' }, [
      createElem('div', { class: 'steps' }, [
        [1, 2, 3].map(step => 
          createElem('button', {
            '@click': () => { this.data.currentStep = step; }
          }, `Step ${step}`)
        )
      ]),
      createElem(KeepAlive, {}, [
        createElem(FormStep, { step: this.data.currentStep })
      ])
    ]);
  }
});
```

## 注意事项

1. **组件名称**：确保组件有唯一的名称，用于缓存键
2. **内存使用**：合理设置 max 值，避免内存占用过高
3. **生命周期**：缓存的组件不会触发 mounted 和 unmounted 钩子
4. **状态保持**：缓存的组件会保持其状态和数据

## 性能优化

KeepAlive 可以显著提升以下场景的性能：

- 频繁切换的标签页
- 路由切换
- 表单多步骤
- 动态组件

## 与 Vue KeepAlive 的区别

| 特性 | XRender KeepAlive | Vue KeepAlive |
|------|------------------|---------------|
| 缓存策略 | LRU | LRU |
| max 属性 | ✅ 支持 | ✅ 支持 |
| include 属性 | ✅ 支持 | ✅ 支持 |
| exclude 属性 | ✅ 支持 | ✅ 支持 |
| 生命周期钩子 | ✅ 支持 | ✅ 支持 |
| 缓存键 | 组件名称 | 组件名称或 key |
| 默认缓存数量 | 10 | 10 |
