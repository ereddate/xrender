# 最佳实践指南

## 概述

本指南提供了使用 XRender SFC 系统的最佳实践建议，帮助开发者编写高质量、高性能、可维护的代码。

## 组件设计

### 1. 单一职责原则

每个组件应该只负责一个功能。

**推荐:**

```html
<!-- UserCard.xrt -->
<template>
  <div class="user-card">
    <Avatar :src="user.avatar" />
    <UserInfo :name="user.name" :email="user.email" />
  </div>
</template>

<script>
export default {
  props: {
    user: {
      type: Object,
      required: true
    }
  }
};
</script>
```

**不推荐:**

```html
<!-- UserCard.xrt -->
<template>
  <div class="user-card">
    <img :src="user.avatar" />
    <h2>{{ user.name }}</h2>
    <p>{{ user.email }}</p>
    <!-- 包含了太多功能 -->
    <button @click="editUser">编辑</button>
    <button @click="deleteUser">删除</button>
    <button @click="sendMessage">发消息</button>
  </div>
</template>
```

### 2. 组件命名

使用清晰、描述性的组件名称。

**推荐:**

```javascript
// 清晰的命名
UserList
UserProfile
UserSettings
```

**不推荐:**

```javascript
// 不清晰的命名
List
Profile
Settings
```

### 3. Props 定义

始终定义 props 的类型和默认值。

**推荐:**

```javascript
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0,
      validator: (value) => value >= 0
    },
    items: {
      type: Array,
      default: () => []
    },
    user: {
      type: Object,
      default: () => ({})
    }
  }
};
```

**不推荐:**

```javascript
export default {
  props: ['title', 'count', 'items', 'user']
};
```

## 模板编写

### 1. 保持模板简洁

避免在模板中编写复杂的逻辑。

**推荐:**

```html
<template>
  <div class="todo-item">
    <input type="checkbox" v-model="todo.completed" />
    <span :class="{ completed: todo.completed }">
      {{ todoText }}
    </span>
  </div>
</template>

<script>
export default {
  computed: {
    todoText() {
      return this.todo.text.trim();
    }
  }
};
</script>
```

**不推荐:**

```html
<template>
  <div class="todo-item">
    <input type="checkbox" v-model="todo.completed" />
    <span :class="{ completed: todo.completed }">
      {{ todo.text.trim().substring(0, 50) + (todo.text.length > 50 ? '...' : '') }}
    </span>
  </div>
</template>
```

### 2. 使用语义化标签

使用语义化的 HTML 标签。

**推荐:**

```html
<template>
  <article class="post">
    <header>
      <h1>{{ post.title }}</h1>
      <time>{{ post.date }}</time>
    </header>
    <main>
      <p>{{ post.content }}</p>
    </main>
    <footer>
      <button>编辑</button>
      <button>删除</button>
    </footer>
  </article>
</template>
```

**不推荐:**

```html
<template>
  <div class="post">
    <div class="post-header">
      <div class="post-title">{{ post.title }}</div>
      <div class="post-date">{{ post.date }}</div>
    </div>
    <div class="post-content">
      <div>{{ post.content }}</div>
    </div>
    <div class="post-footer">
      <button>编辑</button>
      <button>删除</button>
    </div>
  </div>
</template>
```

### 3. 合理使用指令

根据场景选择合适的指令。

**v-if vs v-show:**

```html
<!-- v-if: 条件不满足时不渲染 DOM -->
<div v-if="isLoggedIn">
  <UserProfile />
</div>

<!-- v-show: 始终渲染 DOM，通过 display 控制显示 -->
<div v-show="isVisible">
  <Modal />
</div>
```

**v-for:**

```html
<!-- 推荐：使用 key -->
<ul>
  <li v-for="item in items" :key="item.id">
    {{ item.name }}
  </li>
</ul>

<!-- 不推荐：使用 index 作为 key -->
<ul>
  <li v-for="(item, index) in items" :key="index">
    {{ item.name }}
  </li>
</ul>
```

## 样式管理

### 1. 使用作用域样式

始终使用作用域样式避免样式冲突。

**推荐:**

```html
<style scoped>
.user-card {
  padding: 20px;
  border: 1px solid #eee;
}
</style>
```

**不推荐:**

```html
<style>
.card {
  padding: 20px;
  border: 1px solid #eee;
}
</style>
```

### 2. 使用 CSS 变量

使用 CSS 变量管理主题和常量。

**推荐:**

```html
<style scoped>
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --border-radius: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}

.button {
  background: var(--primary-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-sm) var(--spacing-md);
}
</style>
```

