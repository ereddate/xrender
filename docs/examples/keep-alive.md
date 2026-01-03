# KeepAlive 示例

## 基础示例

```javascript
import 'xrender';

const TabA = $.component('TabA', {
  data() {
    return {
      count: 0
    };
  },
  mounted() {
    console.log('TabA mounted');
  },
  render(createElem) {
    return createElem('div', { class: 'tab-a' }, [
      createElem('h2', {}, 'Tab A'),
      createElem('p', {}, `Count: ${this.data.count}`),
      createElem('button', {
        '@click': () => { this.data.count++; }
      }, 'Increment')
    ]);
  }
});

const TabB = $.component('TabB', {
  data() {
    return {
      message: 'Hello from Tab B'
    };
  },
  mounted() {
    console.log('TabB mounted');
  },
  render(createElem) {
    return createElem('div', { class: 'tab-b' }, [
      createElem('h2', {}, 'Tab B'),
      createElem('p', {}, this.data.message),
      createElem('input', {
        type: 'text',
        'v-model': 'message'
      })
    ]);
  }
});

const App = $.component('App', {
  data() {
    return {
      activeTab: 'a'
    };
  },
  render(createElem) {
    return createElem('div', { class: 'app' }, [
      createElem('div', { class: 'tabs' }, [
        createElem('button', {
          '@click': () => { this.data.activeTab = 'a'; },
          class: this.data.activeTab === 'a' ? 'active' : ''
        }, 'Tab A'),
        createElem('button', {
          '@click': () => { this.data.activeTab = 'b'; },
          class: this.data.activeTab === 'b' ? 'active' : ''
        }, 'Tab B')
      ]),
      createElem('div', { class: 'tab-content' }, [
        this.data.activeTab === 'a' 
          ? createElem(TabA, {})
          : createElem(TabB, {})
      ])
    ]);
  }
});

$.createApp({ App }).$mount('#app');
```

## 使用 KeepAlive

```javascript
import 'xrender';
import { KeepAlive } from 'xrender/libs/keep-alive.js';

const TabA = $.component('TabA', {
  name: 'TabA',
  data() {
    return {
      count: 0
    };
  },
  mounted() {
    console.log('TabA mounted');
  },
  render(createElem) {
    return createElem('div', { class: 'tab-a' }, [
      createElem('h2', {}, 'Tab A'),
      createElem('p', {}, `Count: ${this.data.count}`),
      createElem('button', {
        '@click': () => { this.data.count++; }
      }, 'Increment')
    ]);
  }
});

const TabB = $.component('TabB', {
  name: 'TabB',
  data() {
    return {
      message: 'Hello from Tab B'
    };
  },
  mounted() {
    console.log('TabB mounted');
  },
  render(createElem) {
    return createElem('div', { class: 'tab-b' }, [
      createElem('h2', {}, 'Tab B'),
      createElem('p', {}, this.data.message),
      createElem('input', {
        type: 'text',
        'v-model': 'message'
      })
    ]);
  }
});

const App = $.component('App', {
  data() {
    return {
      activeTab: 'a'
    };
  },
  render(createElem) {
    return createElem('div', { class: 'app' }, [
      createElem('div', { class: 'tabs' }, [
        createElem('button', {
          '@click': () => { this.data.activeTab = 'a'; },
          class: this.data.activeTab === 'a' ? 'active' : ''
        }, 'Tab A'),
        createElem('button', {
          '@click': () => { this.data.activeTab = 'b'; },
          class: this.data.activeTab === 'b' ? 'active' : ''
        }, 'Tab B')
      ]),
      createElem('div', { class: 'tab-content' }, [
        createElem(KeepAlive, {}, [
          this.data.activeTab === 'a' 
            ? createElem(TabA, {})
            : createElem(TabB, {})
        ])
      ])
    ]);
  }
});

$.createApp({ App }).$mount('#app');
```

## 使用 max 属性

```javascript
import 'xrender';
import { KeepAlive } from 'xrender/libs/keep-alive.js';

const App = $.component('App', {
  data() {
    return {
      activeTab: 'a'
    };
  },
  render(createElem) {
    return createElem('div', { class: 'app' }, [
      createElem('div', { class: 'tabs' }, [
        createElem('button', {
          '@click': () => { this.data.activeTab = 'a'; }
        }, 'Tab A'),
        createElem('button', {
          '@click': () => { this.data.activeTab = 'b'; }
        }, 'Tab B'),
        createElem('button', {
          '@click': () => { this.data.activeTab = 'c'; }
        }, 'Tab C')
      ]),
      createElem(KeepAlive, { max: 2 }, [
        this.data.activeTab === 'a' 
          ? createElem(TabA, {})
          : this.data.activeTab === 'b'
          ? createElem(TabB, {})
          : createElem(TabC, {})
      ])
    ]);
  }
});
```

## 使用 include 属性

```javascript
import 'xrender';
import { KeepAlive } from 'xrender/libs/keep-alive.js';

const App = $.component('App', {
  data() {
    return {
      activeTab: 'a'
    };
  },
  render(createElem) {
    return createElem('div', { class: 'app' }, [
      createElem('div', { class: 'tabs' }, [
        createElem('button', {
          '@click': () => { this.data.activeTab = 'a'; }
        }, 'Tab A'),
        createElem('button', {
          '@click': () => { this.data.activeTab = 'b'; }
        }, 'Tab B')
      ]),
      createElem(KeepAlive, { include: 'TabA' }, [
        this.data.activeTab === 'a' 
          ? createElem(TabA, {})
          : createElem(TabB, {})
      ])
    ]);
  }
});
```

## 使用 exclude 属性

```javascript
import 'xrender';
import { KeepAlive } from 'xrender/libs/keep-alive.js';

const App = $.component('App', {
  data() {
    return {
      activeTab: 'a'
    };
  },
  render(createElem) {
    return createElem('div', { class: 'app' }, [
      createElem('div', { class: 'tabs' }, [
        createElem('button', {
          '@click': () => { this.data.activeTab = 'a'; }
        }, 'Tab A'),
        createElem('button', {
          '@click': () => { this.data.activeTab = 'b'; }
        }, 'Tab B')
      ]),
      createElem(KeepAlive, { exclude: 'TabB' }, [
        this.data.activeTab === 'a' 
          ? createElem(TabA, {})
          : createElem(TabB, {})
      ])
    ]);
  }
});
```
