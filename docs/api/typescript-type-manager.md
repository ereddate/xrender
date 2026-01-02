# TypeScript 类型检查 API

`TypeScriptTypeManager` 是一个强大的运行时类型检查系统，支持组件类型定义、验证和推断。

## 构造函数

```javascript
new TypeScriptTypeManager(options)
```

### 参数

- `options` (Object): 配置选项
  - `enableRuntimeChecking` (Boolean): 是否启用运行时检查，默认 `true`
  - `enableTypeInference` (Boolean): 是否启用类型推断，默认 `true`
  - `enableTypeValidation` (Boolean): 是否启用类型验证，默认 `true`
  - `strictMode` (Boolean): 是否启用严格模式，默认 `false`
  - `generateTypeFiles` (Boolean): 是否生成类型文件，默认 `true`
  - `typeCheckLevel` (String): 类型检查级别，默认 `'basic'`

### 示例

```javascript
const typeManager = new TypeScriptTypeManager({
  strictMode: true,
  enableRuntimeChecking: true
});
```

## 方法

### registerComponentType

注册组件类型定义。

```javascript
typeManager.registerComponentType(componentName, typeDefinition)
```

#### 参数

- `componentName` (String): 组件名称
- `typeDefinition` (Object): 类型定义
  - `props` (Object): Props 类型定义
  - `state` (Object): State 类型定义
  - `methods` (Object): Methods 类型定义
  - `slots` (Object): Slots 类型定义
  - `events` (Object): Events 类型定义
  - `computed` (Object): Computed 类型定义
  - `lifecycle` (Object): Lifecycle 类型定义
  - `generics` (Object): Generics 类型定义

#### 返回值

- `TypeScriptTypeManager`: 返回实例本身，支持链式调用

#### 示例

```javascript
typeManager.registerComponentType('MyComponent', {
  props: {
    value: { type: 'number', required: true },
    label: { type: 'string', default: 'Default' }
  },
  state: {
    count: 'number',
    message: 'string'
  },
  methods: {
    increment: 'function',
    decrement: 'function'
  }
});
```

### checkComponentType

检查组件类型。

```javascript
typeManager.checkComponentType(componentName, component)
```

#### 参数

- `componentName` (String): 组件名称
- `component` (Object): 组件对象

#### 返回值

- `Object`: 验证结果
  - `valid` (Boolean): 是否有效
  - `errors` (Array): 错误数组
  - `warnings` (Array): 警告数组

#### 示例

```javascript
const validation = typeManager.checkComponentType('MyComponent', {
  props: { value: 123, label: 'Test' },
  state: { count: 0, message: 'Hello' },
  methods: {
    increment: () => {},
    decrement: () => {}
  }
});

if (!validation.valid) {
  console.error('类型验证失败:', validation.errors);
}
```

### inferTypes

推断组件类型。

```javascript
typeManager.inferTypes(component)
```

#### 参数

- `component` (Object): 组件对象

#### 返回值

- `Object|null`: 推断的类型定义
  - `props` (Object): 推断的 Props 类型
  - `state` (Object): 推断的 State 类型
  - `methods` (Object): 推断的 Methods 类型
  - `slots` (Object): 推断的 Slots 类型
  - `events` (Object): 推断的 Events 类型

#### 示例

```javascript
const inferred = typeManager.inferTypes({
  props: { value: 123 },
  state: { count: 0 },
  methods: { increment: () => {} }
});

console.log(inferred);
```

### getTypeDefinition

获取类型定义。

```javascript
typeManager.getTypeDefinition(componentName)
```

#### 参数

- `componentName` (String): 组件名称

#### 返回值

- `Object|null`: 类型定义对象

#### 示例

```javascript
const typeDef = typeManager.getTypeDefinition('MyComponent');
console.log(typeDef);
```

### getAllTypeDefinitions

获取所有类型定义。

```javascript
typeManager.getAllTypeDefinitions()
```

#### 返回值

- `Object`: 所有类型定义

#### 示例

```javascript
const allTypes = typeManager.getAllTypeDefinitions();
console.log(allTypes);
```

### generateTypeScriptFile

生成 TypeScript 类型文件。

```javascript
typeManager.generateTypeScriptFile(componentName)
```

#### 参数

- `componentName` (String): 组件名称

#### 返回值

- `String`: TypeScript 类型文件内容

#### 示例

```javascript
const tsContent = typeManager.generateTypeScriptFile('MyComponent');
console.log(tsContent);
```

## 类型定义格式

### Props 类型定义

```javascript
{
  propName: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function',
    required: true | false,
    default: any,
    validator: (value) => boolean,
    shape: Object, // 对象形状
    arrayOf: Object, // 数组元素类型
    oneOf: Array // 联合类型
  }
}
```

### State 类型定义

```javascript
{
  stateKey: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array',
    shape: Object,
    arrayOf: Object,
    oneOf: Array
  }
}
```