**不推荐:**

```html
<style scoped>
.button {
  background: #007bff;
  border-radius: 4px;
  padding: 8px 16px;
}
</style>
```

### 3. BEM 命名规范

使用 BEM 命名规范组织样式。

**推荐:**

```html
<template>
  <div class="todo-item todo-item--completed">
    <div class="todo-item__checkbox"></div>
    <div class="todo-item__content"></div>
    <div class="todo-item__actions"></div>
  </div>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  padding: 12px;
}

.todo-item--completed {
  opacity: 0.6;
}

.todo-item__checkbox {
  margin-right: 12px;
}

.todo-item__content {
  flex: 1;
}

.todo-item__actions {
  margin-left: 12px;
}
</style>
```

## 性能优化

### 1. 使用计算属性缓存结果

**推荐:**

```javascript
export default {
  data() {
    return {
      firstName: 'John',
      lastName: 'Doe'
    };
  },
  computed: {
    fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
};
```

**不推荐:**

```javascript
export default {
  methods: {
    getFullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
};
```

### 2. 避免不必要的重新渲染

**推荐:**

```html
<template>
  <div>
    <ExpensiveComponent v-if="shouldRender" />
  </div>
</template>

<script>
export default {
  computed: {
    shouldRender() {
      return this.items.length > 0;
    }
  }
};
</script>
```

**不推荐:**

```html
<template>
  <div>
    <ExpensiveComponent v-show="isVisible" />
  </div>
</template>
```

### 3. 使用组件缓存

**推荐:**

```javascript
import { ComponentCacheManager } from 'xrender/sfc';

const cacheManager = ComponentCacheManager.getInstance();

// 缓存常用组件
cacheManager.cache('Button', ButtonComponent);
cacheManager.cache('Input', InputComponent);
```

### 4. 懒加载组件

**推荐:**

```javascript
export default {
  components: {
    HeavyComponent: () => import('./HeavyComponent.xrt')
  }
};
```

**不推荐:**

```javascript
import HeavyComponent from './HeavyComponent.xrt';

export default {
  components: {
    HeavyComponent
  }
};
```

## 代码组织

### 1. 按功能组织代码

**推荐:**

```javascript
// data
data() {
  return {
    user: null,
    isLoading: false,
    error: null
  };
},

// computed
computed: {
  userName() {
    return this.user?.name || '';
  },
  hasError() {
    return this.error !== null;
  }
},

// methods
methods: {
  async fetchUser() {
    this.isLoading = true;
    try {
      this.user = await api.getUser();
    } catch (error) {
      this.error = error;
    } finally {
      this.isLoading = false;
    }
  }
},

// lifecycle
created() {
  this.fetchUser();
}
```

**不推荐:**

```javascript
export default {
  data() {
    return {
      user: null,
      isLoading: false,
      error: null
    };
  },
  created() {
    this.fetchUser();
  },
  methods: {
    async fetchUser() {
      this.isLoading = true;
      try {
        this.user = await api.getUser();
      } catch (error) {
        this.error = error;
      } finally {
        this.isLoading = false;
      }
    }
  },
  computed: {
    userName() {
      return this.user?.name || '';
    },
    hasError() {
      return this.error !== null;
    }
  }
};
```

### 2. 提取可复用逻辑

**推荐:**

```javascript
// composables/useUser.js
export function useUser() {
  const user = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  async function fetchUser() {
    isLoading.value = true;
    try {
      user.value = await api.getUser();
    } catch (err) {
      error.value = err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    user,
    isLoading,
    error,
    fetchUser
  };
}

// 组件中使用
export default {
  setup() {
    const { user, isLoading, error, fetchUser } = useUser();
    fetchUser();

    return {
      user,
      isLoading,
      error
    };
  }
};
```

### 3. 使用常量管理配置

**推荐:**

```javascript
// constants/config.js
export const API_CONFIG = {
  BASE_URL: 'https://api.example.com',
  TIMEOUT: 5000,
  RETRY_COUNT: 3
};

export const UI_CONFIG = {
  PAGE_SIZE: 20,
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024
};

// 组件中使用
import { API_CONFIG } from './constants/config';

export default {
  methods: {
    async fetchData() {
      const response = await fetch(`${API_CONFIG.BASE_URL}/data`, {
        timeout: API_CONFIG.TIMEOUT
      });
      return response.json();
    }
  }
};
```

## 错误处理

### 1. 使用错误边界

**推荐:**

