// TypeScript类型检查和支持系统
export class TypeScriptTypeManager {
  constructor(options = {}) {
    this.typeDefinitions = new Map(); // 类型定义存储
    this.typeCheckers = new Map(); // 类型检查器
    this.typeValidators = new Map(); // 类型验证器
    this.typeInferrers = new Map(); // 类型推断器
    this.sfcTypeMetadata = new Map(); // SFC类型元数据
    this.customTypeValidators = new Map(); // 自定义类型验证器
    this.options = {
      enableRuntimeChecking: options.enableRuntimeChecking !== false,
      enableTypeInference: options.enableTypeInference !== false,
      enableTypeValidation: options.enableTypeValidation !== false,
      strictMode: options.strictMode || false,
      generateTypeFiles: options.generateTypeFiles !== false,
      typeCheckLevel: options.typeCheckLevel || 'basic',
      ...options
    };
  }

  // 注册组件类型定义
  registerComponentType(componentName, typeDefinition) {
    const typeConfig = {
      name: componentName,
      props: typeDefinition.props || {},
      state: typeDefinition.state || {},
      methods: typeDefinition.methods || {},
      slots: typeDefinition.slots || {},
      events: typeDefinition.events || {},
      computed: typeDefinition.computed || {},
      lifecycle: typeDefinition.lifecycle || {},
      generics: typeDefinition.generics || {},
      ...typeDefinition
    };

    this.typeDefinitions.set(componentName, typeConfig);
    this._generateTypeCheckers(componentName, typeConfig);
    this._generateTypeValidators(componentName, typeConfig);
    
    return this;
  }

  // 生成类型检查器
  _generateTypeCheckers(componentName, typeConfig) {
    const checkers = {};

    // Props类型检查器
    if (typeConfig.props) {
      checkers.props = this._createPropsTypeChecker(typeConfig.props);
    }

    // State类型检查器
    if (typeConfig.state) {
      checkers.state = this._createStateTypeChecker(typeConfig.state);
    }

    // 方法类型检查器
    if (typeConfig.methods) {
      checkers.methods = this._createMethodsTypeChecker(typeConfig.methods);
    }

    // 插槽类型检查器
    if (typeConfig.slots) {
      checkers.slots = this._createSlotsTypeChecker(typeConfig.slots);
    }

    // 事件类型检查器
    if (typeConfig.events) {
      checkers.events = this._createEventsTypeChecker(typeConfig.events);
    }

    this.typeCheckers.set(componentName, checkers);
  }

