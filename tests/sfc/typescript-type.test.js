import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TypeScriptTypeManager } from '../../src/libs/sfc/typescript-type-manager.js';

describe('TypeScript 类型管理器测试', () => {
  let typeManager;
  
  beforeEach(() => {
    typeManager = new TypeScriptTypeManager({
      enableRuntimeChecking: true,
      enableTypeInference: true,
      enableTypeValidation: true,
      strictMode: false,
      generateTypeFiles: false,
      typeCheckLevel: 'basic'
    });
  });
  
  afterEach(() => {
    typeManager.clearAllTypes();
  });

  it('应该能够创建类型管理器实例', () => {
    expect(typeManager).toBeDefined();
    expect(typeManager.typeDefinitions).toBeDefined();
    expect(typeManager.typeCheckers).toBeDefined();
    expect(typeManager.typeValidators).toBeDefined();
    expect(typeManager.typeInferrers).toBeDefined();
    expect(typeManager.sfcTypeMetadata).toBeDefined();
  });

  it('应该能够注册组件类型定义', () => {
    const typeDefinition = {
      props: {
        title: 'string',
        count: 'number',
        isActive: 'boolean',
        items: 'array'
      },
      state: {
        loading: 'boolean',
        error: 'string|null'
      },
      methods: {
        handleClick: 'function',
        fetchData: 'Promise<any>'
      },
      slots: {
        header: 'object',
        footer: 'object'
      },
      events: {
        change: 'CustomEvent',
        select: 'Event'
      }
    };

    typeManager.registerComponentType('TestComponent', typeDefinition);

    expect(typeManager.typeDefinitions.has('TestComponent')).toBe(true);
    
    const registeredType = typeManager.typeDefinitions.get('TestComponent');
    expect(registeredType.props).toEqual(typeDefinition.props);
    expect(registeredType.state).toEqual(typeDefinition.state);
    expect(registeredType.methods).toEqual(typeDefinition.methods);
  });

  it('应该能够生成类型检查器', () => {
    const typeDefinition = {
      props: {
        name: 'string',
        age: 'number'
      }
    };

    typeManager.registerComponentType('ComponentWithCheckers', typeDefinition);

    const checkers = typeManager.typeCheckers.get('ComponentWithCheckers');
    expect(checkers).toBeDefined();
    expect(checkers.props).toBeDefined();
    expect(checkers.state).toBeDefined();
    expect(checkers.methods).toBeDefined();
    expect(checkers.slots).toBeDefined();
    expect(checkers.events).toBeDefined();
  });

  it('应该能够验证Props类型', () => {
    typeManager.registerComponentType('PropsComponent', {
      props: {
        title: 'string',
        count: 'number',
        isVisible: 'boolean'
      }
    });

    const checkers = typeManager.typeCheckers.get('PropsComponent');
    const propsValidator = checkers.props;

    // 正确的props
    const validProps = {
      title: 'Hello',
      count: 42,
      isVisible: true
    };

    const validResult = propsValidator(validProps);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // 错误的props
    const invalidProps = {
      title: 123, // 应该是string
      count: 'not a number', // 应该是number
      isVisible: 'yes' // 应该是boolean
    };

    const invalidResult = propsValidator(invalidProps);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  it('应该能够验证State类型', () => {
    typeManager.registerComponentType('StateComponent', {
      state: {
        loading: 'boolean',
        data: 'object|null',
        error: 'string|null',
        count: 'number'
      }
    });

    const checkers = typeManager.typeCheckers.get('StateComponent');
    const stateValidator = checkers.state;

    const validState = {
      loading: false,
      data: { name: 'test' },
      error: null,
      count: 0
    };

    const result = stateValidator(validState);
    expect(result.valid).toBe(true);
  });

  it('应该能够验证方法类型', () => {
    typeManager.registerComponentType('MethodsComponent', {
      methods: {
        handleSubmit: 'function',
        fetchData: 'Promise<any>',
        calculateSum: '(number, number) => number'
      }
    });

    const checkers = typeManager.typeCheckers.get('MethodsComponent');
    const methodsValidator = checkers.methods;

    const validMethods = {
      handleSubmit: () => {},
      fetchData: Promise.resolve(),
      calculateSum: (a, b) => a + b
    };

    const result = methodsValidator(validMethods);
    expect(result.valid).toBe(true);
  });

  it('应该能够验证插槽类型', () => {
    typeManager.registerComponentType('SlotsComponent', {
      slots: {
        header: 'object',
        footer: 'object',
        content: 'object'
      }
    });

    const checkers = typeManager.typeCheckers.get('SlotsComponent');
    const slotsValidator = checkers.slots;

    const validSlots = {
      header: { name: 'header-slot', props: {} },
      footer: { name: 'footer-slot', props: {} },
      content: { name: 'content-slot', props: { data: 'test' } }
    };

    const result = slotsValidator(validSlots);
    expect(result.valid).toBe(true);
  });

  it('应该能够验证事件类型', () => {
    typeManager.registerComponentType('EventsComponent', {
      events: {
        change: 'CustomEvent',
        click: 'MouseEvent',
        submit: 'Event'
      }
    });

    const checkers = typeManager.typeCheckers.get('EventsComponent');
    const eventsValidator = checkers.events;

    const validEvents = {
      change: new CustomEvent('change'),
      click: new MouseEvent('click'),
      submit: new Event('submit')
    };

    const result = eventsValidator(validEvents);
    expect(result.valid).toBe(true);
  });

  it('应该能够推断类型', () => {
    const testObject = {
      name: 'John',
      age: 30,
      active: true,
      hobbies: ['reading', 'coding'],
      address: {
        city: 'Beijing',
        zipCode: '100000'
      }
    };

    const inferredType = typeManager.inferType(testObject);

    expect(inferredType).toHaveProperty('name');
    expect(inferredType).toHaveProperty('age');
    expect(inferredType).toHaveProperty('active');
    expect(inferredType).toHaveProperty('hobbies');
    expect(inferredType).toHaveProperty('address');

    expect(inferredType.name).toBe('string');
    expect(inferredType.age).toBe('number');
    expect(inferredType.active).toBe('boolean');
    expect(inferredType.hobbies).toBe('array');
    expect(inferredType.address).toBe('object');
  });

  it('应该能够生成TypeScript类型定义', () => {
    const typeDefinition = {
      props: {
        title: 'string',
        items: 'array'
      },
      state: {
        loading: 'boolean'
      }
    };

    typeManager.registerComponentType('GenTypeComponent', typeDefinition);

    const tsDefinition = typeManager.generateTypeDefinition('GenTypeComponent');

    expect(tsDefinition).toContain('interface');
    expect(tsDefinition).toContain('GenTypeComponentProps');
    expect(tsDefinition).toContain('GenTypeComponentState');
    expect(tsDefinition).toContain('title?: string');
    expect(tsDefinition).toContain('items?: array');
  });

  it('应该能够运行时类型检查', () => {
    const result1 = typeManager.validateType('Hello', 'string');
    expect(result1.valid).toBe(true);

    const result2 = typeManager.validateType(123, 'string');
    expect(result2.valid).toBe(false);

    const result3 = typeManager.validateType({ a: 1 }, 'object');
    expect(result3.valid).toBe(true);

    const result4 = typeManager.validateType([1, 2, 3], 'array');
    expect(result4.valid).toBe(true);
  });

  it('应该能够处理泛型类型', () => {
    const genericDefinition = {
      props: {
        data: 'T',
        callback: '(T) => void'
      },
      generics: ['T']
    };

    typeManager.registerComponentType('GenericComponent', genericDefinition);

    const typeDef = typeManager.typeDefinitions.get('GenericComponent');
    expect(typeDef.generics).toEqual(['T']);
  });

  it('应该能够处理联合类型', () => {
    const result1 = typeManager.validateType('hello', 'string|number');
    expect(result1.valid).toBe(true);

    const result2 = typeManager.validateType(123, 'string|number');
    expect(result2.valid).toBe(true);

    const result3 = typeManager.validateType(true, 'string|number');
    expect(result3.valid).toBe(false);
  });

  it('应该能够处理数组类型', () => {
    const result1 = typeManager.validateType([1, 2, 3], 'number[]');
    expect(result1.valid).toBe(true);

    const result2 = typeManager.validateType(['a', 'b', 'c'], 'string[]');
    expect(result2.valid).toBe(true);

    const result3 = typeManager.validateType([1, '2', 3], 'number[]');
    expect(result3.valid).toBe(false);
  });

  it('应该能够处理可选类型', () => {
    const result1 = typeManager.validateType(undefined, 'string?');
    expect(result1.valid).toBe(true);

    const result2 = typeManager.validateType(null, 'string?');
    expect(result2.valid).toBe(true);

    const result3 = typeManager.validateType('hello', 'string?');
    expect(result3.valid).toBe(true);
  });

  it('应该能够处理对象类型', () => {
    const result1 = typeManager.validateType(
      { name: 'John', age: 30 },
      '{ name: string, age: number }'
    );
    expect(result1.valid).toBe(true);

    const result2 = typeManager.validateType(
      { name: 'John' },
      '{ name: string, age: number }'
    );
    expect(result2.valid).toBe(false);
  });

  it('应该能够创建自定义类型验证器', () => {
    const customValidator = (value) => {
      return {
        valid: typeof value === 'string' && value.length > 5,
        errors: value.length <= 5 ? ['String must be longer than 5 characters'] : [],
        warnings: []
      };
    };

    typeManager.registerCustomTypeValidator('longString', customValidator);

    const result1 = typeManager.validateType('Hello World', 'longString');
    expect(result1.valid).toBe(true);

    const result2 = typeManager.validateType('Hi', 'longString');
    expect(result2.valid).toBe(false);
    expect(result2.errors[0]).toContain('longer than 5 characters');
  });

  it('应该能够获取类型信息', () => {
    typeManager.registerComponentType('InfoComponent', {
      props: { name: 'string' }
    });

    const typeInfo = typeManager.getTypeInfo('InfoComponent');
    expect(typeInfo).toBeDefined();
    expect(typeInfo.name).toBe('InfoComponent');
    expect(typeInfo.props).toBeDefined();
  });

  it('应该能够检查类型兼容性', () => {
    const sourceType = { name: 'string', age: 'number' };
    const targetType = { name: 'string', age: 'number', active: 'boolean' };

    const compatible = typeManager.checkTypeCompatibility(sourceType, targetType);
    expect(compatible).toBe(true);

    const incompatibleSource = { name: 'string' };
    const incompatibleTarget = { name: 'number' };

    const notCompatible = typeManager.checkTypeCompatibility(incompatibleSource, incompatibleTarget);
    expect(notCompatible).toBe(false);
  });

  it('应该能够存储SFC类型元数据', () => {
    const sfcMetadata = {
      fileName: 'TestComponent.vue',
      template: '<div>{{title}}</div>',
      script: 'export default { name: "TestComponent" }',
      styles: ['<style scoped>.test { color: red; }</style>']
    };

    typeManager.setSFCTypeMetadata('TestComponent', sfcMetadata);

    const stored = typeManager.getSFCTypeMetadata('TestComponent');
    expect(stored.fileName).toBe('TestComponent.vue');
    expect(stored.template).toBe(sfcMetadata.template);
  });

  it('应该能够导出类型定义', () => {
    typeManager.registerComponentType('ExportComponent1', {
      props: { title: 'string' }
    });

    typeManager.registerComponentType('ExportComponent2', {
      props: { count: 'number' }
    });

    const exported = typeManager.exportTypeDefinitions();

    expect(exported).toHaveProperty('definitions');
    expect(exported.definitions).toHaveProperty('ExportComponent1');
    expect(exported.definitions).toHaveProperty('ExportComponent2');
    expect(exported.definitions.ExportComponent1.props.title).toBe('string');
    expect(exported.definitions.ExportComponent2.props.count).toBe('number');
  });

  it('应该能够导入类型定义', () => {
    const typeData = {
      definitions: {
        'ImportedComponent': {
          props: { name: 'string' },
          state: { loading: 'boolean' }
        }
      }
    };

    typeManager.importTypeDefinitions(typeData);

    expect(typeManager.typeDefinitions.has('ImportedComponent')).toBe(true);
    
    const imported = typeManager.typeDefinitions.get('ImportedComponent');
    expect(imported.props.name).toBe('string');
    expect(imported.state.loading).toBe('boolean');
  });

  it('应该能够清除所有类型定义', () => {
    typeManager.registerComponentType('ClearComponent', {
      props: { test: 'string' }
    });

    expect(typeManager.typeDefinitions.size).toBe(1);
    
    typeManager.clearAllTypes();
    
    expect(typeManager.typeDefinitions.size).toBe(0);
    expect(typeManager.typeCheckers.size).toBe(0);
    expect(typeManager.typeValidators.size).toBe(0);
  });

  it('应该能够获取类型统计信息', () => {
    typeManager.registerComponentType('StatsComponent1', { props: { test1: 'string' } });
    typeManager.registerComponentType('StatsComponent2', { props: { test2: 'number' } });

    const stats = typeManager.getTypeStats();

    expect(stats).toHaveProperty('registeredComponents');
    expect(stats).toHaveProperty('typeCheckers');
    expect(stats).toHaveProperty('typeValidators');
    expect(stats.registeredComponents).toBe(2);
    expect(stats.typeCheckers).toBe(2);
    expect(stats.typeValidators).toBe(2);
  });

  it('应该能够处理严格模式', () => {
    const strictManager = new TypeScriptTypeManager({
      strictMode: true,
      enableRuntimeChecking: true
    });

    strictManager.registerComponentType('StrictComponent', {
      props: {
        name: 'string',
        optional: 'string?'
      }
    });

    const checkers = strictManager.typeCheckers.get('StrictComponent');
    const validator = checkers.props;

    // 在严格模式下，未定义的prop应该报错
    const propsWithExtra = {
      name: 'Test',
      extra: 'value' // 未定义的prop
    };

    const result = validator(propsWithExtra);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});