### Methods 类型定义

```javascript
{
  methodName: {
    type: 'function',
    params: Array,
    returns: Object
  }
}
```

或简单形式：

```javascript
{
  methodName: 'function'
}
```

### Slots 类型定义

```javascript
{
  slotName: {
    required: true | false,
    scoped: true | false,
    props: Object
  }
}
```

### Events 类型定义

```javascript
{
  eventName: {
    required: true | false,
    payload: Object
  }
}
```

## 使用示例

### 基本使用

```javascript
const typeManager = new TypeScriptTypeManager();

// 注册组件类型
typeManager.registerComponentType('Counter', {
  props: {
    initialValue: {
      type: 'number',
      required: false,
      default: 0
    }
  },
  state: {
    count: 'number',
    message: 'string'
  },
  methods: {
    increment: 'function',
    decrement: 'function',
    reset: 'function'
  }
});

// 验证组件
const component = {
  props: { initialValue: 10 },
  state: { count: 10, message: 'Hello' },
  methods: {
    increment: function() { this.count++; },
    decrement: function() { this.count--; },
    reset: function() { this.count = 0; }
  }
};

const validation = typeManager.checkComponentType('Counter', component);

if (validation.valid) {
  console.log('组件类型验证通过');
} else {
  console.error('验证失败:', validation.errors);
}
```

### 复杂类型定义

```javascript
typeManager.registerComponentType('UserCard', {
  props: {
    user: {
      type: 'object',
      required: true,
      shape: {
        id: { type: 'number' },
        name: { type: 'string' },
        email: { type: 'string' }
      }
    },
    tags: {
      type: 'array',
      required: false,
      arrayOf: { type: 'string' }
    }
  },
  state: {
    loading: 'boolean',
    error: { type: 'string', required: false }
  },
  methods: {
    fetchUser: 'function',
    updateUser: 'function'
  }
});
```

### 自定义验证器

```javascript
typeManager.registerComponentType('EmailInput', {
  props: {
    email: {
      type: 'string',
      required: true,
      validator: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          valid: emailRegex.test(value),
          message: 'Invalid email format'
        };
      }
    }
  }
});
```

### 联合类型

```javascript
typeManager.registerComponentType('FlexibleInput', {
  props: {
    value: {
      type: 'string',
      oneOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' }
      ]
    }
  }
});
```

### 类型推断

```javascript
const component = {
  props: { value: 123, label: 'Test' },
  state: { count: 0, message: 'Hello' },
  methods: { increment: () => {} }
};

const inferred = typeManager.inferTypes(component);
console.log('推断的类型:', inferred);

// 自动注册推断的类型
if (inferred) {
  typeManager.registerComponentType('InferredComponent', inferred);
}
```

### 生成 TypeScript 文件

```javascript
const tsContent = typeManager.generateTypeScriptFile('MyComponent');

// 保存到文件
fs.writeFileSync('MyComponent.types.ts', tsContent);
```

生成的 TypeScript 文件示例：

```typescript
// 自动生成的TypeScript类型定义
// 组件: MyComponent

// Props类型定义
interface Props {
  value: number;
  label?: string;
}

// State类型定义
interface State {
  count: number;
  message: string;
}

// 组件接口
interface MyComponent {
  props: Props;
  state: State;
  methods: {
    increment: () => void;
    decrement: () => void;
  };
}
```

## 错误处理

### 验证错误

```javascript
const validation = typeManager.checkComponentType('MyComponent', component);

if (!validation.valid) {
  validation.errors.forEach(error => {
    console.error('错误:', error);
  });
}

validation.warnings.forEach(warning => {
  console.warn('警告:', warning);
});
```

### 严格模式

```javascript
const typeManager = new TypeScriptTypeManager({
  strictMode: true
});

// 在严格模式下，未定义的属性会被视为错误
const validation = typeManager.checkComponentType('MyComponent', component);
```

## 最佳实践

### 1. 定义完整的类型

```javascript
typeManager.registerComponentType('CompleteComponent', {
  props: { ... },
  state: { ... },
  methods: { ... },
  slots: { ... },
  events: { ... }
});
```

### 2. 使用自定义验证器

```javascript
{
  email: {
    type: 'string',
    validator: (value) => ({
      valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Invalid email format'
    })
  }
}
```

### 3. 利用类型推断

```javascript
const inferred = typeManager.inferTypes(component);
typeManager.registerComponentType('InferredComponent', inferred);
```

### 4. 生成 TypeScript 类型文件

```javascript
const tsContent = typeManager.generateTypeScriptFile('MyComponent');
fs.writeFileSync('MyComponent.types.ts', tsContent);
```

## 相关文档

- [SFC 组件管理系统指南](../guides/sfc-guide.md)
- [生命周期管理器 API](lifecycle-manager.md)
- [组件缓存 API](component-cache.md)