```javascript
import { ErrorBoundaryManager } from 'xrender/sfc';

const errorBoundary = ErrorBoundaryManager.createErrorBoundary({
  fallback: (error) => {
    return {
      template: '<div class="error">发生错误: {{ error.message }}</div>',
      data() {
        return { error };
      }
    };
  }
});

// 包装组件
const SafeComponent = errorBoundary.wrap(MyComponent);
```

### 2. 异步错误处理

**推荐:**

```javascript
export default {
  methods: {
    async handleSubmit() {
      try {
        await this.submitData();
        this.showSuccessMessage();
      } catch (error) {
        this.handleError(error);
      }
    },
    handleError(error) {
      console.error('提交失败:', error);
      this.errorMessage = error.message;
      this.showErrorNotification();
    }
  }
};
```

**不推荐:**

```javascript
export default {
  methods: {
    async handleSubmit() {
      await this.submitData();
      this.showSuccessMessage();
    }
  }
};
```

### 3. 表单验证

**推荐:**

```javascript
export default {
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: ''
      },
      errors: {}
    };
  },
  methods: {
    validateForm() {
      this.errors = {};

      if (!this.form.username) {
        this.errors.username = '用户名不能为空';
      }

      if (!this.form.email) {
        this.errors.email = '邮箱不能为空';
      } else if (!this.isValidEmail(this.form.email)) {
        this.errors.email = '邮箱格式不正确';
      }

      if (!this.form.password) {
        this.errors.password = '密码不能为空';
      } else if (this.form.password.length < 6) {
        this.errors.password = '密码长度不能少于6位';
      }

      return Object.keys(this.errors).length === 0;
    },
    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    async handleSubmit() {
      if (!this.validateForm()) {
        return;
      }

      try {
        await this.submitForm();
      } catch (error) {
        this.handleError(error);
      }
    }
  }
};
```

## 测试

### 1. 编写单元测试

**推荐:**

```javascript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from './MyComponent.xrt';

describe('MyComponent', () => {
  it('应该正确渲染标题', () => {
    const wrapper = mount(MyComponent, {
      props: {
        title: 'Test Title'
      }
    });
    expect(wrapper.text()).toContain('Test Title');
  });

  it('应该在点击时触发事件', async () => {
    const wrapper = mount(MyComponent);
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
```

### 2. 编写集成测试

**推荐:**

```javascript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ParentComponent from './ParentComponent.xrt';
import ChildComponent from './ChildComponent.xrt';

describe('ParentComponent', () => {
  it('应该正确传递数据到子组件', () => {
    const wrapper = mount(ParentComponent, {
      data() {
        return {
          message: 'Hello from parent'
        };
      }
    });
    
    const child = wrapper.findComponent(ChildComponent);
    expect(child.props('message')).toBe('Hello from parent');
  });
});
```

## 文档

### 1. 编写组件文档

**推荐:**

```javascript
/**
 * 用户卡片组件
 * 
 * @component UserCard
 * @description 显示用户信息的卡片组件
 * 
 * @example
 * <UserCard :user="userData" />
 * 
 * @props {Object} user - 用户对象
 * @props {String} user.name - 用户名
 * @props {String} user.email - 用户邮箱
 * @props {String} user.avatar - 用户头像 URL
 * 
 * @events {Object} click - 点击卡片时触发
 * @events {Object} edit - 点击编辑按钮时触发
 * @events {Object} delete - 点击删除按钮时触发
 */
export default {
  name: 'UserCard',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleClick() {
      this.$emit('click', this.user);
    },
    handleEdit() {
      this.$emit('edit', this.user);
    },
    handleDelete() {
      this.$emit('delete', this.user.id);
    }
  }
};
```

### 2. 编写使用示例

**推荐:**

```html
<!-- UserCard.xrt -->
<template>
  <div class="user-card" @click="handleClick">
    <img :src="user.avatar" :alt="user.name" />
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
    <div class="actions">
      <button @click.stop="handleEdit">编辑</button>
      <button @click.stop="handleDelete">删除</button>
    </div>
  </div>
</template>

<!-- 使用示例 -->
<template>
  <div>
    <UserCard 
      :user="currentUser" 
      @click="handleCardClick"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
```

## 总结

遵循这些最佳实践可以帮助您：

1. 编写更清晰、更易维护的代码
2. 提高应用性能
3. 减少错误和 bug
4. 提升开发效率
5. 改善团队协作

记住，最佳实践不是一成不变的规则，而是根据具体情况灵活应用的指导原则。始终考虑您的具体需求和团队约定。