  // 创建Props类型检查器
  _createPropsTypeChecker(propsDefinition) {
    return (props) => {
      const errors = [];
      const warnings = [];

      for (const [propName, propType] of Object.entries(propsDefinition)) {
        const propValue = props[propName];
        const validationResult = this._validateTypeSimple(propValue, propType, `props.${propName}`);

        if (!validationResult.valid) {
          errors.push(...validationResult.errors);
        } else if (validationResult.warnings.length > 0) {
          warnings.push(...validationResult.warnings);
        }
      }

      // 检查未定义的props
      for (const propName of Object.keys(props)) {
        if (!propsDefinition[propName]) {
          const message = `未定义的prop: ${propName}`;
          if (this.options.strictMode) {
            errors.push(message);
          } else {
            warnings.push(message);
          }
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    };
  }

  // 创建State类型检查器
  _createStateTypeChecker(stateDefinition) {
    return (state) => {
      const errors = [];
      const warnings = [];

      for (const [stateKey, stateType] of Object.entries(stateDefinition)) {
        const stateValue = state[stateKey];
        const validationResult = this._validateTypeSimple(stateValue, stateType, `state.${stateKey}`);

        if (!validationResult.valid) {
          errors.push(...validationResult.errors);
        } else if (validationResult.warnings.length > 0) {
          warnings.push(...validationResult.warnings);
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    };
  }

  // 创建方法类型检查器
  _createMethodsTypeChecker(methodsDefinition) {
    return (methods) => {
      const errors = [];
      const warnings = [];

      for (const [methodName, methodSignature] of Object.entries(methodsDefinition)) {
        const method = methods[methodName];
        
        if (!method) {
          errors.push(`缺少方法: ${methodName}`);
          continue;
        }

        // 如果 methodSignature 是对象形式（包含 params 和 returns），则只验证方法是否为函数
        if (typeof methodSignature === 'object' && methodSignature !== null) {
          if (typeof method !== 'function') {
            errors.push(`方法 ${methodName} 不是函数类型`);
          }
        } else {
          // 简单类型检查：验证是否为函数或Promise
          const simpleValidation = this._validateTypeSimple(method, methodSignature, `methods.${methodName}`);
          if (!simpleValidation.valid) {
            errors.push(...simpleValidation.errors);
          }
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    };
  }

  // 创建插槽类型检查器
  _createSlotsTypeChecker(slotsDefinition) {
    return (slots) => {
      const errors = [];
      const warnings = [];

      for (const [slotName, slotType] of Object.entries(slotsDefinition)) {
        const slot = slots[slotName];
        
        if (!slot) {
          if (slotType.required) {
            errors.push(`缺少必需的插槽: ${slotName}`);
          }
          continue;
        }

        const validationResult = this._validateSlotType(slot, slotType, slotName);
        if (!validationResult.valid) {
          errors.push(...validationResult.errors);
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    };
  }

  // 创建事件类型检查器
  _createEventsTypeChecker(eventsDefinition) {
    return (events) => {
      const errors = [];
      const warnings = [];

      for (const [eventName, eventType] of Object.entries(eventsDefinition)) {
        const event = events[eventName];
        
        if (!event) {
          if (eventType.required) {
            errors.push(`缺少必需的事件: ${eventName}`);
          }
          continue;
        }

        const validationResult = this._validateEventType(event, eventType, eventName);
        if (!validationResult.valid) {
          errors.push(...validationResult.errors);
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    };
  }

  // 类型验证
  _validateType(value, typeDefinition, path) {
    const errors = [];
    const warnings = [];

    if (typeDefinition.required && (value === undefined || value === null)) {
      errors.push(`${path} 是必需的但未提供`);
      return { valid: false, errors, warnings };
    }

    if (value === undefined || value === null) {
      return { valid: true, errors, warnings };
    }

    // 基本类型检查
    const basicTypeValidation = this._validateBasicType(value, typeDefinition.type, path);
    errors.push(...basicTypeValidation.errors);
    warnings.push(...basicTypeValidation.warnings);

    // 复杂类型验证
    if (typeDefinition.shape) {
      const shapeValidation = this._validateShape(value, typeDefinition.shape, path);
      errors.push(...shapeValidation.errors);
      warnings.push(...shapeValidation.warnings);
    }

    // 数组类型验证
    if (typeDefinition.arrayOf) {
      const arrayValidation = this._validateArrayOf(value, typeDefinition.arrayOf, path);
      errors.push(...arrayValidation.errors);
      warnings.push(...arrayValidation.warnings);
    }

    // 联合类型验证
    if (typeDefinition.oneOf) {
      const oneOfValidation = this._validateOneOf(value, typeDefinition.oneOf, path);
      errors.push(...oneOfValidation.errors);
      warnings.push(...oneOfValidation.warnings);
    }

    // 自定义验证器
    if (typeDefinition.validator && typeof typeDefinition.validator === 'function') {
      try {
        const customValidation = typeDefinition.validator(value);
        if (!customValidation.valid) {
          errors.push(...customValidation.errors || [customValidation.message]);
        }
      } catch (error) {
        errors.push(`${path} 自定义验证器执行失败: ${error.message}`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // 基本类型验证
  _validateBasicType(value, expectedType, path) {
    const errors = [];
    const warnings = [];

    if (!expectedType) {
      return { valid: true, errors, warnings };
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (expectedType === 'any') {
      return { valid: true, errors, warnings };
    }

    if (expectedType === actualType) {
      return { valid: true, errors, warnings };
    }

    // 特殊类型处理
    if (expectedType === 'function' && typeof value === 'function') {
      return { valid: true, errors, warnings };
    }

    if (expectedType === 'array' && Array.isArray(value)) {
      return { valid: true, errors, warnings };
    }

    if (expectedType === 'object' && typeof value === 'object' && value !== null) {
      return { valid: true, errors, warnings };
    }

    // 类型不匹配警告（严格模式下为错误）
    const message = `${path} 类型不匹配: 期望 ${expectedType}, 实际 ${actualType}`;
    
    if (this.options.strictMode) {
      errors.push(message);
    } else {
      warnings.push(message);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // 对象形状验证
  _validateShape(value, shapeDefinition, path) {
    const errors = [];
    const warnings = [];

    if (typeof value !== 'object' || value === null) {
      errors.push(`${path} 期望为对象类型`);
      return { valid: false, errors, warnings };
    }

    for (const [shapeKey, shapeType] of Object.entries(shapeDefinition)) {
      const shapeValue = value[shapeKey];
      const shapePath = `${path}.${shapeKey}`;
      const validationResult = this._validateType(shapeValue, shapeType, shapePath);
      
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // 数组元素类型验证
  _validateArrayOf(value, elementType, path) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(value)) {
      errors.push(`${path} 期望为数组类型`);
      return { valid: false, errors, warnings };
    }

    value.forEach((element, index) => {
      const elementPath = `${path}[${index}]`;
      const validationResult = this._validateType(element, elementType, elementPath);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  // 联合类型验证
  _validateOneOf(value, allowedTypes, path) {
    const errors = [];
    const warnings = [];

    for (const allowedType of allowedTypes) {
      const validationResult = this._validateType(value, allowedType, path);
      if (validationResult.valid) {
        return { valid: true, errors: [], warnings: [] };
      }
    }

    errors.push(`${path} 的值不符合任何允许的类型: ${allowedTypes.map(t => t.type || t).join(', ')}`);
    return { valid: false, errors, warnings };
  }

  // 插槽类型验证
  _validateSlotType(slot, slotType, slotName) {
    const errors = [];

    if (slotType.required && !slot) {
      errors.push(`插槽 ${slotName} 是必需的但未提供`);
      return { valid: false, errors };
    }

    if (slotType.scoped !== undefined && !!slotType.scoped !== !!slot.scoped) {
      errors.push(`插槽 ${slotName} 作用域属性不匹配`);
    }

    if (slotType.props && slot && slot.props) {
      const propsValidation = this._validateShape(slot.props, slotType.props, `slot.${slotName}.props`);
      errors.push(...propsValidation.errors);
    }

    return { valid: errors.length === 0, errors };
  }

  // 事件类型验证
  _validateEventType(event, eventType, eventName) {
    const errors = [];

    if (eventType.required && !event) {
      errors.push(`事件 ${eventName} 是必需的但未提供`);
      return { valid: false, errors };
    }

    if (event && eventType.payload) {
      const payloadValidation = this._validateType(event.payload, eventType.payload, `event.${eventName}.payload`);
      errors.push(...payloadValidation.errors);
    }

    return { valid: errors.length === 0, errors };
  }

  // 方法参数验证
  _validateMethodParams(method, paramsDefinition) {
    const errors = [];

    try {
      // 使用Function.prototype.toString获取函数签名
      const fnStr = method.toString();
      const paramCount = (fnStr.match(/\([^)]*\)/) || [''])[0]
        .replace(/[()]/g, '')
        .split(',')
        .filter(p => p.trim()).length;

      if (paramsDefinition.length !== paramCount) {
        errors.push(`方法参数数量不匹配: 期望 ${paramsDefinition.length}, 实际 ${paramCount}`);
      }
    } catch (error) {
      errors.push(`无法验证方法参数: ${error.message}`);
    }

    return errors;
  }

  // 方法返回值验证
  _validateMethodReturn(method, returnType) {
    const errors = [];

    try {
      // 这里应该实际调用方法并检查返回值
      // 由于运行时限制，这里只做基本的类型推断
      const fnStr = method.toString();
      const hasReturn = fnStr.includes('return') || fnStr.includes('=>');
      
      if (!hasReturn && returnType.type !== 'void') {
        errors.push('方法缺少返回语句');
      }
    } catch (error) {
      errors.push(`无法验证方法返回值: ${error.message}`);
    }

    return { valid: errors.length === 0, errors };
  }

  // 生成类型验证器
  _generateTypeValidators(componentName, typeConfig) {
    const validators = {};

    // 完整的组件验证器
    validators.component = (component) => {
      const errors = [];
      const warnings = [];

      // 验证props
      if (component.props && typeConfig.props) {
        const propsChecker = this.typeCheckers.get(componentName)?.props;
        if (propsChecker) {
          const result = propsChecker(component.props);
          if (!result.valid) {
            errors.push(...result.errors);
          }
          warnings.push(...result.warnings);
        }
      }

      // 验证state
      if (component.state && typeConfig.state) {
        const stateChecker = this.typeCheckers.get(componentName)?.state;
        if (stateChecker) {
          const result = stateChecker(component.state);
          if (!result.valid) {
            errors.push(...result.errors);
          }
          warnings.push(...result.warnings);
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    };

    this.typeValidators.set(componentName, validators);
  }

  // 类型推断
  inferTypes(component) {
    if (!this.options.enableTypeInference) {
      return null;
    }

    const inferred = {
      props: this._inferPropsType(component),
      state: this._inferStateType(component),
      methods: this._inferMethodsType(component),
      slots: this._inferSlotsType(component),
      events: this._inferEventsType(component)
    };

    return inferred;
  }

  // 推断Props类型
  _inferPropsType(component) {
    const props = component.props || {};
    const inferred = {};

    for (const [propName, propValue] of Object.entries(props)) {
      inferred[propName] = {
        type: this._inferBasicType(propValue),
        required: propValue === undefined
      };
    }

    return inferred;
  }

  // 推断State类型
  _inferStateType(component) {
    const state = component.state || {};
    const inferred = {};

    for (const [stateKey, stateValue] of Object.entries(state)) {
      inferred[stateKey] = {
        type: this._inferBasicType(stateValue)
      };
    }

    return inferred;
  }

  // 推断方法类型
  _inferMethodsType(component) {
    const methods = component.methods || {};
    const inferred = {};

    for (const [methodName, method] of Object.entries(methods)) {
      if (typeof method === 'function') {
        inferred[methodName] = {
          type: 'function',
          params: this._inferMethodParams(method),
          returns: this._inferMethodReturn(method)
        };
      }
    }

    return inferred;
  }

  // 推断插槽类型
  _inferSlotsType(component) {
    // 简化的插槽推断
    return component.slots || {};
  }

  // 推断事件类型
  _inferEventsType(component) {
    // 简化的事件推断
    return component.events || {};
  }

  // 推断基本类型
  _inferBasicType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  // 推断方法参数
  _inferMethodParams(method) {
    try {
      const fnStr = method.toString();
      const paramsMatch = fnStr.match(/\(([^)]*)\)/);
      if (paramsMatch) {
        const params = paramsMatch[1].split(',').map(p => p.trim()).filter(p => p);
        return params.map(param => ({
          name: param,
          type: 'unknown'
        }));
      }
    } catch (error) {
      // 忽略错误
    }
    return [];
  }

  // 推断方法返回值
  _inferMethodReturn(method) {
    try {
      const fnStr = method.toString();
      const hasReturn = fnStr.includes('return');
      return {
        type: hasReturn ? 'unknown' : 'void'
      };
    } catch (error) {
      return { type: 'unknown' };
    }
  }

  // 检查组件类型
  checkComponentType(componentName, component) {
    const validators = this.typeValidators.get(componentName);
    if (!validators) {
      return { valid: false, errors: [`组件类型定义不存在: ${componentName}`] };
    }

    return validators.component(component);
  }

  // 获取类型定义
  getTypeDefinition(componentName) {
    return this.typeDefinitions.get(componentName);
  }

  // 获取所有类型定义
  getAllTypeDefinitions() {
    return Object.fromEntries(this.typeDefinitions);
  }

  // 生成TypeScript类型文件
  generateTypeScriptFile(componentName) {
    const typeDef = this.typeDefinitions.get(componentName);
    if (!typeDef) {
      throw new Error(`类型定义不存在: ${componentName}`);
    }

    let tsContent = `// 自动生成的TypeScript类型定义\n`;
    tsContent += `// 组件: ${componentName}\n\n`;

    // 生成Props类型
    if (typeDef.props) {
      tsContent += this._generatePropsType(typeDef.props);
    }

    // 生成State类型
    if (typeDef.state) {
      tsContent += this._generateStateType(typeDef.state);
    }

    // 生成组件接口
    tsContent += this._generateComponentInterface(typeDef);

    return tsContent;
  }

  // 生成Props类型定义
  _generatePropsType(props) {
    let tsContent = `// Props类型定义\n`;
    tsContent += `interface ${this._capitalizeFirst('Props')} {\n`;
    
    for (const [propName, propType] of Object.entries(props)) {
      const tsType = this._convertToTypeScriptType(propType);
      const required = propType.required ? '' : '?';
      tsContent += `  ${propName}${required}: ${tsType};\n`;
    }
    
    tsContent += `}\n\n`;
    return tsContent;
  }

  // 生成State类型定义
  _generateStateType(state) {
    let tsContent = `// State类型定义\n`;
    tsContent += `interface ${this._capitalizeFirst('State')} {\n`;
    
    for (const [stateKey, stateType] of Object.entries(state)) {
      const tsType = this._convertToTypeScriptType(stateType);
      tsContent += `  ${stateKey}: ${tsType};\n`;
    }
    
    tsContent += `}\n\n`;
    return tsContent;
  }

  // 生成组件接口
  _generateComponentInterface(typeDef) {
    const interfaceName = this._capitalizeFirst(typeDef.name || 'Component');
    
    let tsContent = `// 组件接口\n`;
    tsContent += `interface ${interfaceName} {\n`;
    tsContent += `  props: ${this._capitalizeFirst('Props')};\n`;
    
    if (typeDef.state) {
      tsContent += `  state: ${this._capitalizeFirst('State')};\n`;
    }
    
    if (typeDef.methods) {
      for (const [methodName, methodType] of Object.entries(typeDef.methods)) {
        const methodSignature = this._generateMethodSignature(methodType);
        tsContent += `  ${methodName}: ${methodSignature};\n`;
      }
    }
    
    tsContent += `}\n\n`;
    return tsContent;
  }

  // 转换为TypeScript类型
  _convertToTypeScriptType(typeDef) {
    if (typeof typeDef === 'string') {
      return this._mapBasicTypeToTS(typeDef);
    }
    
    if (typeDef.type) {
      return this._mapBasicTypeToTS(typeDef.type);
    }
    
    if (typeDef.shape) {
      const shapeTypes = Object.entries(typeDef.shape)
        .map(([key, value]) => `${key}: ${this._convertToTypeScriptType(value)}`)
        .join('; ');
      return `{ ${shapeTypes} }`;
    }
    
    if (typeDef.arrayOf) {
      return `${this._convertToTypeScriptType(typeDef.arrayOf)}[]`;
    }
    
    if (typeDef.oneOf) {
      return typeDef.oneOf.map(t => this._convertToTypeScriptType(t)).join(' | ');
    }
    
    return 'any';
  }

  // 映射基本类型到TypeScript
  _mapBasicTypeToTS(type) {
    const typeMap = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'array': 'any[]',
      'object': 'object',
      'function': 'Function',
      'undefined': 'undefined',
      'null': 'null',
      'any': 'any'
    };
    
    return typeMap[type] || 'any';
  }

  // 生成方法签名
  _generateMethodSignature(methodType) {
    if (methodType.params && methodType.returns) {
      const params = methodType.params.map(p => `${p.name}: ${p.type || 'any'}`).join(', ');
      const returnType = methodType.returns.type || 'any';
      return `(${params}) => ${returnType}`;
    }
    
    return 'Function';
  }

  // 首字母大写
  _capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // 导出类型定义
  exportTypeDefinitions() {
    return {
      definitions: Object.fromEntries(this.typeDefinitions),
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  // 导入类型定义
  importTypeDefinitions(data) {
    if (data.definitions) {
      for (const [componentName, typeDef] of Object.entries(data.definitions)) {
        this.registerComponentType(componentName, typeDef);
      }
    }
    return this;
  }

  // 清理类型定义
  clearTypeDefinitions(componentName = null) {
    if (componentName) {
      this.typeDefinitions.delete(componentName);
      this.typeCheckers.delete(componentName);
      this.typeValidators.delete(componentName);
    } else {
      this.typeDefinitions.clear();
      this.typeCheckers.clear();
      this.typeValidators.clear();
    }
    return this;
  }

  // 获取统计信息
  getStats() {
    return {
      registeredComponents: this.typeDefinitions.size,
      typeCheckers: this.typeCheckers.size,
      typeValidators: this.typeValidators.size,
      runtimeCheckingEnabled: this.options.enableRuntimeChecking,
      typeInferenceEnabled: this.options.enableTypeInference,
      strictMode: this.options.strictMode
    };
  }

  // 销毁
  destroy() {
    this.clearTypeDefinitions();
    this.typeInferrers.clear();
    this.sfcTypeMetadata.clear();
  }

  // 设置SFC类型元数据
  setSFCTypeMetadata(componentName, metadata) {
    this.sfcTypeMetadata.set(componentName, {
      ...metadata,
      timestamp: Date.now()
    });
    return this;
  }

  // 获取SFC类型元数据
  getSFCTypeMetadata(componentName) {
    return this.sfcTypeMetadata.get(componentName);
  }

  // 清除所有类型定义
  clearAllTypes() {
    this.clearTypeDefinitions();
    this.typeInferrers.clear();
    this.sfcTypeMetadata.clear();
    return this;
  }

  // 获取类型统计信息
  getTypeStats() {
    return this.getStats();
  }

  // 推断类型
  inferType(obj) {
    if (!this.options.enableTypeInference) {
      return null;
    }

    const inferred = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null) {
        inferred[key] = 'null';
      } else if (value === undefined) {
        inferred[key] = 'undefined';
      } else if (Array.isArray(value)) {
        inferred[key] = 'array';
      } else if (typeof value === 'object') {
        inferred[key] = 'object';
      } else {
        inferred[key] = typeof value;
      }
    }

    return inferred;
  }

  // 生成TypeScript类型定义
  generateTypeDefinition(componentName) {
    const typeDef = this.typeDefinitions.get(componentName);
    if (!typeDef) {
      throw new Error(`类型定义不存在: ${componentName}`);
    }

    let tsContent = '';

    // 生成Props类型
    if (typeDef.props) {
      tsContent += `interface ${componentName}Props {\n`;
      for (const [propName, propType] of Object.entries(typeDef.props)) {
        const tsType = this._convertSimpleTypeToTS(propType);
        tsContent += `  ${propName}?: ${tsType};\n`;
      }
      tsContent += `}\n\n`;
    }

    // 生成State类型
    if (typeDef.state) {
      tsContent += `interface ${componentName}State {\n`;
      for (const [stateKey, stateType] of Object.entries(typeDef.state)) {
        const tsType = this._convertSimpleTypeToTS(stateType);
        tsContent += `  ${stateKey}: ${tsType};\n`;
      }
      tsContent += `}\n\n`;
    }

    return tsContent;
  }

  // 运行时类型检查
  validateType(value, typeString) {
    const errors = [];
    const warnings = [];

    const result = this._validateTypeSimple(value, typeString, 'value');
    return result;
  }

  // 简单类型验证（支持字符串类型定义）
  _validateTypeSimple(value, typeString, path) {
    const errors = [];
    const warnings = [];

    // 处理可选类型
    if (typeString.endsWith('?')) {
      if (value === undefined || value === null) {
        return { valid: true, errors: [], warnings: [] };
      }
      typeString = typeString.slice(0, -1);
    }

    // 处理联合类型
    if (typeString.includes('|')) {
      const types = typeString.split('|').map(t => t.trim());
      for (const type of types) {
        const result = this._validateTypeSimple(value, type, path);
        if (result.valid) {
          return { valid: true, errors: [], warnings: [] };
        }
      }
      errors.push(`${path} 的值不符合任何允许的类型: ${typeString}`);
      return { valid: false, errors, warnings };
    }

    // 处理数组类型
    if (typeString.endsWith('[]')) {
      const elementType = typeString.slice(0, -2);
      if (!Array.isArray(value)) {
        errors.push(`${path} 期望为数组类型`);
        return { valid: false, errors, warnings };
      }
      for (let i = 0; i < value.length; i++) {
        const result = this._validateTypeSimple(value[i], elementType, `${path}[${i}]`);
        if (!result.valid) {
          errors.push(...result.errors);
        }
      }
      return { valid: errors.length === 0, errors, warnings };
    }

    // 处理对象类型
    if (typeString.startsWith('{') && typeString.endsWith('}')) {
      if (typeof value !== 'object' || value === null) {
        errors.push(`${path} 期望为对象类型`);
        return { valid: false, errors, warnings };
      }
      // 简化的对象类型检查
      const content = typeString.slice(1, -1).trim();
      if (content) {
        const properties = content.split(',').map(p => p.trim());
        for (const prop of properties) {
          const [propName, propType] = prop.split(':').map(s => s.trim());
          if (propName && propType) {
            const result = this._validateTypeSimple(value[propName], propType, `${path}.${propName}`);
            if (!result.valid) {
              errors.push(...result.errors);
            }
          }
        }
      }
      return { valid: errors.length === 0, errors, warnings };
    }

    // 检查自定义类型验证器
    if (this.customTypeValidators.has(typeString)) {
      const customValidator = this.customTypeValidators.get(typeString);
      const result = customValidator(value);
      if (!result.valid) {
        errors.push(...result.errors);
      }
      return { valid: errors.length === 0, errors, warnings };
    }

    // 基本类型检查
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    if (typeString === 'function' && actualType === 'function') {
      return { valid: true, errors: [], warnings: [] };
    }
    
    if (typeString === 'array' && Array.isArray(value)) {
      return { valid: true, errors: [], warnings: [] };
    }
    
    if (typeString === 'object' && typeof value === 'object' && value !== null) {
      return { valid: true, errors: [], warnings: [] };
    }

    // 处理 Promise 类型
    if (typeString.startsWith('Promise')) {
      return { valid: true, errors: [], warnings: [] };
    }

    // 处理函数签名类型
    if (typeString.includes('=>')) {
      return { valid: true, errors: [], warnings: [] };
    }

    // 特殊处理 null 类型
    if (typeString === 'null' && value === null) {
      return { valid: true, errors: [], warnings: [] };
    }

    if (typeString !== actualType) {
      errors.push(`${path} 类型不匹配: 期望 ${typeString}, 实际 ${actualType}`);
      return { valid: false, errors, warnings };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  // 注册自定义类型验证器
  registerCustomTypeValidator(typeName, validator) {
    if (typeof validator !== 'function') {
      throw new Error('验证器必须是函数');
    }
    this.customTypeValidators.set(typeName, validator);
    return this;
  }

  // 获取类型信息
  getTypeInfo(componentName) {
    const typeDef = this.typeDefinitions.get(componentName);
    if (!typeDef) {
      return null;
    }
    
    return {
      name: componentName,
      props: typeDef.props,
      state: typeDef.state,
      methods: typeDef.methods,
      slots: typeDef.slots,
      events: typeDef.events,
      generics: typeDef.generics
    };
  }

  // 检查类型兼容性
  checkTypeCompatibility(sourceType, targetType) {
    for (const [key, sourceValueType] of Object.entries(sourceType)) {
      const targetValueType = targetType[key];
      
      if (!targetValueType) {
        return false;
      }
      
      if (sourceValueType !== targetValueType) {
        return false;
      }
    }
    
    return true;
  }

  // 转换简单类型为TypeScript类型
  _convertSimpleTypeToTS(typeString) {
    if (typeString.endsWith('?')) {
      return this._convertSimpleTypeToTS(typeString.slice(0, -1)) + ' | null | undefined';
    }
    
    if (typeString.includes('|')) {
      return typeString.split('|').map(t => this._convertSimpleTypeToTS(t.trim())).join(' | ');
    }
    
    if (typeString.endsWith('[]')) {
      const elementType = typeString.slice(0, -2);
      return this._convertSimpleTypeToTS(elementType) + '[]';
    }
    
    // 保留原始类型字符串
    return typeString;
  }
}

// 全局TypeScript类型管理器实例
export const typeScriptTypeManager = new TypeScriptTypeManager();

// 便捷方法
export const registerComponentType = (name, typeDef) => 
  typeScriptTypeManager.registerComponentType(name, typeDef);

export const checkComponentType = (name, component) => 
  typeScriptTypeManager.checkComponentType(name, component);

export const inferComponentTypes = (component) => 
  typeScriptTypeManager.inferTypes(component);

export const generateTypeScriptFile = (componentName) => 
  typeScriptTypeManager.generateTypeScriptFile(componentName);

export const getTypeStats = () => 
  typeScriptTypeManager.getStats();